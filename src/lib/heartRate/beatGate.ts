const FALLBACK_VISUAL_BEAT_INTERVAL_MS = 500;
const MIN_VISUAL_BEAT_INTERVAL_MS = 420;
const MAX_VISUAL_BEAT_INTERVAL_MS = 700;
const EXPECTED_INTERVAL_FRACTION = 0.65;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function visualBeatIntervalMs(currentBpm: number | null): number {
  if (currentBpm == null || currentBpm <= 0) {
    return FALLBACK_VISUAL_BEAT_INTERVAL_MS;
  }

  const expectedIntervalMs = 60000 / currentBpm;
  return clamp(
    expectedIntervalMs * EXPECTED_INTERVAL_FRACTION,
    MIN_VISUAL_BEAT_INTERVAL_MS,
    MAX_VISUAL_BEAT_INTERVAL_MS,
  );
}

export function shouldEmitVisualBeat(
  beatTimestamp: number,
  previousVisualBeatTimestamp: number | null,
  currentBpm: number | null,
): boolean {
  if (previousVisualBeatTimestamp == null) return true;
  return beatTimestamp - previousVisualBeatTimestamp >= visualBeatIntervalMs(currentBpm);
}
