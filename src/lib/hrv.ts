/**
 * HRV statistics derived from inter-beat (RR / IBI) intervals captured by the
 * PPG signal pipeline (HeartRateManager). All inputs are arrays of intervals
 * in milliseconds, in chronological order.
 */

export interface HRVStats {
  rmssd: number;       // ms — short-term variability (parasympathetic)
  sdnn: number;        // ms — overall variability
  stress: number;      // 0..100 stress index
  pnn50: number;       // %  — pairs of beats differing by >50ms
  meanHr: number;      // bpm
  minHr: number;       // bpm (over the hold)
  maxHr: number;       // bpm (over the hold)
  hrDrop: number;      // bpm (start HR − end HR, positive = HR dropped)
  durationSec: number; // s
  beatCount: number;
  score: number;       // 0..100 composite (RMSSD vs 60ms target)
}

const HRV_TARGET_RMSSD = 60;
const HRV_ARTIFACT_WINDOW = 3;
const HRV_ARTIFACT_RELATIVE_THRESHOLD = 0.28;
const HRV_ARTIFACT_MAD_THRESHOLD = 3.5;
const HRV_ARTIFACT_ABSOLUTE_THRESHOLD_MS = 40;
const HRV_DRR_PAIR_THRESHOLD = 0.2;

export interface HRVPreprocessResult {
  correctedIbi: number[];
  artifactIndices: number[];
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance =
    values.reduce((sum, v) => sum + (v - m) * (v - m), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function linearDetrend(values: number[]): number[] {
  const n = values.length;
  if (n < 3) return values;
  const xMean = (n - 1) / 2;
  const yMean = mean(values);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean);
    den += (i - xMean) * (i - xMean);
  }
  if (den === 0) return values;
  const slope = num / den;
  return values.map((v, i) => v - slope * (i - xMean));
}

function medianAbsoluteDeviation(values: number[], center: number): number {
  if (values.length === 0) return 0;
  const deviations = values.map((value) => Math.abs(value - center));
  return median(deviations);
}

function getWindow(values: number[], index: number, radius: number): number[] {
  const start = Math.max(0, index - radius);
  const end = Math.min(values.length, index + radius + 1);
  return values.slice(start, end);
}

function detectHrvArtifacts(ibi: number[]): boolean[] {
  const artifactMask = new Array(ibi.length).fill(false);
  if (ibi.length < 3) return artifactMask;

  for (let i = 0; i < ibi.length; i++) {
    const windowStart = Math.max(0, i - HRV_ARTIFACT_WINDOW);
    const window = getWindow(ibi, i, HRV_ARTIFACT_WINDOW);
    const centerIndex = i - windowStart;
    const windowWithoutCurrent = window.filter((_, windowIndex) => windowIndex !== centerIndex);

    const center = windowWithoutCurrent.length > 0 ? median(windowWithoutCurrent) : median(ibi);
    const mad = medianAbsoluteDeviation(windowWithoutCurrent.length > 0 ? windowWithoutCurrent : ibi, center);
    const scale = Math.max(
      HRV_ARTIFACT_ABSOLUTE_THRESHOLD_MS,
      center * HRV_ARTIFACT_RELATIVE_THRESHOLD,
      mad * 1.4826 * HRV_ARTIFACT_MAD_THRESHOLD,
    );

    if (Math.abs(ibi[i] - center) > scale) {
      artifactMask[i] = true;
    }
  }

  for (let i = 1; i < ibi.length - 1; i++) {
    const localCenter = median(getWindow(ibi, i, HRV_ARTIFACT_WINDOW));
    const leftDelta = ibi[i] - ibi[i - 1];
    const rightDelta = ibi[i + 1] - ibi[i];
    const leftMagnitude = Math.abs(leftDelta);
    const rightMagnitude = Math.abs(rightDelta);
    const pairThreshold = Math.max(
      HRV_ARTIFACT_ABSOLUTE_THRESHOLD_MS,
      localCenter * HRV_DRR_PAIR_THRESHOLD,
    );

    const signReversal = Math.sign(leftDelta) !== Math.sign(rightDelta);
    const hasStrongPair = leftMagnitude > pairThreshold && rightMagnitude > pairThreshold;
    const shortLongPattern =
      ibi[i] < localCenter * (1 - HRV_ARTIFACT_RELATIVE_THRESHOLD) &&
      ibi[i + 1] > localCenter * (1 + HRV_ARTIFACT_RELATIVE_THRESHOLD);
    const longShortPattern =
      ibi[i] > localCenter * (1 + HRV_ARTIFACT_RELATIVE_THRESHOLD) &&
      ibi[i + 1] < localCenter * (1 - HRV_ARTIFACT_RELATIVE_THRESHOLD);

    if ((signReversal && hasStrongPair) || shortLongPattern || longShortPattern) {
      artifactMask[i] = true;
      artifactMask[i + 1] = true;
    }
  }

  return artifactMask;
}

function interpolateArtifactRuns(ibi: number[], artifactMask: boolean[]): number[] {
  if (ibi.length === 0) return [];

  const corrected = [...ibi];
  let index = 0;

  while (index < corrected.length) {
    if (!artifactMask[index]) {
      index += 1;
      continue;
    }

    const runStart = index;
    while (index < corrected.length && artifactMask[index]) {
      index += 1;
    }
    const runEnd = index - 1;

    let leftIndex = runStart - 1;
    while (leftIndex >= 0 && artifactMask[leftIndex]) {
      leftIndex -= 1;
    }

    let rightIndex = runEnd + 1;
    while (rightIndex < corrected.length && artifactMask[rightIndex]) {
      rightIndex += 1;
    }

    const leftValue = leftIndex >= 0 ? corrected[leftIndex] : null;
    const rightValue = rightIndex < corrected.length ? corrected[rightIndex] : null;
    const span = runEnd - runStart + 2;

    for (let i = runStart; i <= runEnd; i++) {
      if (leftValue != null && rightValue != null) {
        const position = i - runStart + 1;
        corrected[i] = leftValue + ((rightValue - leftValue) * position) / span;
      } else if (leftValue != null) {
        corrected[i] = leftValue;
      } else if (rightValue != null) {
        corrected[i] = rightValue;
      } else {
        corrected[i] = median(ibi);
      }
    }
  }

  return corrected;
}

export function preprocessHRVIntervals(ibi: number[]): HRVPreprocessResult {
  if (ibi.length === 0) {
    return {
      correctedIbi: [],
      artifactIndices: [],
    };
  }

  const artifactMask = detectHrvArtifacts(ibi);
  const artifactIndices = artifactMask
    .map((isArtifact, index) => (isArtifact ? index : null))
    .filter((index): index is number => index != null);

  if (artifactIndices.length === 0) {
    return {
      correctedIbi: [...ibi],
      artifactIndices: [],
    };
  }

  return {
    correctedIbi: interpolateArtifactRuns(ibi, artifactMask),
    artifactIndices,
  };
}

function ibiToBpm(ibiMs: number): number {
  if (ibiMs <= 0) return 0;
  return Math.round(60000 / ibiMs);
}

export function computeHRVStats(ibi: number[], adjacencyBreaks?: boolean[]): HRVStats {
  if (ibi.length < 2) {
    return {
      rmssd: 0,
      sdnn: 0,
      stress: 0,
      pnn50: 0,
      meanHr: 0,
      minHr: 0,
      maxHr: 0,
      hrDrop: 0,
      durationSec: 0,
      beatCount: ibi.length,
      score: 0,
    };
  }

  const { correctedIbi } = preprocessHRVIntervals(ibi);

  let sumSq = 0;
  let nn50 = 0;
  let pairs = 0;
  let nn50Pairs = 0;
  for (let i = 1; i < correctedIbi.length; i++) {
    if (adjacencyBreaks?.[i]) continue;
    const localStart = Math.max(0, i - 5);
    const local = median(correctedIbi.slice(localStart, i + 1));
    if (local <= 0) continue;
    const dev = Math.abs(correctedIbi[i] - local) / local;
    const devPrev = Math.abs(correctedIbi[i - 1] - local) / local;
    if (dev > 0.20 || devPrev > 0.20) continue;

    const diff = correctedIbi[i] - correctedIbi[i - 1];
    sumSq += diff * diff;
    pairs += 1;
    if (Math.abs(diff) > 50) nn50 += 1;
    nn50Pairs += 1;
  }
  const rmssd = pairs > 0 ? Math.round(Math.sqrt(sumSq / pairs)) : 0;
  const sdnn = Math.round(stddev(linearDetrend(correctedIbi)));
  const pnn50 = nn50Pairs > 0 ? Math.round((nn50 / nn50Pairs) * 100) : 0;

  const rmssdScore = Math.max(0, 100 - (rmssd / HRV_TARGET_RMSSD) * 100);
  const meanIbi = mean(correctedIbi);
  const meanHr = ibiToBpm(meanIbi);
  const hrScore = Math.max(0, (meanHr - 50) / 30 * 100);
  const stress = Math.max(
    0,
    Math.min(100, Math.round(rmssdScore * 0.7 + hrScore * 0.3)),
  );
  const sortedIbi = [...correctedIbi].sort((a, b) => a - b);
  const p5Index = Math.min(sortedIbi.length - 1, Math.floor(sortedIbi.length * 0.05));
  const p95Index = Math.min(sortedIbi.length - 1, Math.floor(sortedIbi.length * 0.95));
  const minHr = ibiToBpm(sortedIbi[p95Index]);
  const maxHr = ibiToBpm(sortedIbi[p5Index]);

  const window = Math.max(2, Math.floor(correctedIbi.length * 0.15));
  const startHr = ibiToBpm(mean(correctedIbi.slice(0, window)));
  const endHr = ibiToBpm(mean(correctedIbi.slice(-window)));
  const hrDrop = startHr - endHr;

  const durationSec = Math.round(correctedIbi.reduce((sum, ms) => sum + ms, 0) / 1000);
  const score = Math.max(0, Math.min(100, Math.round((rmssd / HRV_TARGET_RMSSD) * 100)));

  return {
    rmssd,
    sdnn,
    stress,
    pnn50,
    meanHr,
    minHr,
    maxHr,
    hrDrop,
    durationSec,
    beatCount: correctedIbi.length,
    score,
  };
}
