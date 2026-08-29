import { roomWidthWithin } from '../../features/room/roomLayout';
import { spacing } from '../../theme/spacing';

const MAX_ROOM_WIDTH = 330;

/**
 * The largest share of the screen's height the room may take.
 *
 * Smaller than Home's share, and deliberately: an onboarding beat carries a
 * title, a paragraph and a footer button over its room, where Home carries only
 * a top bar. Sizing the room from width alone let it grow to 57% of a short
 * screen, which left the header, copy and footer no slack, overflowed the
 * scroll view and stopped `centerOnScreen` from centring anything.
 */
const ROOM_HEIGHT_SHARE = 0.46;

/**
 * How wide to draw the onboarding room. Pure, so the phone sizes it has to keep
 * working on are covered by tests rather than by remembering to check a device.
 */
export function getMochiStageWidth(
  screenWidth: number,
  screenHeight: number,
): number {
  return roomWidthWithin(screenWidth, screenHeight * ROOM_HEIGHT_SHARE, {
    maxWidth: MAX_ROOM_WIDTH,
    gutter: spacing.lg,
  });
}
