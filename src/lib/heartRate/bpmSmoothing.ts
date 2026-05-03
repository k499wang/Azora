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

const MAX_SAMPLE_JUMP_BPM = 8;
const GRAPH_BPM_MEDIAN_WINDOW = 5;

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
