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
  source: require('../../assets/breath-hero-background.jpg'),
  fallbackColor: colors.background.primary,
} as const;

export const BREATH_HERO_BACKGROUND_ASSET = {
  source: require('../../assets/home-hero-meadow.jpg'),
  fallbackColor: colors.background.primary,
} as const;

export const HEART_HERO_BACKGROUND_ASSET = {
  source: require('../../assets/heart-hero-background.jpg'),
  fallbackColor: colors.background.primary,
} as const;

export const PROFILE_HERO_BACKGROUND_ASSET = {
  source: require('../../assets/profile-hero-background.jpg'),
  fallbackColor: colors.background.primary,
} as const;
