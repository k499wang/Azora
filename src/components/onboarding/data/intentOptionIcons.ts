import type { OnboardingOptionIconName } from '../OnboardingOptionIcon';
import type { OnboardingIntent } from '../types';

export const INTENT_ICONS: Record<
  OnboardingIntent,
  OnboardingOptionIconName
> = {
  stress_relief: 'weather-windy',
  calm_fast: 'clock-fast',
  sleep: 'moon-waning-crescent',
  focus: 'target',
  energy: 'white-balance-sunny',
  spiritual: 'meditation',
  yoga: 'yoga',
  heart_health: 'heart-pulse',
  daily_habit: 'calendar-check-outline',
  other: 'dots-horizontal-circle-outline',
};
