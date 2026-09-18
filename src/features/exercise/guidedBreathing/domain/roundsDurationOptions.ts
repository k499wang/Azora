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
  prescribedMinutes?: number,
): RoundsDurationOption[] {
  const cycleSeconds =
    pattern.inhale + pattern.holdIn + pattern.exhale + pattern.holdOut;

  const minutesOptions = [...OPTION_MINUTES];
  if (
    prescribedMinutes != null &&
    Number.isFinite(prescribedMinutes) &&
    prescribedMinutes > 0 &&
    !minutesOptions.includes(prescribedMinutes)
  ) {
    minutesOptions.push(prescribedMinutes);
    minutesOptions.sort((a, b) => a - b);
  }

  return minutesOptions.map((minutes) => ({
    rounds: Math.max(1, Math.round((minutes * 60) / cycleSeconds)),
    minutes,
    label: `${minutes} min`,
    proOnly: minutes > FREE_MAX_MINUTES,
  }));
}

/** Prefer a prescription; otherwise use the closest free technique default. */
export function getDefaultRoundsOption(
  options: RoundsDurationOption[],
  defaultRounds: number,
  prescribedMinutes?: number,
): RoundsDurationOption {
  const prescribed = options.find((option) => option.minutes === prescribedMinutes);
  if (prescribed) return prescribed;

  const free = options.filter((option) => !option.proOnly);

  return free.reduce((closest, option) =>
    Math.abs(option.rounds - defaultRounds) <
    Math.abs(closest.rounds - defaultRounds)
      ? option
      : closest,
  );
}
