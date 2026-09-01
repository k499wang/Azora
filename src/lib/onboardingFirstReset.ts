import {
  getBreathingSessionTargetSeconds,
  type BreathingPhaseDurations,
} from '../features/exercise/guidedBreathing/domain/breathingSessionTiming';

/**
 * Onboarding's first reset is a taste of the practice, not a full session: the
 * technique keeps its own pace, but the round count is trimmed so every
 * technique lands near the same short length no matter which one the user's
 * goal selected.
 */
const TARGET_SECONDS = 60;
const MIN_ROUNDS = 3;

export function firstResetRounds(
  pattern: BreathingPhaseDurations,
  defaultRounds: number,
): number {
  const cycleSeconds = getBreathingSessionTargetSeconds(pattern, 1);
  if (cycleSeconds <= 0) return defaultRounds;

  return Math.max(
    MIN_ROUNDS,
    Math.min(defaultRounds, Math.floor(TARGET_SECONDS / cycleSeconds)),
  );
}

/** 'in for 4, out for 6', dropping the phases this pattern does not use. */
export function firstResetPaceLabel(pattern: BreathingPhaseDurations): string {
  return [
    `in for ${pattern.inhale}`,
    pattern.holdIn > 0 ? `hold for ${pattern.holdIn}` : null,
    `out for ${pattern.exhale}`,
    pattern.holdOut > 0 ? `hold for ${pattern.holdOut}` : null,
  ]
    .filter((part): part is string => part != null)
    .join(', ');
}

export function firstResetDurationLabel(
  pattern: BreathingPhaseDurations,
  rounds: number,
): string {
  const seconds = getBreathingSessionTargetSeconds(pattern, rounds);
  return seconds >= 55 ? 'about a minute' : `about ${seconds} seconds`;
}
