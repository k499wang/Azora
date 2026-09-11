import type { BreathingPhaseDurations } from './breathingSessionTiming';

export interface RoundsDurationOption {
  rounds: number;
  minutes: number;
  label: string;
  proOnly: boolean;
}

const OPTION_MINUTES = [1, 2, 3, 5, 10];
const FREE_MAX_MINUTES = 3;

export function getRoundsDurationOptions(
  pattern: BreathingPhaseDurations,
): RoundsDurationOption[] {
  const cycleSeconds =
    pattern.inhale + pattern.holdIn + pattern.exhale + pattern.holdOut;

  return OPTION_MINUTES.map((minutes) => ({
    rounds: Math.max(1, Math.round((minutes * 60) / cycleSeconds)),
    minutes,
    label: `${minutes} min`,
    proOnly: minutes > FREE_MAX_MINUTES,
  }));
}

/** The free option closest to the technique's own recommended length. */
export function getDefaultRoundsOption(
  options: RoundsDurationOption[],
  defaultRounds: number,
): RoundsDurationOption {
  const free = options.filter((option) => !option.proOnly);

  return free.reduce((closest, option) =>
    Math.abs(option.rounds - defaultRounds) <
    Math.abs(closest.rounds - defaultRounds)
      ? option
      : closest,
  );
}
