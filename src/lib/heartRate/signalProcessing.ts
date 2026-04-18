import type {
  HeartRateEstimate,
  PpgChannel,
  PpgFrameSample,
  PpgQuality,
  PpgRoiSample,
} from './types';

const MIN_DURATION_MS = 8000;
const STABILIZATION_MS = 2500;
const MIN_RESAMPLED_SAMPLES = 96;
const TARGET_SAMPLE_RATE_MIN = 15;
const TARGET_SAMPLE_RATE_MAX = 30;
const FREQ_STEP = 0.01;
const BPM_FREQ_MIN = 0.67; // 40 bpm
const BPM_FREQ_MAX = 3.0; // 180 bpm
const MIN_SNR_DB = 2.5;
const MIN_CONFIDENCE = 0.45;
const MAX_FREQ_PEAK_DIFF_BPM = 12;
const MAX_LIGHTING_DRIFT_RATIO = 0.30;
const MAX_LIGHTING_JUMP_RATIO = 0.08;
const MAX_LIGHTING_JUMP_FRACTION = 0.08;
const CHANNELS: PpgChannel[] = ['weighted', 'red', 'green', 'redRatio'];
const BEAT_DETECTION_WINDOW_MS = 5000;
const MIN_BEAT_INTERVAL_MS = 320;
const MAX_BEAT_DETECTION_LAG_MS = 450;

export interface ComputeBpmOptions {
  minDurationMs?: number;
  stabilizationMs?: number;
  minResampledSamples?: number;
  minSnrDb?: number;
  minConfidence?: number;
  requirePeakAgreement?: boolean;
  fallbackSnrDbWithoutPeaks?: number;
}

// Tightened vs the original preview: the live path now requires frequency/peak
// agreement and a higher SNR floor. Stops the BPM from jittering on noisy
// candidates that the one-shot estimator would have rejected.
export const PREVIEW_BPM_OPTIONS: ComputeBpmOptions = {
  minDurationMs: 6000,
  stabilizationMs: 1500,
  minResampledSamples: 80,
  minSnrDb: 2.5,
  minConfidence: 0.4,
  requirePeakAgreement: true,
  fallbackSnrDbWithoutPeaks: 6.5,
};

interface ResolvedComputeBpmOptions {
  minDurationMs: number;
  stabilizationMs: number;
  minResampledSamples: number;
  minSnrDb: number;
  minConfidence: number;
  requirePeakAgreement: boolean;
  fallbackSnrDbWithoutPeaks: number;
}

const DEFAULT_COMPUTE_OPTIONS: ResolvedComputeBpmOptions = {
  minDurationMs: MIN_DURATION_MS,
  stabilizationMs: STABILIZATION_MS,
  minResampledSamples: MIN_RESAMPLED_SAMPLES,
  minSnrDb: MIN_SNR_DB,
  minConfidence: MIN_CONFIDENCE,
  requirePeakAgreement: true,
  fallbackSnrDbWithoutPeaks: 7,
};

interface CandidateSeries {
  roiId: string;
  channel: PpgChannel;
  timestamps: number[];
  values: number[];
  meanSaturatedPct: number;
  meanDarkPct: number;
}

interface FrequencyResult {
  bpm: number;
  snrDb: number;
  score: number;
}

interface PeakResult {
  bpm: number;
  consistency: number;
  peaks: number[];
}

export interface BeatDetectionResult {
  timestamp: number;
  confidence: number;
  roiId: string;
  channel: PpgChannel;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / values.length);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function makeOddWindow(samples: number): number {
  const rounded = Math.max(1, Math.round(samples));
  return rounded % 2 === 0 ? rounded + 1 : rounded;
}

function movingAverage(values: number[], windowSize: number): number[] {
  const window = makeOddWindow(windowSize);
  const half = Math.floor(window / 2);
  const result: number[] = [];

  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - half);
    const end = Math.min(values.length, i + half + 1);
    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += values[j];
    }
    result.push(sum / (end - start));
  }

  return result;
}

function winsorize(values: number[], threshold = 5): number[] {
  const center = median(values);
  const deviations = values.map((value) => Math.abs(value - center));
  const mad = median(deviations) || standardDeviation(values) || 1;
  const scale = 1.4826 * mad;
  const min = center - threshold * scale;
  const max = center + threshold * scale;
  return values.map((value) => clamp(value, min, max));
}

function lightingIsStable(values: number[]): boolean {
  if (values.length < 8) return false;

  const avgValue = mean(values);
  if (avgValue <= 0) return false;

  const windowSize = Math.max(3, Math.round(values.length * 0.15));
  const startMean = mean(values.slice(0, windowSize));
  const endMean = mean(values.slice(-windowSize));
  const driftRatio = Math.abs(endMean - startMean) / avgValue;

  if (driftRatio > MAX_LIGHTING_DRIFT_RATIO) return false;

  let jumpCount = 0;
  for (let i = 1; i < values.length; i++) {
    const previous = Math.max(1, values[i - 1]);
    const jumpRatio = Math.abs(values[i] - values[i - 1]) / previous;
    if (jumpRatio > MAX_LIGHTING_JUMP_RATIO) {
      jumpCount += 1;
    }
  }

  return jumpCount / Math.max(1, values.length - 1) <= MAX_LIGHTING_JUMP_FRACTION;
}

function channelValue(roi: PpgRoiSample, channel: PpgChannel): number {
  switch (channel) {
    case 'red':
      return roi.r;
    case 'green':
      return roi.g;
    case 'blue':
      return roi.b;
    case 'redRatio': {
      const total = roi.r + roi.g + roi.b;
      return total > 0 ? (roi.r / total) * 255 : 0;
    }
    case 'weighted':
    default:
      return roi.r * 0.67 + roi.g * 0.33;
  }
}

function resolveOptions(options: ComputeBpmOptions = {}): ResolvedComputeBpmOptions {
  return {
    ...DEFAULT_COMPUTE_OPTIONS,
    ...options,
  };
}

function estimateSampleRate(timestamps: number[]): number | null {
  const deltas: number[] = [];
  for (let i = 1; i < timestamps.length; i++) {
    const delta = timestamps[i] - timestamps[i - 1];
    if (delta > 0 && delta < 250) {
      deltas.push(delta);
    }
  }

  if (deltas.length < 8) return null;

  const medianDelta = median(deltas);
  if (medianDelta <= 0) return null;

  return clamp(Math.round(1000 / medianDelta), TARGET_SAMPLE_RATE_MIN, TARGET_SAMPLE_RATE_MAX);
}

function resampleUniform(
  series: CandidateSeries,
  options: ResolvedComputeBpmOptions,
): { values: number[]; sampleRate: number } | null {
  if (series.timestamps.length < 2) return null;

  const sampleRate = estimateSampleRate(series.timestamps);
  if (sampleRate == null) return null;

  const start = series.timestamps[0];
  const end = series.timestamps[series.timestamps.length - 1];
  const durationMs = end - start;
  if (durationMs < options.minDurationMs) return null;

  const stepMs = 1000 / sampleRate;
  const values: number[] = [];
  let sourceIndex = 0;

  for (let target = start; target <= end; target += stepMs) {
    while (
      sourceIndex < series.timestamps.length - 2 &&
      series.timestamps[sourceIndex + 1] < target
    ) {
      sourceIndex += 1;
    }

    const t0 = series.timestamps[sourceIndex];
    const t1 = series.timestamps[sourceIndex + 1];
    const v0 = series.values[sourceIndex];
    const v1 = series.values[sourceIndex + 1];

    if (t1 == null || v1 == null || t1 <= t0) {
      values.push(v0);
      continue;
    }

    const ratio = clamp((target - t0) / (t1 - t0), 0, 1);
    values.push(v0 + (v1 - v0) * ratio);
  }

  return values.length >= options.minResampledSamples ? { values, sampleRate } : null;
}

function preprocess(values: number[], sampleRate: number): number[] {
  const baseline = movingAverage(values, sampleRate * 1.5);
  const acDc = values.map((value, index) => {
    const base = Math.abs(baseline[index]) < 1 ? 1 : baseline[index];
    return (value - base) / base;
  });
  const clipped = winsorize(acDc);
  const slowTrend = movingAverage(clipped, sampleRate * 2);
  const detrended = clipped.map((value, index) => value - slowTrend[index]);
  return movingAverage(detrended, sampleRate * 0.12);
}

function goertzel(signal: number[], targetFreq: number, sampleRate: number): number {
  const n = signal.length;
  const k = (targetFreq / sampleRate) * n;
  const omega = (2 * Math.PI * k) / n;
  const cosine = Math.cos(omega);
  const coeff = 2 * cosine;

  let prev1 = 0;
  let prev2 = 0;

  for (let i = 0; i < n; i++) {
    const current = coeff * prev1 - prev2 + signal[i];
    prev2 = prev1;
    prev1 = current;
  }

  return prev1 * prev1 + prev2 * prev2 - prev1 * prev2 * coeff;
}

function frequencyEstimate(signal: number[], sampleRate: number): FrequencyResult | null {
  const nyquist = sampleRate / 2;
  const frequencies: number[] = [];
  const scores: number[] = [];

  for (let freq = BPM_FREQ_MIN; freq <= BPM_FREQ_MAX; freq += FREQ_STEP) {
    if (freq >= nyquist) break;

    const basePower = goertzel(signal, freq, sampleRate);
    const harmonic2 = freq * 2 < nyquist ? goertzel(signal, freq * 2, sampleRate) * 0.5 : 0;
    const harmonic3 = freq * 3 < nyquist ? goertzel(signal, freq * 3, sampleRate) * 0.25 : 0;
    frequencies.push(freq);
    scores.push(basePower + harmonic2 + harmonic3);
  }

  if (scores.length === 0) return null;

  let peakIndex = 0;
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > scores[peakIndex]) {
      peakIndex = i;
    }
  }

  const peakFreq = frequencies[peakIndex];
  const peakScore = scores[peakIndex];
  const otherScores = scores.filter((_, index) => Math.abs(frequencies[index] - peakFreq) > 0.25);
  const noiseFloor = otherScores.length > 0 ? mean(otherScores) : 1;
  const snrDb = 10 * Math.log10((peakScore + Number.EPSILON) / (noiseFloor + Number.EPSILON));

  return {
    bpm: Math.round(peakFreq * 60),
    snrDb,
    score: peakScore,
  };
}

function peakEstimateForPolarity(
  signal: number[],
  sampleRate: number,
  polarity: 1 | -1,
): PeakResult | null {
  const oriented = signal.map((value) => value * polarity);
  const positiveSquared = oriented.map((value) => Math.pow(Math.max(0, value), 2));
  const peakAverage = movingAverage(positiveSquared, sampleRate * 0.111);
  const beatAverage = movingAverage(positiveSquared, sampleRate * 0.667);
  const thresholdOffset = mean(positiveSquared) * 0.02;
  const minBlockSamples = Math.max(2, Math.round(sampleRate * 0.111));
  const refractorySamples = Math.max(1, Math.round(sampleRate * 0.3));
  const peaks: number[] = [];

  let index = 0;
  while (index < signal.length) {
    if (peakAverage[index] <= beatAverage[index] + thresholdOffset) {
      index += 1;
      continue;
    }

    const blockStart = index;
    while (
      index < signal.length &&
      peakAverage[index] > beatAverage[index] + thresholdOffset
    ) {
      index += 1;
    }
    const blockEnd = index - 1;

    if (blockEnd - blockStart + 1 < minBlockSamples) {
      continue;
    }

    let peakIndex = blockStart;
    for (let i = blockStart + 1; i <= blockEnd; i++) {
      if (oriented[i] > oriented[peakIndex]) {
        peakIndex = i;
      }
    }

    const lastPeak = peaks[peaks.length - 1];
    if (lastPeak == null || peakIndex - lastPeak >= refractorySamples) {
      peaks.push(peakIndex);
    } else if (oriented[peakIndex] > oriented[lastPeak]) {
      peaks[peaks.length - 1] = peakIndex;
    }
  }

  if (peaks.length < 4) return null;

  const intervalsMs: number[] = [];
  for (let i = 1; i < peaks.length; i++) {
    const intervalMs = ((peaks[i] - peaks[i - 1]) / sampleRate) * 1000;
    if (intervalMs >= 333 && intervalMs <= 1500) {
      intervalsMs.push(intervalMs);
    }
  }

  if (intervalsMs.length < 3) return null;

  const avgInterval = mean(intervalsMs);
  const consistency = clamp(1 - standardDeviation(intervalsMs) / avgInterval, 0, 1);
  const bpm = Math.round(60000 / avgInterval);

  if (bpm < 40 || bpm > 180) return null;

  return {
    bpm,
    consistency,
    peaks,
  };
}

function peakEstimate(signal: number[], sampleRate: number): PeakResult | null {
  const positive = peakEstimateForPolarity(signal, sampleRate, 1);
  const negative = peakEstimateForPolarity(signal, sampleRate, -1);

  if (positive == null) return negative;
  if (negative == null) return positive;

  const positiveScore = positive.consistency + positive.peaks.length / 20;
  const negativeScore = negative.consistency + negative.peaks.length / 20;
  return positiveScore >= negativeScore ? positive : negative;
}

function qualityFromEstimate(
  confidence: number,
  snrDb: number,
  agreement: number,
  options: ResolvedComputeBpmOptions,
): PpgQuality {
  if (confidence >= 0.75 && snrDb >= 6 && agreement >= 0.65) return 'good';
  if (confidence >= 0.55 && snrDb >= options.minSnrDb) return 'fair';
  return 'poor';
}

function evaluateCandidate(
  series: CandidateSeries,
  options: ResolvedComputeBpmOptions,
): HeartRateEstimate | null {
  const stableStart = series.timestamps[0] + options.stabilizationMs;
  const stableSeries: CandidateSeries = {
    ...series,
    timestamps: [],
    values: [],
  };

  for (let i = 0; i < series.timestamps.length; i++) {
    if (series.timestamps[i] >= stableStart) {
      stableSeries.timestamps.push(series.timestamps[i]);
      stableSeries.values.push(series.values[i]);
    }
  }

  const resampled = resampleUniform(stableSeries, options);
  if (resampled == null) return null;
  if (!lightingIsStable(resampled.values)) return null;

  const processed = preprocess(resampled.values, resampled.sampleRate);
  const freq = frequencyEstimate(processed, resampled.sampleRate);
  if (freq == null || freq.snrDb < options.minSnrDb) return null;

  const peaks = peakEstimate(processed, resampled.sampleRate);
  const peakDiff = peaks != null ? Math.abs(freq.bpm - peaks.bpm) : null;
  const hasPeakAgreement = peakDiff != null && peakDiff <= MAX_FREQ_PEAK_DIFF_BPM;

  if (options.requirePeakAgreement && peaks != null && !hasPeakAgreement) return null;
  if (peaks == null && freq.snrDb < options.fallbackSnrDbWithoutPeaks) return null;

  const snrFactor = clamp((freq.snrDb - options.minSnrDb) / 10, 0, 1);
  const agreement = peakDiff == null ? 0.35 : clamp(1 - peakDiff / MAX_FREQ_PEAK_DIFF_BPM, 0, 1);
  const peakConsistency = peaks?.consistency ?? 0.35;
  const qualityPenalty = clamp(series.meanSaturatedPct + series.meanDarkPct, 0, 1) * 0.25;
  const confidence = clamp(
    0.25 + snrFactor * 0.35 + agreement * 0.2 + peakConsistency * 0.25 - qualityPenalty,
    0,
    0.99,
  );

  if (confidence < options.minConfidence) return null;

  const durationMs = stableSeries.timestamps[stableSeries.timestamps.length - 1] - stableSeries.timestamps[0];

  return {
    bpm: freq.bpm,
    confidence,
    quality: qualityFromEstimate(confidence, freq.snrDb, agreement, options),
    sampleCount: stableSeries.values.length,
    durationMs,
    roiId: series.roiId,
    channel: series.channel,
    snrDb: freq.snrDb,
    frequencyBpm: freq.bpm,
    peakBpm: peaks?.bpm ?? null,
  };
}

function buildCandidates(frames: PpgFrameSample[]): CandidateSeries[] {
  const sortedFrames = [...frames]
    .filter((frame) => Number.isFinite(frame.timestamp) && Array.isArray(frame.rois))
    .sort((a, b) => a.timestamp - b.timestamp);
  const roiIds = new Set<string>();

  for (const frame of sortedFrames) {
    for (const roi of frame.rois) {
      roiIds.add(roi.id);
    }
  }

  const candidates: CandidateSeries[] = [];

  for (const roiId of roiIds) {
    for (const channel of CHANNELS) {
      const timestamps: number[] = [];
      const values: number[] = [];
      const saturated: number[] = [];
      const dark: number[] = [];

      for (const frame of sortedFrames) {
        const roi = frame.rois.find((item) => item.id === roiId);
        if (roi == null) continue;
        if (roi.saturatedPct > 0.7 || roi.darkPct > 0.7) continue;

        const value = channelValue(roi, channel);
        if (!Number.isFinite(value)) continue;

        const previousTimestamp = timestamps[timestamps.length - 1];
        if (previousTimestamp != null && frame.timestamp <= previousTimestamp) continue;

        timestamps.push(frame.timestamp);
        values.push(value);
        saturated.push(roi.saturatedPct);
        dark.push(roi.darkPct);
      }

      if (timestamps.length > 0) {
        candidates.push({
          roiId,
          channel,
          timestamps,
          values,
          meanSaturatedPct: mean(saturated),
          meanDarkPct: mean(dark),
        });
      }
    }
  }

  return candidates;
}

function candidatePriority(estimate: HeartRateEstimate): number {
  const channelBonus =
    estimate.channel === 'weighted' ? 0.04 :
      estimate.channel === 'green' ? 0.035 :
        estimate.channel === 'red' ? 0.025 : 0;
  const roiBonus =
    estimate.roiId === 'full' ? 0.03 :
      estimate.roiId === 'center' ? 0.025 : 0;

  return estimate.confidence + estimate.snrDb / 25 + channelBonus + roiBonus;
}

function consensusEstimate(estimates: HeartRateEstimate[]): HeartRateEstimate | null {
  if (estimates.length === 0) return null;

  const ranked = [...estimates].sort((a, b) => candidatePriority(b) - candidatePriority(a));
  const best = ranked[0];
  const cluster = ranked.filter((estimate) => Math.abs(estimate.bpm - best.bpm) <= 8);

  if (cluster.length < 2) return best;

  let totalWeight = 0;
  let weightedBpm = 0;
  for (const estimate of cluster) {
    const weight = estimate.confidence * Math.max(1, estimate.snrDb);
    totalWeight += weight;
    weightedBpm += estimate.bpm * weight;
  }

  if (totalWeight <= 0) return best;

  return {
    ...best,
    bpm: Math.round(weightedBpm / totalWeight),
    confidence: clamp(best.confidence + Math.min(0.08, (cluster.length - 1) * 0.015), 0, 0.99),
  };
}

function latestPeakForPolarity(
  values: number[],
  timestamps: number[],
  previousBeatTimestamp: number | null,
  polarity: 1 | -1,
): { index: number; confidence: number } | null {
  if (values.length < 5) return null;

  const oriented = values.map((value) => value * polarity);
  const avg = mean(oriented);
  const sd = standardDeviation(oriented);
  if (sd <= 0) return null;

  const threshold = avg + sd * 0.45;
  const latestTimestamp = timestamps[timestamps.length - 1];
  let best: { index: number; confidence: number } | null = null;

  for (let i = 2; i < oriented.length - 1; i++) {
    const timestamp = timestamps[i];
    if (latestTimestamp - timestamp > MAX_BEAT_DETECTION_LAG_MS) continue;
    if (
      previousBeatTimestamp != null &&
      timestamp - previousBeatTimestamp < MIN_BEAT_INTERVAL_MS
    ) {
      continue;
    }
    if (oriented[i] <= threshold) continue;
    if (oriented[i] <= oriented[i - 1] || oriented[i] < oriented[i + 1]) continue;

    const prominence = oriented[i] - Math.max(oriented[i - 1], oriented[i + 1], threshold);
    const confidence = clamp(prominence / (sd * 1.5), 0, 1);
    if (best == null || confidence >= best.confidence) {
      best = { index: i, confidence };
    }
  }

  return best;
}

/**
 * Detects the newest pulse peak in the recent PPG stream.
 *
 * This is intentionally lighter than the final BPM estimator. It is used only
 * to trigger UI feedback when a beat is seen, while computeBPM remains the
 * source of truth for the reading.
 */
export function detectLatestBeat(
  samples: PpgFrameSample[],
  previousBeatTimestamp: number | null = null,
): BeatDetectionResult | null {
  if (samples.length === 0) return null;

  const latestTimestamp = samples[samples.length - 1].timestamp;
  const recentSamples = samples.filter(
    (sample) => sample.timestamp >= latestTimestamp - BEAT_DETECTION_WINDOW_MS,
  );

  const candidates = buildCandidates(recentSamples);
  let best: BeatDetectionResult | null = null;

  for (const candidate of candidates) {
    if (candidate.timestamps.length < 24) continue;
    if (candidate.meanDarkPct > 0.55 || candidate.meanSaturatedPct > 0.65) continue;

    const sampleRate = estimateSampleRate(candidate.timestamps);
    if (sampleRate == null) continue;

    const processed = preprocess(candidate.values, sampleRate);
    const positive = latestPeakForPolarity(
      processed,
      candidate.timestamps,
      previousBeatTimestamp,
      1,
    );
    const negative = latestPeakForPolarity(
      processed,
      candidate.timestamps,
      previousBeatTimestamp,
      -1,
    );
    const peak =
      positive == null ? negative :
        negative == null ? positive :
          positive.confidence >= negative.confidence ? positive : negative;

    if (peak == null || peak.confidence < 0.12) continue;

    const channelBonus =
      candidate.channel === 'weighted' ? 0.05 :
        candidate.channel === 'green' ? 0.04 :
          candidate.channel === 'red' ? 0.025 : 0;
    const roiBonus =
      candidate.roiId === 'center' ? 0.05 :
        candidate.roiId === 'inner' ? 0.045 :
          candidate.roiId === 'full' ? 0.03 : 0;
    const qualityPenalty = clamp(candidate.meanDarkPct + candidate.meanSaturatedPct, 0, 1) * 0.2;
    const confidence = clamp(peak.confidence + channelBonus + roiBonus - qualityPenalty, 0, 1);

    if (best == null || confidence > best.confidence) {
      best = {
        timestamp: candidate.timestamps[peak.index],
        confidence,
        roiId: candidate.roiId,
        channel: candidate.channel,
      };
    }
  }

  return best;
}

/**
 * Compute BPM from native camera PPG frame summaries.
 *
 * The estimator evaluates multiple ROI/channel candidates, applies AC/DC
 * normalization, motion clipping, frequency-domain harmonic scoring, SNR
 * gating, and a time-domain peak detector sanity check.
 */
export function computeBPM(
  samples: PpgFrameSample[],
  options?: ComputeBpmOptions,
): HeartRateEstimate | null {
  if (samples.length === 0) return null;

  const resolvedOptions = resolveOptions(options);
  const estimates = buildCandidates(samples)
    .map((candidate) => evaluateCandidate(candidate, resolvedOptions))
    .filter((estimate): estimate is HeartRateEstimate => estimate != null);

  return consensusEstimate(estimates);
}
