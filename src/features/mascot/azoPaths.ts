/**
 * Azo, taken straight from `assets/New Mascot.svg`.
 *
 * Every path below is the artwork's own, verbatim, in its own 891.05x940 space.
 * The drawing's baked-in eyes and mouth are deliberately absent: those are the
 * only parts of him that move on their own, so they are rebuilt every frame from
 * `azoFace` instead of being frozen into a path here.
 *
 * The anchors underneath are measured off that same artwork — the flattened
 * bounding boxes of the shapes this file drops — so a face drawn from numbers
 * lands exactly where the illustrator put it.
 */

/** Drawn behind the body, as in the source file. */
export const ARM_RIGHT_PATH =
  'M312.04,500.64c-24.74,0-114.51,9.03-155.75,153.37-41.24,144.34,25.7,177.33,83.44,131.97,57.73-45.36,134.17-285.33,72.31-285.33Z';
export const ARM_LEFT_PATH =
  'M577.99,500.64c24.74,0,114.51,9.03,155.75,153.37,41.24,144.34-25.7,177.33-83.44,131.97-57.73-45.36-134.17-285.33-72.31-285.33Z';

export const BODY_PATH =
  'M448.27,461.46c-275.74-19.81-278.81,422.01-121.58,478.13,39.08,3.43,87.65-14.52,83.15-87.63,26.06-3.14,52.52-3.14,78.57,0-4.75,76.23,48.55,92.63,88.41,87.05,116.07-36.14,163.03-481.92-128.55-477.54Z';

export const BELLY_PATH =
  'M584.22,707.62c-30.51,124.49-245.78,124.61-276.3,0,0,0-28.87-50.26,20.62-140.99,0,0,28.87-57.73,117.53-57.73,177.73-1.32,151.11,165.1,138.15,198.73Z';

export const EAR_RIGHT_PATH =
  'M336.76,158.37C338.2,24.96,105.04-40.24,155.33,26.39c0,0-111.35-12.37-140.21,90.73-4.12,8.25,12.37,8.25,12.37,8.25,0,0-61.86,119.59,0,164.96,0,0,12.37,4.12,16.5-16.5,51.89,178.57,318.08,62.83,292.77-115.46Z';
export const EAR_LEFT_PATH =
  'M554.3,158.37c-1.45-133.41,231.72-198.6,181.42-131.97,0,0,111.35-12.37,140.21,90.73,4.12,8.25-12.37,8.25-12.37,8.25,0,0,61.86,119.59,0,164.96,0,0-12.37,4.12-16.5-16.5-51.89,178.57-318.08,62.83-292.77-115.46Z';
export const EAR_INNER_RIGHT_PATH =
  'M263.94,310.68C148.24,367.89,6.98,228.95,109.08,123.93c81-72.67,197.18,4.03,194.7,98.53-.25,35.96-8.47,74.77-39.85,88.22Z';
export const EAR_INNER_LEFT_PATH =
  'M627.11,310.68c115.7,57.21,256.97-81.72,154.86-186.75-81-72.67-197.18,4.03-194.7,98.53.25,35.96,8.47,74.77,39.85,88.22Z';

export const HEAD_PATH =
  'M692.81,466.21c-59.95,134.7-384.51,137.6-477.61,31.43-54.26-70.9-67.1-226.48,59.72-350.67,263.34-207.37,521.56,121.12,417.9,319.24Z';

export const NOSE_PATH =
  'M499.73,426.23c-12.74,37.81-38.91,33.11-58.92,33.72-74.11,6.29-45.89-98.13-33.47-115.02,39.25-65.7,108.07,2.41,92.38,81.3Z';

/** The artwork's own box. */
export const ART_WIDTH = 891.05;
export const ART_HEIGHT = 940;

/**
 * How much room the stage adds around the artwork.
 *
 * The ears touch both side edges of the source file and the body touches the
 * bottom, so a sprite drawn at the artwork's own box has nowhere to hop, wobble
 * or cast a shadow. Everything Azo does happens inside this margin.
 */
const PAD_X = 78;
const PAD_TOP = 96;
const PAD_BOTTOM = 108;

export const STAGE_X = -PAD_X;
export const STAGE_Y = -PAD_TOP;
export const STAGE_WIDTH = ART_WIDTH + PAD_X * 2;
export const STAGE_HEIGHT = ART_HEIGHT + PAD_TOP + PAD_BOTTOM;

/** Rendered height per unit of rendered width. */
export const AZO_ASPECT = STAGE_HEIGHT / STAGE_WIDTH;

export const VIEW_BOX = `${STAGE_X} ${STAGE_Y} ${STAGE_WIDTH} ${STAGE_HEIGHT}`;

/**
 * Where he is nailed down. Everything that swells, leans or hops pivots here,
 * which is what keeps his feet on the floor while the rest of him moves.
 */
export const FEET_Y = ART_HEIGHT;

/** Where the head sits on the chest, and how wide it is across the skull. */
export const HEAD_CENTER_X = 446.1;
export const HEAD_CENTER_Y = 326.9;
export const HEAD_WIDTH = 540.1;
export const SHOULDER_Y = 500.64;

/** Face anchors, in the artwork's own units. */
export const EYE_Y = 359.1;
export const EYE_LEFT_X = 316.2;
export const EYE_RIGHT_X = 576;
/** Half the resting eye, and the eyeball inside it. */
export const EYE_RADIUS = 55;
export const IRIS_RADIUS = 37;
/** How far the irises converge toward the nose. */
export const IRIS_INSET = 8.25;
/** How far inside the lids the eyeball is held, so it never breaks the rim. */
export const IRIS_LID_INSET = 6;
export const HIGHLIGHT_RADIUS = 16.5;
export const HIGHLIGHT_UP = 24.7;
/** Toward the nose from the iris centre. */
export const HIGHLIGHT_IN = 16.5;

export const MOUTH_X = 444.2;
export const MOUTH_Y = 489;

/** The ground he stands on. */
export const SHADOW_CY = 958;
export const SHADOW_RX = 236;
export const SHADOW_RY = 30;

/**
 * The share of the sprite box that is empty margin on each side.
 *
 * A caller lining Azo up against other artwork lines up his silhouette, not his
 * box — the box carries the room his hop and his ear wobble need. This cancels
 * it out.
 */
export const AZO_MARGIN = PAD_X / STAGE_WIDTH;
