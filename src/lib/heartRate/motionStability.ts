export type MotionStabilityState = 'stable' | 'shaky' | 'moving';

export interface MotionSample {
  timestamp: number;
  x: number;
  y: number;
  z: number;
}

export interface MotionStabilityResult {
  state: MotionStabilityState;
  score: number;
}

export interface MotionStabilityOptions {
  windowMs?: number;
  shakyVectorDelta?: number;
  movingVectorDelta?: number;
  shakyRmsDelta?: number;
  movingRmsDelta?: number;
  shakyMagnitudeRange?: number;
  movingMagnitudeRange?: number;
  movingHoldMs?: number;
}

const DEFAULT_OPTIONS: Required<MotionStabilityOptions> = {
  windowMs: 900,
  shakyVectorDelta: 0.08,
  movingVectorDelta: 0.20,
  shakyRmsDelta: 0.035,
  movingRmsDelta: 0.09,
  shakyMagnitudeRange: 0.08,
  movingMagnitudeRange: 0.18,
  movingHoldMs: 650,
};

function mergeOptions(options: MotionStabilityOptions = {}): Required<MotionStabilityOptions> {
  return { ...DEFAULT_OPTIONS, ...options };
}

function vectorDelta(a: MotionSample, b: MotionSample): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function magnitude(sample: MotionSample): number {
  return Math.sqrt(sample.x * sample.x + sample.y * sample.y + sample.z * sample.z);
}

function scoreRatio(value: number, threshold: number): number {
  if (threshold <= 0) return 0;
  return value / threshold;
}

export function classifyMotionStability(
  samples: MotionSample[],
  options: MotionStabilityOptions = {},
): MotionStabilityResult {
  if (samples.length < 4) {
    return { state: 'stable', score: 0 };
  }

  const resolved = mergeOptions(options);
  const latest = samples[samples.length - 1];
  const cutoff = latest.timestamp - resolved.windowMs;
  const recent = samples.filter((sample) => sample.timestamp >= cutoff);

  if (recent.length < 4) {
    return { state: 'stable', score: 0 };
  }

  const deltas: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    deltas.push(vectorDelta(recent[i], recent[i - 1]));
  }

  const maxVectorDelta = Math.max(...deltas);
  const rmsDelta = Math.sqrt(
    deltas.reduce((sum, delta) => sum + delta * delta, 0) / deltas.length,
  );
  const magnitudes = recent.map(magnitude);
  const magnitudeRange = Math.max(...magnitudes) - Math.min(...magnitudes);

  const movingScore = Math.max(
    scoreRatio(maxVectorDelta, resolved.movingVectorDelta),
    scoreRatio(rmsDelta, resolved.movingRmsDelta),
    scoreRatio(magnitudeRange, resolved.movingMagnitudeRange),
  );
  const shakyScore = Math.max(
    scoreRatio(maxVectorDelta, resolved.shakyVectorDelta),
    scoreRatio(rmsDelta, resolved.shakyRmsDelta),
    scoreRatio(magnitudeRange, resolved.shakyMagnitudeRange),
  );

  if (movingScore >= 1) {
    return { state: 'moving', score: Math.min(1, movingScore) };
  }
  if (shakyScore >= 1) {
    return { state: 'shaky', score: Math.min(1, shakyScore) };
  }
  return { state: 'stable', score: Math.max(0, Math.min(1, shakyScore)) };
}

export function createMotionStabilityTracker(options: MotionStabilityOptions = {}) {
  const resolved = mergeOptions(options);
  let samples: MotionSample[] = [];
  let current: MotionStabilityResult = { state: 'stable', score: 0 };
  let lastMovingAt: number | null = null;

  return {
    update(sample: MotionSample): MotionStabilityResult {
      samples.push(sample);
      const cutoff = sample.timestamp - resolved.windowMs - resolved.movingHoldMs;
      samples = samples.filter((item) => item.timestamp >= cutoff);

      const raw = classifyMotionStability(samples, resolved);
      if (raw.state === 'moving') {
        lastMovingAt = sample.timestamp;
        current = raw;
        return current;
      }

      if (
        current.state === 'moving' &&
        lastMovingAt != null &&
        sample.timestamp - lastMovingAt < resolved.movingHoldMs
      ) {
        current = { state: 'moving', score: Math.max(current.score, raw.score) };
        return current;
      }

      current = raw;
      if (current.state !== 'moving') {
        lastMovingAt = null;
      }
      return current;
    },

    reset(): void {
      samples = [];
      current = { state: 'stable', score: 0 };
      lastMovingAt = null;
    },

    getState(): MotionStabilityResult {
      return current;
    },
  };
}
