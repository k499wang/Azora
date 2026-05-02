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

const MAX_SAMPLE_JUMP_BPM = 8;

function clampStep(value: number, previous: number | null): number {
  if (previous == null) return value;
  if (Math.abs(value - previous) <= MAX_SAMPLE_JUMP_BPM) return value;
  return previous + Math.sign(value - previous) * MAX_SAMPLE_JUMP_BPM;
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
