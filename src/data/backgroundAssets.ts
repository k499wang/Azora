import { colors } from '../theme/colors';

export const SUNSET_BACKGROUND_ASSET = {
  source: require('../../assets/backgrounds/sunset.jpg'),
  fallbackColor: colors.background.sunset,
} as const;

export const RESULT_BACKGROUND_ASSET = {
  source: require('../../assets/backgrounds/2066.jpg'),
  fallbackColor: colors.background.dawn,
} as const;

export const HOME_HERO_BACKGROUND_ASSET = {
  source: require('../../assets/heroes/breath.jpg'),
  fallbackColor: colors.background.primary,
} as const;

export const BREATH_HERO_BACKGROUND_ASSET = {
  source: require('../../assets/heroes/home.jpg'),
  fallbackColor: colors.background.primary,
} as const;

export const HEART_HERO_BACKGROUND_ASSET = {
  source: require('../../assets/heroes/heart.jpg'),
  fallbackColor: colors.background.primary,
} as const;

export const DAILY_PLAN_BACKGROUND_ASSET = {
  source: require('../../assets/backgrounds/daily-plan-underwater.jpg'),
  fallbackColor: colors.background.lagoon,
} as const;

export const PROFILE_HERO_BACKGROUND_ASSET = {
  source: require('../../assets/heroes/profile.jpg'),
  fallbackColor: colors.background.primary,
} as const;
