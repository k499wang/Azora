/**
 * Single source of truth for turning a raw per-sample heart-rate series into
 * the canonical smoothed points shown on a graph AND the summary stats
 * (avg / min / max / drop) derived from those exact points.
 *
 * Both outputs come from one pipeline so the numbers a user reads can never
 * drift from the line they see. Any feature that plots a BPM-over-time graph
 * and also surfaces summary numbers next to it should build both from here.
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
}

const DEFAULT_MAX_POINTS = 24;
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
  const maxPoints = options.maxPoints ?? DEFAULT_MAX_POINTS;
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

  const points = smoothBpmValuePoints(
    downsampleByWindowMedian(valid, maxPoints).map((point) => ({
      ...point,
      value: point.bpm,
    })),
  ).map(({ offsetMs, label, value }) => ({ offsetMs, label, bpm: value }));

  return { points, summary: summarizeBpmSeries(points) };
}
