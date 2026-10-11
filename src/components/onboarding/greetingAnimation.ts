export const GREETING_ANIMATION = require('../../../assets/animations/greeting.webp');

/** The frame these measurements are taken against. */
const GREETING_FRAME_HEIGHT = 578;

/** The highest and lowest rows the drawing reaches in any of its 239 frames. */
const GREETING_FRAME_HEAD = 49;
const GREETING_FRAME_FOOT = 568;

/**
 * The share of the greeting's height that stays empty above Azo's head.
 *
 * Across its 239 frames the first drawn row sits between 49 and 74 rows down the
 * frame, so 49 is the highest any frame reaches. A layout that places the frame
 * can pull it up by this much, letting that empty band sit under copy that has a
 * slot of its own instead of reserving the whole rectangle.
 */
export const GREETING_HEADROOM = GREETING_FRAME_HEAD / GREETING_FRAME_HEIGHT;

/**
 * The share of the greeting's height the drawing itself covers.
 *
 * The frame is not the drawing: it carries 49 empty rows above and 10 below. A
 * screen that has decided how much height the drawing may have divides by this
 * to get the frame that holds it. Re-measure both when the export changes.
 */
export const GREETING_DRAWN_SHARE =
  (GREETING_FRAME_FOOT - GREETING_FRAME_HEAD) / GREETING_FRAME_HEIGHT;
