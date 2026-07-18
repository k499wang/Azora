export interface BreathingPhaseDurations {
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
}

export function getBreathingSessionTargetSeconds(
  pattern: BreathingPhaseDurations,
  rounds: number,
): number {
  const cycleSeconds =
    pattern.inhale + pattern.holdIn + pattern.exhale + pattern.holdOut;

  return cycleSeconds * rounds;
}

export function getBreathingSessionProgress(
  elapsedSeconds: number,
  targetSeconds: number,
  completed: boolean,
): number {
  if (completed) return 1;

  return Math.min(1, elapsedSeconds / Math.max(1, targetSeconds));
}

export function getBreathingSessionDurationSeconds(
  startedAtMs: number,
  endedAtMs: number,
  fallbackElapsedSeconds: number,
): number {
  return startedAtMs > 0
    ? Math.round((endedAtMs - startedAtMs) / 1000)
    : fallbackElapsedSeconds;
}
