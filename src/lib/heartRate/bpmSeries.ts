/**
 * Single source of truth for turning a raw per-sample heart-rate series into
 * graph points and matching summary stats. The default mode summarizes its
 * smoothed trend points; exercise mode summarizes the full quality-gated
 * series so extrema-preserving chart downsampling cannot bias the average.
 *
 * Both outputs come from one pipeline. Any feature that plots a BPM-over-time
 * graph and also surfaces summary numbers next to it should build both here so
 * they use the same validation and presentation policy.
 */

import { smoothBpmValuePoints } from './bpmSmoothing';

export interface BpmTimePoint {
  offsetMs: number;
  bpm: number;
}

export interface BpmSeriesPoint {
  offsetMs: number;
  label: string;
  bpm: number;
}

export interface BpmSeriesSummary {
  avgBpm: number | null;
  minBpm: number | null;
  maxBpm: number | null;
  /** Peak-to-trough fall over the series (maxBpm - minBpm), never negative. */
  hrDropBpm: number | null;
}

export interface BpmSeries {
  points: BpmSeriesPoint[];
  summary: BpmSeriesSummary;
}

export interface BuildBpmSeriesOptions {
  maxPoints?: number;
  /**
   * Exercise samples have already passed through the live pulse quality and
   * presentation gates. Preserve their physiological movement instead of
   * applying the additional resting/trend graph smoothing.
   */
  mode?: 'default' | 'exercise';
}

const DEFAULT_MAX_POINTS = 24;
const EXERCISE_DEFAULT_MAX_POINTS = 48;
const MIN_VALID_BPM = 20;
const MAX_VALID_BPM = 240;

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function toSeriesPoint(sample: BpmTimePoint): BpmSeriesPoint {
  return {
    offsetMs: sample.offsetMs,
    label: formatClock(sample.offsetMs / 1000),
    bpm: Math.round(sample.bpm),
  };
}

function downsampleByWindowMedian(
  samples: BpmTimePoint[],
  maxPoints: number,
): BpmSeriesPoint[] {
  if (samples.length <= maxPoints) {
    return samples.map(toSeriesPoint);
  }

  const step = (samples.length - 1) / (maxPoints - 1);
  const windowRadius = Math.max(1, Math.floor(step / 2));
  const points: BpmSeriesPoint[] = [];

  for (let i = 0; i < maxPoints; i += 1) {
    const centerIdx = Math.round(i * step);
    const start = Math.max(0, centerIdx - windowRadius);
    const end = Math.min(samples.length, centerIdx + windowRadius + 1);
    const windowBpms = samples.slice(start, end).map((sample) => sample.bpm);
    points.push({
      ...toSeriesPoint(samples[centerIdx]),
      bpm: Math.round(median(windowBpms)),
    });
  }

  return points;
}

/**
 * Keep local highs and lows when a longer exercise must be shortened for the
 * chart. Window medians are useful for a stable trend, but they erase the
 * breathing-related oscillation these sessions are intended to show.
 */
function downsampleByExtrema(
  samples: BpmTimePoint[],
  maxPoints: number,
): BpmSeriesPoint[] {
  if (samples.length <= maxPoints) {
    return samples.map(toSeriesPoint);
  }
  if (maxPoints < 4) {
    return downsampleByWindowMedian(samples, maxPoints);
  }

  const points: BpmSeriesPoint[] = [toSeriesPoint(samples[0])];
  const interior = samples.slice(1, -1);
  const bucketCount = Math.max(1, Math.floor((maxPoints - 2) / 2));

  for (let bucket = 0; bucket < bucketCount; bucket += 1) {
    const start = Math.floor((bucket * interior.length) / bucketCount);
    const end = Math.floor(((bucket + 1) * interior.length) / bucketCount);
    const bucketSamples = interior.slice(start, Math.max(start + 1, end));
    if (bucketSamples.length === 0) continue;

    let minIndex = 0;
    let maxIndex = 0;
    for (let index = 1; index < bucketSamples.length; index += 1) {
      if (bucketSamples[index].bpm < bucketSamples[minIndex].bpm) minIndex = index;
      if (bucketSamples[index].bpm > bucketSamples[maxIndex].bpm) maxIndex = index;
    }

    const selected = minIndex === maxIndex
      ? [bucketSamples[minIndex]]
      : minIndex < maxIndex
        ? [bucketSamples[minIndex], bucketSamples[maxIndex]]
        : [bucketSamples[maxIndex], bucketSamples[minIndex]];
    points.push(...selected.map(toSeriesPoint));
  }

  points.push(toSeriesPoint(samples[samples.length - 1]));
  return points.slice(0, maxPoints);
}

export function summarizeBpmSeries(points: BpmSeriesPoint[]): BpmSeriesSummary {
  if (points.length === 0) {
    return { avgBpm: null, minBpm: null, maxBpm: null, hrDropBpm: null };
  }

  const bpms = points.map((point) => point.bpm);
  const minBpm = Math.min(...bpms);
  const maxBpm = Math.max(...bpms);
  const avgBpm = Math.round(bpms.reduce((sum, value) => sum + value, 0) / bpms.length);

  return { avgBpm, minBpm, maxBpm, hrDropBpm: Math.max(0, maxBpm - minBpm) };
}

export function buildBpmSeries(
  raw: BpmTimePoint[],
  options: BuildBpmSeriesOptions = {},
): BpmSeries {
  const mode = options.mode ?? 'default';
  const maxPoints = options.maxPoints ?? (
    mode === 'exercise' ? EXERCISE_DEFAULT_MAX_POINTS : DEFAULT_MAX_POINTS
  );
  const valid = raw
    .filter(
      (sample) =>
        Number.isFinite(sample.offsetMs) &&
        sample.offsetMs >= 0 &&
        Number.isFinite(sample.bpm) &&
        sample.bpm >= MIN_VALID_BPM &&
        sample.bpm <= MAX_VALID_BPM,
    )
    .sort((a, b) => a.offsetMs - b.offsetMs);

  if (valid.length === 0) {
    return { points: [], summary: summarizeBpmSeries([]) };
  }

  const downsampled = mode === 'exercise'
    ? downsampleByExtrema(valid, maxPoints)
    : downsampleByWindowMedian(valid, maxPoints);
  const points = mode === 'exercise'
    ? downsampled
    : smoothBpmValuePoints(
        downsampled.map((point) => ({
          ...point,
          value: point.bpm,
        })),
      ).map(({ offsetMs, label, value }) => ({ offsetMs, label, bpm: value }));

  const summaryPoints = mode === 'exercise'
    ? valid.map(toSeriesPoint)
    : points;
  return { points, summary: summarizeBpmSeries(summaryPoints) };
}
