import { HABIT_ILLUSTRATIONS } from './habitIllustrations';
import { ONBOARDING_ILLUSTRATIONS } from './onboardingIllustrations';
import { ONBOARDING_CONTEXT_ILLUSTRATIONS } from './onboardingContextIllustrations';
import { TODO_ILLUSTRATIONS } from './todoIllustrations';

/** Shared objects keep their identity across onboarding and daily habits. */
export const ONBOARDING_ILLUSTRATION_CATALOG = {
  ...HABIT_ILLUSTRATIONS,
  ...ONBOARDING_ILLUSTRATIONS,
  ...ONBOARDING_CONTEXT_ILLUSTRATIONS,
  'moon-waning-crescent': HABIT_ILLUSTRATIONS.moon,
  'white-balance-sunny': HABIT_ILLUSTRATIONS.sun,
  'weather-sunset-up': HABIT_ILLUSTRATIONS.sunrise,
  'heart-outline': HABIT_ILLUSTRATIONS.heart,
  'heart-glow': HABIT_ILLUSTRATIONS.heart,
  'heart-bpm': ONBOARDING_ILLUSTRATIONS['heart-pulse'],
  broom: TODO_ILLUSTRATIONS['todo-broom'],
} as const;

export type OnboardingIllustrationName = keyof typeof ONBOARDING_ILLUSTRATION_CATALOG;
