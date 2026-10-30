export type OnboardingMode = 'standard' | 'cleaning_mode';

/** The PostHog boolean flag that serves the cleaning flow when on. */
export const CLEANING_MODE_FLAG = 'cleaning_mode';

/** The PostHog boolean flag that drops the Azo chat invite, chat, and greeting when on. */
export const SKIP_AZO_CHAT_FLAG = 'skip_azo_chat';

export function onboardingModeFrom(flagValue: unknown): OnboardingMode {
  return flagValue === true ? 'cleaning_mode' : 'standard';
}
