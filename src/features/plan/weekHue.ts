import { colors } from '../../theme/colors';

const WEEK_HUES = [
  colors.playful.sky,
  colors.playful.teal,
  colors.playful.violet,
  colors.playful.coral,
] as const;

/** Each week keeps its own color along the journey. */
export function weekHue(week: number) {
  return WEEK_HUES[(week - 1) % WEEK_HUES.length];
}
