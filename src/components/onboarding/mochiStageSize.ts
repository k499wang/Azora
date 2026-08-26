import { ROOM_ASPECT } from '../../features/room/roomGeometry';
import { spacing } from '../../theme/spacing';

const MAX_ROOM_WIDTH = 330;

/**
 * The largest share of the screen's height the room may take.
 *
 * It is the share a roomy phone already gives it today, applied everywhere:
 * sizing the room from width alone let it grow to 57% of a short screen, which
 * left the header, copy and footer no slack, overflowed the scroll view and
 * stopped `centerOnScreen` from centring anything. Clamping here leaves big
 * phones untouched and shrinks the room only where it did not fit.
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
  return Math.min(
    screenWidth - spacing.lg * 2,
    MAX_ROOM_WIDTH,
    (screenHeight * ROOM_HEIGHT_SHARE) / ROOM_ASPECT,
  );
}
