import { colors } from '../theme/colors';

export const SUNSET_BACKGROUND_ASSET = {
  source: require('../../assets/backgrounds/sunset.jpg'),
  fallbackColor: colors.background.sunset,
} as const;

export const RESULT_BACKGROUND_ASSET = {
  source: require('../../assets/backgrounds/2066.jpg'),
  fallbackColor: colors.background.dawn,
} as const;
