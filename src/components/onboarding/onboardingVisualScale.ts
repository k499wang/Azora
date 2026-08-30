import { breakpoints } from '../../theme/breakpoints';
import { spacing } from '../../theme/spacing';
import { isTablet } from '../../theme/tablet';

/**
 * How much larger an onboarding illustration is drawn on a tablet.
 *
 * The flow is one drawing per screen with a line or two of copy over it, so a
 * phone-sized illustration on an iPad leaves most of the window empty. 1.5
 * gives the drawing roughly the share of the screen an iPhone gives it while
 * still clearing the copy and the footer button on the shortest iPad.
 *
 * Read from the device, not the window, because these numbers are read at
 * module load to build `StyleSheet` entries and SVG geometry, and only `screen`
 * cannot change afterwards. The cost is that an iPad in a narrow Slide Over
 * window still draws the large illustration, which is what
 * `ONBOARDING_VISUAL_MAX_WIDTH` is for.
 */
export const ONBOARDING_VISUAL_SCALE = isTablet ? 1.5 : 1;

/**
 * The widest an illustration may be drawn: the onboarding column's content box.
 * Anything sized from the window has to clamp to this or it runs past the
 * margin the rest of the screen sits on.
 */
export const ONBOARDING_VISUAL_MAX_WIDTH =
  breakpoints.dashboardContentMaxWidth - spacing.lg * 2;

/** One illustration measurement, at this device's size. */
export function scaleVisual(size: number): number {
  return Math.round(size * ONBOARDING_VISUAL_SCALE);
}
