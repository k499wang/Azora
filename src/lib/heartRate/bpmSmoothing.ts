import type { BpmSample, IbiSample } from './types';
import { mean, median } from '../stats';

export interface BpmPoint {
  offsetMs: number;
  bpm: number;
  signalQuality: number | null;
}

export interface TimedBpmSample {
  t: number;
  bpm: number;
}

export interface BpmValuePoint {
  value: number;
}

export interface IbiValuePoint {
  offsetMs: number;
  ibiMs: number;
}

export interface GraphBpmValuePoint extends BpmValuePoint {
  label: string;
  offsetMs: number;
}

export interface BpmPresentationFilterOptions {
  warmupMs: number;
  minStableReadings: number;
  stableRangeBpm: number;
  maxStepBpm: number;
  spikeThresholdBpm: number;
  spikeConfirmationBpm: number;
}

export interface BpmPresentationSample {
  elapsedMs: number;
  bpm: number;
}

const MAX_SAMPLE_JUMP_BPM = 8;
const GRAPH_MAX_SAMPLE_JUMP_BPM = 2;
const GRAPH_STARTUP_TRIM_IBIS = 3;
const GRAPH_MIN_IBIS_AFTER_STARTUP_TRIM = 3;
const GRAPH_STARTUP_TRIM_MS = 4_000;
const GRAPH_MIN_POINTS_AFTER_TRIM = 3;
const GRAPH_STARTUP_TRIM_BPM_DELTA = 8;
const MIN_PRESENTATION_BPM = 20;
const MAX_PRESENTATION_BPM = 240;
const RESTING_RESULT_RADIUS = 3;
const BREATH_HOLD_RESULT_RADIUS = 2;
const RESTING_RESULT_MAX_STEP_BPM = 3;
const BREATH_HOLD_RESULT_MAX_STEP_BPM = 5;

export type PresentationBpmPolicy = 'restingResult' | 'breathHoldResult';

const DEFAULT_PRESENTATION_FILTER_OPTIONS: BpmPresentationFilterOptions = {
  warmupMs: 5_000,
  minStableReadings: 3,
  stableRangeBpm: 12,
  maxStepBpm: 5,
  spikeThresholdBpm: 14,
  spikeConfirmationBpm: 6,
};

const LIVE_BPM_PRESENTATION_OPTIONS: BpmPresentationFilterOptions = {
  warmupMs: 0,
  minStableReadings: 1,
  stableRangeBpm: 12,
  maxStepBpm: 4,
  spikeThresholdBpm: 12,
  spikeConfirmationBpm: 5,
};

function clampStep(value: number, previous: number | null): number {
  if (previous == null) return value;
  if (Math.abs(value - previous) <= MAX_SAMPLE_JUMP_BPM) return value;
  return previous + Math.sign(value - previous) * MAX_SAMPLE_JUMP_BPM;
}

function clampGraphStep(value: number, previous: number | null): number {
  if (previous == null) return value;
  if (Math.abs(value - previous) <= GRAPH_MAX_SAMPLE_JUMP_BPM) return value;
  return previous + Math.sign(value - previous) * GRAPH_MAX_SAMPLE_JUMP_BPM;
}

function bpmFromMedianIbi(samples: IbiValuePoint[]): number | null {
  const medianIbi = median(
    samples
      .map((sample) => sample.ibiMs)
      .filter((ibiMs) => Number.isFinite(ibiMs) && ibiMs > 0),
  );
  return medianIbi > 0 ? Math.round(60000 / medianIbi) : null;
}

function clampPresentationStep(value: number, previous: number | null, maxStepBpm: number): number {
  if (previous == null) return value;
  if (Math.abs(value - previous) <= maxStepBpm) return value;
  return previous + Math.sign(value - previous) * maxStepBpm;
}

function policySettings(policy: PresentationBpmPolicy): {
  radius: number;
  maxStepBpm: number;
} {
  return policy === 'breathHoldResult'
    ? { radius: BREATH_HOLD_RESULT_RADIUS, maxStepBpm: BREATH_HOLD_RESULT_MAX_STEP_BPM }
    : { radius: RESTING_RESULT_RADIUS, maxStepBpm: RESTING_RESULT_MAX_STEP_BPM };
}

export function buildPresentationBpmSeriesFromIbis(
  ibiSamples: IbiSample[],
  policy: PresentationBpmPolicy = 'restingResult',
): BpmSample[] {
  const ordered = [...ibiSamples]
    .filter((sample) => (
      Number.isFinite(sample.offsetMs) &&
      Number.isFinite(sample.ibiMs) &&
      sample.ibiMs > 0
    ))
    .sort((a, b) => a.offsetMs - b.offsetMs);

  const { radius, maxStepBpm } = policySettings(policy);
  let previousBpm: number | null = null;

  return ordered.flatMap((sample, index) => {
    const start = Math.max(0, index - radius);
    const end = Math.min(ordered.length, index + radius + 1);
    const windowIbis = ordered
      .slice(start, end)
      .map((item) => item.ibiMs)
      .filter((ibiMs) => Number.isFinite(ibiMs) && ibiMs > 0);
    if (windowIbis.length === 0) return [];

    const meanIbi = mean(windowIbis);
    const rawBpm = Math.round(60000 / meanIbi);
    if (!isPresentationBpm(rawBpm)) return [];

    const bpm = Math.round(clampPresentationStep(rawBpm, previousBpm, maxStepBpm));
    previousBpm = bpm;
    return [{
      offsetMs: Math.round(sample.offsetMs),
      bpm,
      signalQuality: sample.signalQuality,
    }];
  });
}

export function buildRrSeriesFromIbis(ibiSamples: IbiSample[]): IbiSample[] {
  return [...ibiSamples]
    .filter((sample) => (
      Number.isFinite(sample.offsetMs) &&
      Number.isFinite(sample.ibiMs) &&
      sample.ibiMs > 0
    ))
    .sort((a, b) => a.offsetMs - b.offsetMs)
    .map((sample) => ({
      offsetMs: Math.round(sample.offsetMs),
      ibiMs: Math.round(sample.ibiMs),
      signalQuality: sample.signalQuality,
    }));
}

export function summarizeBpmFromIbis(ibiSamples: IbiSample[]): {
  avgBpm: number | null;
  minBpm: number | null;
  maxBpm: number | null;
} {
  const bpmValues = buildPresentationBpmSeriesFromIbis(ibiSamples).map((sample) => sample.bpm);
  if (bpmValues.length === 0) {
    return {
      avgBpm: null,
      minBpm: null,
      maxBpm: null,
    };
  }

  return {
    avgBpm: Math.round(mean(bpmValues)),
    minBpm: Math.min(...bpmValues),
    maxBpm: Math.max(...bpmValues),
  };
}

export function stabilizeBpmUpdate(
  bpm: number,
  previousBpm: number | null,
): number {
  return Math.round(clampStep(bpm, previousBpm));
}

export function smoothBpmPoints<T extends BpmPoint>(samples: T[]): T[] {
  let previousBpm: number | null = null;

  return samples.map((sample) => {
    const smoothedBpm = stabilizeBpmUpdate(sample.bpm, previousBpm);
    previousBpm = smoothedBpm;
    return {
      ...sample,
      bpm: smoothedBpm,
    };
  });
}

export function smoothTimedBpmSamples<T extends TimedBpmSample>(samples: T[]): T[] {
  let previousBpm: number | null = null;

  return samples.map((sample) => {
    const smoothedBpm = stabilizeBpmUpdate(sample.bpm, previousBpm);
    previousBpm = smoothedBpm;
    return {
      ...sample,
      bpm: smoothedBpm,
    };
  });
}

export function smoothBpmValuePoints<T extends BpmValuePoint>(samples: T[]): T[] {
  let previousBpm: number | null = null;

  return samples.map((sample) => {
    const smoothedBpm = Math.round(clampGraphStep(sample.value, previousBpm));
    previousBpm = smoothedBpm;
    return {
      ...sample,
      value: smoothedBpm,
    };
  });
}

export function buildGraphBpmValuePointsFromIbis<T extends IbiValuePoint>(
  samples: T[],
  toLabel: (sample: T) => string,
): GraphBpmValuePoint[] {
  const graphCandidateSamples =
    samples.length >= GRAPH_STARTUP_TRIM_IBIS + GRAPH_MIN_IBIS_AFTER_STARTUP_TRIM
      ? samples.slice(GRAPH_STARTUP_TRIM_IBIS)
      : samples;
  const startupSamples = graphCandidateSamples.filter((sample) => sample.offsetMs < GRAPH_STARTUP_TRIM_MS);
  const trimmedSamples = graphCandidateSamples.filter((sample) => sample.offsetMs >= GRAPH_STARTUP_TRIM_MS);
  const startupBpm = bpmFromMedianIbi(startupSamples);
  const trimmedBpm = bpmFromMedianIbi(trimmedSamples);
  const shouldTrimStartup =
    trimmedSamples.length >= GRAPH_MIN_POINTS_AFTER_TRIM &&
    startupSamples.length >= 2 &&
    startupBpm != null &&
    trimmedBpm != null &&
    startupBpm - trimmedBpm >= GRAPH_STARTUP_TRIM_BPM_DELTA;
  const graphSamples =
    shouldTrimStartup
      ? trimmedSamples
      : graphCandidateSamples;

  const presentationSeries = buildPresentationBpmSeriesFromIbis(
    graphSamples.map((sample) => {
      return {
        offsetMs: sample.offsetMs,
        ibiMs: sample.ibiMs,
        signalQuality: null,
      };
    }),
    'restingResult',
  );
  const labelByOffset = new Map(graphSamples.map((sample) => [sample.offsetMs, toLabel(sample)]));

  return presentationSeries.map((sample) => ({
    label: labelByOffset.get(sample.offsetMs) ?? `${sample.offsetMs}`,
    offsetMs: sample.offsetMs,
    value: sample.bpm,
  }));
}

function isPresentationBpm(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= MIN_PRESENTATION_BPM &&
    value <= MAX_PRESENTATION_BPM
  );
}

function isRecentWindowStable(values: number[], rangeBpm: number): boolean {
  if (values.length === 0) return false;
  return Math.max(...values) - Math.min(...values) <= rangeBpm;
}

export class BpmPresentationFilter {
  private readonly options: BpmPresentationFilterOptions;
  private readonly rawReadings: number[] = [];
  private previousDisplayedBpm: number | null = null;
  private pendingSpikeBpm: number | null = null;

  constructor(options: Partial<BpmPresentationFilterOptions> = {}) {
    this.options = {
      ...DEFAULT_PRESENTATION_FILTER_OPTIONS,
      ...options,
    };
  }

  reset(): void {
    this.rawReadings.length = 0;
    this.previousDisplayedBpm = null;
    this.pendingSpikeBpm = null;
  }

  update(sample: BpmPresentationSample): number | null {
    const rawBpm = Math.round(sample.bpm);
    if (!isPresentationBpm(rawBpm)) return null;

    this.rawReadings.push(rawBpm);
    if (this.rawReadings.length > this.options.minStableReadings) {
      this.rawReadings.shift();
    }

    if (this.previousDisplayedBpm == null) {
      if (sample.elapsedMs < this.options.warmupMs) return null;
      if (this.rawReadings.length < this.options.minStableReadings) return null;
      if (!isRecentWindowStable(this.rawReadings, this.options.stableRangeBpm)) {
        return null;
      }
      this.previousDisplayedBpm = rawBpm;
      this.pendingSpikeBpm = null;
      return rawBpm;
    }

    const deltaFromPrevious = rawBpm - this.previousDisplayedBpm;
    if (Math.abs(deltaFromPrevious) > this.options.spikeThresholdBpm) {
      const confirmed =
        this.pendingSpikeBpm != null &&
        Math.abs(rawBpm - this.pendingSpikeBpm) <= this.options.spikeConfirmationBpm;

      if (!confirmed) {
        this.pendingSpikeBpm = rawBpm;
        return null;
      }
    }

    this.pendingSpikeBpm = null;
    const step =
      Math.abs(deltaFromPrevious) <= this.options.maxStepBpm
        ? deltaFromPrevious
        : Math.sign(deltaFromPrevious) * this.options.maxStepBpm;
    const displayedBpm = Math.round(this.previousDisplayedBpm + step);
    this.previousDisplayedBpm = displayedBpm;
    return displayedBpm;
  }
}

export function createBpmPresentationFilter(
  options: Partial<BpmPresentationFilterOptions> = {},
): BpmPresentationFilter {
  return new BpmPresentationFilter(options);
}

export function createLiveBpmPresentationFilter(
  options: Partial<BpmPresentationFilterOptions> = {},
): BpmPresentationFilter {
  return new BpmPresentationFilter({
    ...LIVE_BPM_PRESENTATION_OPTIONS,
    ...options,
  });
}
