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
const GRAPH_BPM_MEDIAN_WINDOW = 5;
const MIN_PRESENTATION_BPM = 20;
const MAX_PRESENTATION_BPM = 240;

const DEFAULT_PRESENTATION_FILTER_OPTIONS: BpmPresentationFilterOptions = {
  warmupMs: 5_000,
  minStableReadings: 3,
  stableRangeBpm: 12,
  maxStepBpm: 5,
  spikeThresholdBpm: 14,
  spikeConfirmationBpm: 6,
};

function clampStep(value: number, previous: number | null): number {
  if (previous == null) return value;
  if (Math.abs(value - previous) <= MAX_SAMPLE_JUMP_BPM) return value;
  return previous + Math.sign(value - previous) * MAX_SAMPLE_JUMP_BPM;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
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
    const smoothedBpm = stabilizeBpmUpdate(sample.value, previousBpm);
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
): Array<{ label: string; value: number }> {
  const points = samples
    .map((sample, index) => {
      const windowStart = Math.max(0, index - GRAPH_BPM_MEDIAN_WINDOW + 1);
      const recentIbis = samples
        .slice(windowStart, index + 1)
        .map((item) => item.ibiMs)
        .filter((ibiMs) => Number.isFinite(ibiMs) && ibiMs > 0);
      const medianIbi = median(recentIbis);

      return {
        label: toLabel(sample),
        value: medianIbi > 0 ? Math.round(60000 / medianIbi) : 0,
      };
    })
    .filter((sample) => (
      Number.isFinite(sample.value) &&
      sample.value >= 20 &&
      sample.value <= 240
    ));

  return smoothBpmValuePoints(points);
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
