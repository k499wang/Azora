import { Easing } from 'react-native-reanimated';
import { spacing } from '../../theme/spacing';

/**
 * The one gap that separates a group from what introduces or follows it: a
 * label to its first row, and a list to the add row under it. Rows inside a
 * group sit closer than this, which is what makes them read as one list.
 */
export const TODAY_JOURNEY_GROUP_GAP = spacing.lg;

/** Shared geometry for every node in the Home daily journey. */
export const TODAY_JOURNEY_COLUMN_WIDTH = 40;
export const TODAY_JOURNEY_MARKER_SIZE = 22;
export const TODAY_JOURNEY_MARKER_ICON_SIZE = 14;
export const TODAY_JOURNEY_RAIL_WIDTH = 6;
/**
 * The rail is one dotted line that runs from the first daily to the last goal,
 * so its dashes are laid out at a fixed pitch rather than spread to fit each
 * section. Anything that spreads makes the pitch depend on how many rows a
 * section happens to have, and the seam between the two sections is where that
 * shows first.
 */
export const TODAY_JOURNEY_DASH_HEIGHT = 10;
export const TODAY_JOURNEY_DASH_GAP = 8;
export const TODAY_JOURNEY_DASH_PITCH =
  TODAY_JOURNEY_DASH_HEIGHT + TODAY_JOURNEY_DASH_GAP;

/** Dashes needed to fill `height` at that pitch, with one spare to clip. */
export function todayJourneyDashCount(height: number): number {
  return Math.max(2, Math.ceil(height / TODAY_JOURNEY_DASH_PITCH) + 1);
}

/**
 * The rail is one line across two sections, so both halves have to move on the
 * same curve. A daily opening changes the rail above and the goals' rail below
 * it at the same moment; if only one of them animates, the seam tears.
 */
export const TODAY_JOURNEY_RAIL_TIMING = {
  duration: 420,
  easing: Easing.inOut(Easing.cubic),
} as const;
