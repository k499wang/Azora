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
  artifactRatio: number; // 0..1 fraction of beats corrected
  usable: boolean;       // false if too many / too-long artifact runs
}

const HRV_TARGET_RMSSD = 60;
const HRV_ARTIFACT_WINDOW = 3;
const HRV_ARTIFACT_RELATIVE_THRESHOLD = 0.28;
const HRV_ARTIFACT_MAD_THRESHOLD = 3.5;
const HRV_ARTIFACT_ABSOLUTE_THRESHOLD_MS = 40;
const HRV_DRR_PAIR_THRESHOLD = 0.2;
const HRV_MAX_ARTIFACT_RUN = 2;
const HRV_MAX_ARTIFACT_RATIO = 0.05;
const HRV_MIN_CLEAN_ANCHORS = 4;

export interface HRVPreprocessResult {
  correctedIbi: number[];
  adjacencyBreaks: boolean[];
  artifactIndices: number[];
  artifactRatio: number;
  maxRunLength: number;
  usable: boolean;
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

function findArtifactRuns(mask: boolean[]): { start: number; end: number }[] {
  const runs: { start: number; end: number }[] = [];
  let i = 0;
  while (i < mask.length) {
    if (!mask[i]) {
      i += 1;
      continue;
    }
    const start = i;
    while (i < mask.length && mask[i]) i += 1;
    runs.push({ start, end: i - 1 });
  }
  return runs;
}

export function preprocessHRVIntervals(
  ibi: number[],
  sourceAdjacencyBreaks?: boolean[],
): HRVPreprocessResult {
  if (ibi.length === 0) {
    return {
      correctedIbi: [],
      adjacencyBreaks: [],
      artifactIndices: [],
      artifactRatio: 0,
      maxRunLength: 0,
      usable: false,
    };
  }

  const artifactMask = detectHrvArtifacts(ibi);
  const runs = findArtifactRuns(artifactMask);
  const maxRunLength = runs.reduce((m, r) => Math.max(m, r.end - r.start + 1), 0);

  let firstClean = 0;
  while (firstClean < ibi.length && artifactMask[firstClean]) firstClean += 1;
  let lastClean = ibi.length - 1;
  while (lastClean >= 0 && artifactMask[lastClean]) lastClean -= 1;

  if (firstClean > lastClean) {
    return {
      correctedIbi: [],
      adjacencyBreaks: [],
      artifactIndices: [],
      artifactRatio: 1,
      maxRunLength,
      usable: false,
    };
  }

  const trimmed = ibi.slice(firstClean, lastClean + 1);
  const trimmedMask = artifactMask.slice(firstClean, lastClean + 1);

  const interiorArtifactIndices: number[] = [];
  for (let i = 0; i < trimmedMask.length; i++) {
    if (trimmedMask[i]) interiorArtifactIndices.push(i);
  }

  const artifactRatio = trimmed.length > 0 ? interiorArtifactIndices.length / trimmed.length : 0;
  const cleanedIbi: number[] = [];
  const cleanedAdjacencyBreaks: boolean[] = [];
  let previousRawIndex: number | null = null;

  for (let i = 0; i < trimmed.length; i++) {
    if (trimmedMask[i]) continue;

    const rawIndex = firstClean + i;
    const hasSkippedInterval =
      previousRawIndex != null && rawIndex - previousRawIndex > 1;
    let hasSourceBreak = false;

    if (previousRawIndex != null) {
      for (let j = previousRawIndex + 1; j <= rawIndex; j++) {
        if (sourceAdjacencyBreaks?.[j]) {
          hasSourceBreak = true;
          break;
        }
      }
    }

    cleanedIbi.push(trimmed[i]);
    cleanedAdjacencyBreaks.push(
      previousRawIndex == null ? Boolean(sourceAdjacencyBreaks?.[rawIndex]) : hasSkippedInterval || hasSourceBreak,
    );
    previousRawIndex = rawIndex;
  }

  const usable =
    maxRunLength <= HRV_MAX_ARTIFACT_RUN &&
    artifactRatio <= HRV_MAX_ARTIFACT_RATIO &&
    cleanedIbi.length >= HRV_MIN_CLEAN_ANCHORS;

  return {
    correctedIbi: cleanedIbi,
    adjacencyBreaks: cleanedAdjacencyBreaks,
    artifactIndices: interiorArtifactIndices,
    artifactRatio,
    maxRunLength,
    usable,
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
      artifactRatio: 0,
      usable: false,
    };
  }

  const {
    correctedIbi,
    adjacencyBreaks: cleanedAdjacencyBreaks,
    artifactRatio,
    usable,
  } = preprocessHRVIntervals(ibi, adjacencyBreaks);

  if (!usable || correctedIbi.length < 2) {
    const meanIbiUnusable = mean(correctedIbi);
    return {
      rmssd: 0,
      sdnn: 0,
      stress: 0,
      pnn50: 0,
      meanHr: meanIbiUnusable > 0 ? ibiToBpm(meanIbiUnusable) : 0,
      minHr: 0,
      maxHr: 0,
      hrDrop: 0,
      durationSec: Math.round(correctedIbi.reduce((s, v) => s + v, 0) / 1000),
      beatCount: correctedIbi.length,
      score: 0,
      artifactRatio,
      usable: false,
    };
  }

  let sumSq = 0;
  let nn50 = 0;
  let pairs = 0;
  let nn50Pairs = 0;
  for (let i = 1; i < correctedIbi.length; i++) {
    if (cleanedAdjacencyBreaks[i]) continue;
    const localStart = Math.max(0, i - 5);
    const local = median(correctedIbi.slice(localStart, i + 1));
    if (local <= 0) continue;
    const dev = Math.abs(correctedIbi[i] - local) / local;
    const devPrev = Math.abs(correctedIbi[i - 1] - local) / local;
    if (dev > 0.35 || devPrev > 0.35) continue;

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
    artifactRatio,
    usable: true,
  };
}
