import { roomWidthWithin } from '../../features/room/roomLayout';
import { spacing } from '../../theme/spacing';

const MAX_ROOM_WIDTH = 330;

/**
 * The same room on a tablet. The title, paragraph and footer button over it are
 * the same size there as on a phone, so they stop eating the screen as it grows
 * and the room can take both a wider cap and a larger share of the height.
 */
const REGULAR_MAX_ROOM_WIDTH = 600;

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
const REGULAR_ROOM_HEIGHT_SHARE = 0.55;

/**
 * How wide to draw the onboarding room. Pure, so the sizes it has to keep
 * working on are covered by tests rather than by remembering to check a device.
 *
 * Call `useMochiStageWidth` rather than this: the room artwork and the blob
 * standing in it are sized by different components, and they are only in the
 * same room while both ask the same question.
 */
export function getMochiStageWidth(
  screenWidth: number,
  screenHeight: number,
  regular = false,
): number {
  const heightShare = regular
    ? REGULAR_ROOM_HEIGHT_SHARE
    : ROOM_HEIGHT_SHARE;

  return roomWidthWithin(screenWidth, screenHeight * heightShare, {
    maxWidth: regular ? REGULAR_MAX_ROOM_WIDTH : MAX_ROOM_WIDTH,
    gutter: spacing.lg,
  });
}
