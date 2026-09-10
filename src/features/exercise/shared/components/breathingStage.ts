export const STAGE_VIEWBOX_W = 1080;
/** The artwork's own box. He is drawn whole and stood low, not cropped short. */
export const STAGE_VIEWBOX_H = 1200;
/** The eye line, in viewBox units — the point the layout pins. */
export const FACE_ORIGIN_Y = 488;
/**
 * How far down the viewport the eyes rest.
 *
 * Low: standing him this far down the screen is what puts his legs past the
 * bottom edge, so the session shows his upper body without the drawing itself
 * having to end at the waist.
 */
export const FACE_REST_RATIO = 0.68;

/**
 * How far the whole character drifts up over an inhale, as a share of the
 * viewport.
 *
 * It is a layout number, not a flourish: whatever he rises by is height he has
 * to have spare below the bottom edge, or a full inhale pulls his legs into
 * view. `breathingStage.test.mjs` holds that.
 */
export const BREATH_RISE_RATIO = 0.02;
/** The top of the ears, which is the highest ink on the stage. */
export const CROWN_Y = 100;
/**
 * Where the legs part.
 *
 * This, not the soles, is what has to clear the bottom edge: the notch between
 * his feet is the first thing that gives away that he has legs at all.
 */
export const INSEAM_Y = 1036;

/** The outer edge of the head, in viewBox units — the widest ink that must land on screen. */
export const HEAD_LEFT_X = 250;
export const HEAD_RIGHT_X = 840;

/**
 * How much of the window's width the character spans.
 *
 * Wider than the window, so the head reads large and the ear tips run off the
 * sides. Paired with `FACE_REST_RATIO`: the larger he is drawn the less of him
 * fits above the bottom edge, which is what leaves the session showing his
 * upper body and nothing below it.
 */
const WIDTH_RATIO = 1.6;
/**
 * The ceiling a short window imposes, so a tablet does not get a head the size
 * of a dinner plate. Loose enough that no phone is ever capped by it.
 */
const MAX_WIDTH_FROM_VIEWPORT = 1.05;

export interface BreathingStage {
  width: number;
  height: number;
  /** the stage's top edge, measured down from the top of the safe viewport */
  top: number;
}

/**
 * The character's box on this window. Pure, so "the ears are on screen and the
 * chest runs off the bottom" is something tests hold rather than something to
 * eyeball.
 */
export function getBreathingStage(
  windowWidth: number,
  viewport: number,
): BreathingStage {
  const width = Math.min(
    windowWidth * WIDTH_RATIO,
    viewport * MAX_WIDTH_FROM_VIEWPORT,
  );
  const height = width * (STAGE_VIEWBOX_H / STAGE_VIEWBOX_W);

  return {
    width,
    height,
    top: viewport * FACE_REST_RATIO - height * (FACE_ORIGIN_Y / STAGE_VIEWBOX_H),
  };
}
