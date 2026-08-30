import { breakpoints } from '../../theme/breakpoints';

/**
 * The radar a phone draws, and the floor for every wider canvas.
 *
 * The canvas is the window's width, so on a tablet a fixed radius leaves the
 * pentagon marooned in the middle of it. Above the phone measures the radar
 * grows into whatever the labels around it do not need.
 */
const BASE_RADIUS = 120;
const BASE_LABEL_WIDTH = 84;
const LABEL_SHARE_OF_CANVAS = 0.18;
export const LABEL_OFFSET = 20;
/**
 * What a label costs above the vertex it hangs on, and below it.
 *
 * These mirror what the component actually renders: the label is lifted half a
 * line over its vertex, the two upper ones take a further nudge, and below that
 * sits a title that may wrap to a second line and then its value. Reserving the
 * wrap it might not need costs a little whitespace and is the difference
 * between a box that holds the drawing and one the labels hang out of.
 */
const LABEL_LIFT = 18;
const LABEL_UPPER_NUDGE = 20;
const LABEL_BODY = 18 * 2 + 14;
/** Kept clear above and below everything drawn. */
const BOX_MARGIN = 32;
/** The label text stops growing well before the geometry does. */
const MAX_TEXT_GROWTH = 1.5;
/**
 * How much of the canvas the pentagon itself may span.
 *
 * Filling every point the labels leave free makes the radar crowd whatever sits
 * above and below it — the copy around it is the same size on a tablet as on a
 * phone, so the drawing has to stop short and leave that margin standing.
 */
const MAX_RADIUS_SHARE = 0.24;
/** What the phone-tuned box trimmed off its square canvas. */
const PHONE_BOX_TRIM = 40;

export interface RadarLayout {
  radius: number;
  labelWidth: number;
  /** how much thicker every stroke and dot is drawn than on a phone */
  ink: number;
  /** the same, held back so the labels stay labels */
  textScale: number;
  /** the drawn height, with the dead space a grown radar leaves cut off */
  boxHeight: number;
  /** pulls the square canvas up so what is drawn sits in the box */
  boxTop: number;
}

export function axisAngle(index: number, total: number): number {
  return -Math.PI / 2 + (index * 2 * Math.PI) / total;
}

/**
 * How big the radar is drawn on a canvas of `size`, and how much of that canvas
 * it actually uses. Pure, so the phone sizes it must not move are covered by
 * tests rather than by remembering to check a device.
 */
export function getRadarLayout(size: number, axisCount: number): RadarLayout {
  // Only a regular-width canvas grows the radar. The widest phone would gain
  // two points and switch to the tighter box for it, which is a layout change
  // on a phone in exchange for nothing.
  const grows = size >= breakpoints.regularWidth;
  const labelWidth = grows
    ? Math.max(BASE_LABEL_WIDTH, Math.round(size * LABEL_SHARE_OF_CANVAS))
    : BASE_LABEL_WIDTH;
  const angles = Array.from({ length: axisCount }, (_, i) =>
    axisAngle(i, axisCount),
  );
  // The widest axis is the one that has to clear its label, so it sets how big
  // the pentagon can be before a label runs off the canvas.
  const widestAxis = angles.length
    ? Math.max(...angles.map((angle) => Math.abs(Math.cos(angle))))
    : 1;
  const fitted = Math.floor(
    (size / 2 - labelWidth) / Math.max(widestAxis, 0.001) - LABEL_OFFSET,
  );
  const radius = grows
    ? Math.max(
        BASE_RADIUS,
        Math.min(fitted, Math.round(size * MAX_RADIUS_SHARE)),
      )
    : BASE_RADIUS;
  const ink = radius / BASE_RADIUS;
  const textScale = Math.min(ink, MAX_TEXT_GROWTH);

  if (radius === BASE_RADIUS) {
    return {
      radius,
      labelWidth,
      ink,
      textScale,
      boxHeight: size - PHONE_BOX_TRIM,
      boxTop: -20,
    };
  }

  // What is actually drawn, in canvas coordinates. The pentagon is not centred
  // on its canvas — the top vertex reaches a full radius up while the bottom
  // two reach less than that down — so a box centred on the canvas leaves dead
  // space at one end and lets the labels hang out of the other.
  const labelRing = radius + LABEL_OFFSET;
  const highest = Math.min(...angles.map((angle) => Math.sin(angle)));
  const lowest = Math.max(...angles.map((angle) => Math.sin(angle)));
  const bandTop =
    size / 2 + labelRing * highest - (LABEL_LIFT + LABEL_UPPER_NUDGE) * textScale;
  const bandBottom =
    size / 2 + labelRing * lowest + (LABEL_BODY - LABEL_LIFT) * textScale;

  return {
    radius,
    labelWidth,
    ink,
    textScale,
    boxHeight: Math.round(bandBottom - bandTop + BOX_MARGIN * 2),
    boxTop: -Math.round(bandTop - BOX_MARGIN),
  };
}
