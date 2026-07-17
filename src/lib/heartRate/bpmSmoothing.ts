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
  maxIncreaseBpm: number;
  maxDecreaseBpm: number;
  spikeThresholdBpm: number;
  spikeConfirmationBpm: number;
  // Deadband: hold the displayed value when the reading is within this many
  // BPM of it, so the number sits still through small oscillations (breathing
  // swing, measurement noise) instead of wiggling every update. Real trends
  // exceed the band and still track via the step limits above.
  minChangeBpm: number;
  // Optional elapsed-time limit for presentation movement. This complements
  // the per-update limits above for surfaces whose update cadence varies.
  maxChangeBpmPerSecond?: number | null;
}

export interface BpmPresentationSample {
  elapsedMs: number;
  bpm: number;
}

export interface ExerciseBpmSnapshot {
  bpm: number;
  timestamp: number;
  signalQuality: number;
}

// Kept just above the manager's own publish floor (LIVE_BPM_MIN_QUALITY 0.03).
// Quality is bandpassed amplitude / SIGNAL_QUALITY_REF and the live PPG graph
// autoscales, so a low-perfusion finger (cold hands, light contact, torch still
// warming the fingertip) can draw a clean sine wave while quality sits well
// below a high floor. At 0.15 that created a dead zone where the manager held a
// locked BPM but the exercise never left "finding pulse".
export const EXERCISE_BPM_MIN_SIGNAL_QUALITY = 0.05;

const MAX_SAMPLE_JUMP_BPM = 8;
const GRAPH_MAX_SAMPLE_JUMP_BPM = 2;
const GRAPH_BPM_MEDIAN_WINDOW = 9;
const GRAPH_STARTUP_TRIM_IBIS = 3;
const GRAPH_MIN_IBIS_AFTER_STARTUP_TRIM = 3;
const GRAPH_STARTUP_TRIM_MS = 4_000;
const GRAPH_MIN_POINTS_AFTER_TRIM = 3;
const GRAPH_STARTUP_TRIM_BPM_DELTA = 8;
const MIN_PRESENTATION_BPM = 20;
const MAX_PRESENTATION_BPM = 240;

const DEFAULT_PRESENTATION_FILTER_OPTIONS: BpmPresentationFilterOptions = {
  warmupMs: 5_000,
  minStableReadings: 3,
  stableRangeBpm: 12,
  maxStepBpm: 5,
  maxIncreaseBpm: 5,
  maxDecreaseBpm: 5,
  spikeThresholdBpm: 14,
  spikeConfirmationBpm: 6,
  minChangeBpm: 0,
};

const LIVE_BPM_PRESENTATION_OPTIONS: BpmPresentationFilterOptions = {
  warmupMs: 0,
  minStableReadings: 1,
  stableRangeBpm: 8,
  maxStepBpm: 2,
  maxIncreaseBpm: 2,
  maxDecreaseBpm: 2,
  spikeThresholdBpm: 10,
  spikeConfirmationBpm: 4,
  minChangeBpm: 2,
};

// Deadband + asymmetric caps: deep breathing swings the true rate (RSA) every
// few seconds, and tracking each swing reads as instability. The deadband sits
// out small oscillations entirely; increases are capped tighter than decreases
// so the number declines calmly during the exercise without chasing every
// inhale back up.
const BREATH_EXERCISE_BPM_PRESENTATION_OPTIONS: BpmPresentationFilterOptions = {
  warmupMs: 0,
  minStableReadings: 3,
  stableRangeBpm: 6,
  maxStepBpm: 5,
  maxIncreaseBpm: 3,
  maxDecreaseBpm: 5,
  spikeThresholdBpm: 10,
  spikeConfirmationBpm: 4,
  minChangeBpm: 2,
  maxChangeBpmPerSecond: 3,
};

const IBI_GRAPH_PRESENTATION_OPTIONS: BpmPresentationFilterOptions = {
  warmupMs: 2_500,
  minStableReadings: 2,
  stableRangeBpm: 10,
  maxStepBpm: GRAPH_MAX_SAMPLE_JUMP_BPM,
  maxIncreaseBpm: GRAPH_MAX_SAMPLE_JUMP_BPM,
  maxDecreaseBpm: GRAPH_MAX_SAMPLE_JUMP_BPM,
  spikeThresholdBpm: 8,
  spikeConfirmationBpm: 3,
  minChangeBpm: 0,
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

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function bpmFromMedianIbi(samples: IbiValuePoint[]): number | null {
  const medianIbi = median(
    samples
      .map((sample) => sample.ibiMs)
      .filter((ibiMs) => Number.isFinite(ibiMs) && ibiMs > 0),
  );
  return medianIbi > 0 ? Math.round(60000 / medianIbi) : null;
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
  const filter = createBpmPresentationFilter(IBI_GRAPH_PRESENTATION_OPTIONS);
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

  return graphSamples
    .map((sample, index) => {
      const windowStart = Math.max(0, index - GRAPH_BPM_MEDIAN_WINDOW + 1);
      const recentIbis = graphSamples
        .slice(windowStart, index + 1)
        .map((item) => item.ibiMs)
        .filter((ibiMs) => Number.isFinite(ibiMs) && ibiMs > 0);
      const medianIbi = median(recentIbis);

      return {
        label: toLabel(sample),
        offsetMs: sample.offsetMs,
        value: medianIbi > 0 ? Math.round(60000 / medianIbi) : 0,
      };
    })
    .filter((sample) => (
      Number.isFinite(sample.value) &&
      sample.value >= 20 &&
      sample.value <= 240
    ))
    .flatMap((sample) => {
      const value = filter.update({
        elapsedMs: sample.offsetMs,
        bpm: sample.value,
      });
      return value == null
        ? []
        : [{ label: sample.label, offsetMs: sample.offsetMs, value }];
    });
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

export function isExerciseBpmSnapshotReady(
  snapshot: ExerciseBpmSnapshot | null,
): boolean {
  return (
    snapshot != null &&
    Number.isFinite(snapshot.bpm) &&
    Number.isFinite(snapshot.timestamp) &&
    snapshot.signalQuality >= EXERCISE_BPM_MIN_SIGNAL_QUALITY
  );
}

export class BpmPresentationFilter {
  private readonly options: BpmPresentationFilterOptions;
  private readonly rawReadings: number[] = [];
  private previousDisplayedBpm: number | null = null;
  private pendingSpikeBpm: number | null = null;
  private lastProcessedElapsedMs: number | null = null;

  constructor(options: Partial<BpmPresentationFilterOptions> = {}) {
    const merged = {
      ...DEFAULT_PRESENTATION_FILTER_OPTIONS,
      ...options,
    };
    this.options = {
      ...merged,
      maxIncreaseBpm:
        options.maxIncreaseBpm ?? options.maxStepBpm ?? merged.maxIncreaseBpm,
      maxDecreaseBpm:
        options.maxDecreaseBpm ?? options.maxStepBpm ?? merged.maxDecreaseBpm,
    };
  }

  reset(): void {
    this.rawReadings.length = 0;
    this.previousDisplayedBpm = null;
    this.pendingSpikeBpm = null;
    this.lastProcessedElapsedMs = null;
  }

  update(sample: BpmPresentationSample): number | null {
    const rawBpm = Math.round(sample.bpm);
    if (!isPresentationBpm(rawBpm)) return null;

    const previousProcessedElapsedMs = this.lastProcessedElapsedMs;
    this.lastProcessedElapsedMs = sample.elapsedMs;

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
    if (Math.abs(deltaFromPrevious) <= this.options.minChangeBpm) {
      return this.previousDisplayedBpm;
    }
    const maxStep =
      deltaFromPrevious > 0
        ? this.options.maxIncreaseBpm
        : this.options.maxDecreaseBpm;
    const elapsedTimeLimit =
      this.options.maxChangeBpmPerSecond != null &&
      previousProcessedElapsedMs != null
        ? this.options.maxChangeBpmPerSecond *
          Math.max(0, sample.elapsedMs - previousProcessedElapsedMs) / 1_000
        : Number.POSITIVE_INFINITY;
    const allowedStep = Math.min(maxStep, elapsedTimeLimit);
    const step =
      Math.abs(deltaFromPrevious) <= allowedStep
        ? deltaFromPrevious
        : Math.sign(deltaFromPrevious) * allowedStep;
    this.previousDisplayedBpm += step;
    return Math.round(this.previousDisplayedBpm);
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

export function createBreathExerciseBpmPresentationFilter(
  options: Partial<BpmPresentationFilterOptions> = {},
): BpmPresentationFilter {
  return new BpmPresentationFilter({
    ...BREATH_EXERCISE_BPM_PRESENTATION_OPTIONS,
    ...options,
  });
}
