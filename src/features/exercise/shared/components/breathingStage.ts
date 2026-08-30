import { isRegularWidth } from '../../../../theme/breakpoints';

export const STAGE_VIEWBOX_W = 100;
export const STAGE_VIEWBOX_H = 160;
/** Where the face sits in the body, in viewBox units. */
export const FACE_ORIGIN_Y = 60;
/** How far down the viewport the face rests. */
export const FACE_REST_RATIO = 0.66;
/**
 * The flat flanks of the body, as a share of the stage's width.
 *
 * The path runs from x=1 to x=99, so the straight sides sit this far inside the
 * stage. They are the part that must never be on screen: a visible flank turns
 * the character into a rectangle with a domed top.
 */
export const STAGE_FLANK_INSET = 0.01;

/**
 * How much wider than the window the character is drawn: just enough that the
 * flat flanks land on the screen edge rather than inside it.
 */
const WIDTH_RATIO = 1.02;
/**
 * The ceiling a short, wide window imposes.
 *
 * The face is pinned at `FACE_REST_RATIO` of the viewport and the crown is
 * `FACE_ORIGIN_Y` of the body above it, so a body much taller than the viewport
 * puts the crown off the top. Both values sit under that.
 *
 * A tablet needs the looser one. At the phone's ceiling a portrait iPad is tall
 * enough that the height, not the width, decided the size — which drew the
 * character *narrower* than the window and put both flat flanks on screen with
 * background either side. Raising it hands the tablet the same width ratio a
 * phone gets, so it overflows the same way.
 */
const MAX_WIDTH_FROM_VIEWPORT = 0.62;
const REGULAR_MAX_WIDTH_FROM_VIEWPORT = 0.9;

export interface BreathingStage {
  width: number;
  height: number;
  /** the stage's top edge, measured down from the top of the safe viewport */
  top: number;
}

/**
 * The character's box on this window. Pure, so "it overflows the screen on
 * every device" is something tests hold rather than something to eyeball.
 */
export function getBreathingStage(
  windowWidth: number,
  viewport: number,
): BreathingStage {
  const maxFromViewport = isRegularWidth(windowWidth)
    ? REGULAR_MAX_WIDTH_FROM_VIEWPORT
    : MAX_WIDTH_FROM_VIEWPORT;
  const width = Math.min(
    windowWidth * WIDTH_RATIO,
    viewport * maxFromViewport,
  );
  const height = width * (STAGE_VIEWBOX_H / STAGE_VIEWBOX_W);

  return {
    width,
    height,
    top: viewport * FACE_REST_RATIO - height * (FACE_ORIGIN_Y / STAGE_VIEWBOX_H),
  };
}
