export type OnboardingMode = 'standard' | 'cleaning_mode';

/** The PostHog boolean flag that serves the cleaning flow when on. */
export const CLEANING_MODE_FLAG = 'cleaning_mode';

export function onboardingModeFrom(flagValue: unknown): OnboardingMode {
  return flagValue === true ? 'cleaning_mode' : 'standard';
}
