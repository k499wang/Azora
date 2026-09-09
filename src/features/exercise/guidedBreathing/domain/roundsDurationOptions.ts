import {
  getBreathingSessionTargetSeconds,
  type BreathingPhaseDurations,
} from './breathingSessionTiming';

export interface RoundsDurationOption {
  rounds: number;
  minutes: number;
  label: string;
}

const LENGTH_MULTIPLIERS = [1, 2, 3];

export function getRoundsDurationOptions(
  pattern: BreathingPhaseDurations,
  defaultRounds: number,
): RoundsDurationOption[] {
  return LENGTH_MULTIPLIERS.map((multiplier) => {
    const rounds = defaultRounds * multiplier;
    const minutes = Math.max(
      1,
      Math.round(getBreathingSessionTargetSeconds(pattern, rounds) / 60),
    );

    return { rounds, minutes, label: `${minutes} min` };
  });
}
