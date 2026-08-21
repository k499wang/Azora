/**
 * Where every room sits in the hotel's pyramid.
 *
 * The rooms are hexagons and hexagons tessellate, so the hotel is not a list of
 * rooms with gaps between them — it is one honeycomb with no gaps at all. Room
 * one is the apex, each row below it is one room wider, and a room never moves
 * once it is placed: its slot is a function of its index and nothing else.
 *
 * Ten rows hold fifty-five rooms, which is a year of them at seven days each.
 * The fifty-sixth starts a second pyramid alongside the first.
 *
 * Pure geometry in the room's own viewBox units — see `RoomScene`. Nothing here
 * knows about screens, zoom or pixels.
 */

/** half the hexagon's flat-to-flat width, straight off `RoomScene`'s outline */
const HEX_HALF_W = 155.9;
/** centre to top vertex */
const HEX_HALF_H = 180;

/** flat-to-flat: the horizontal distance between two rooms in the same row */
export const HEX_W = HEX_HALF_W * 2;

/** vertex to vertex: the full height of a single hexagon */
export const HEX_H = HEX_HALF_H * 2;

/**
 * The vertical distance between rows. Three quarters of the hexagon's height,
 * not all of it — each row nests into the notches of the one above, which is
 * the whole reason a honeycomb has no gaps.
 */
export const HEX_PITCH_Y = HEX_HALF_H * 1.5;

export const PYRAMID_ROWS = 10;
export const PYRAMID_CAPACITY = (PYRAMID_ROWS * (PYRAMID_ROWS + 1)) / 2;

/** a full pyramid, plus clear air before the next one starts beside it */
export const PYRAMID_SPAN = (PYRAMID_ROWS + 1) * HEX_W;

export interface PyramidSlot {
  /** 0 for the first pyramid, 1 for the one beside it, and so on */
  pyramid: number;
  /** 1 at the apex, counting down */
  row: number;
  /** 0 at the left end of the row */
  col: number;
  /** centre of the room, in viewBox units */
  x: number;
  y: number;
}

/** the index the given row opens with, counting from its pyramid's apex */
function rowStart(row: number): number {
  return (row * (row - 1)) / 2;
}

/**
 * Inverts `rowStart`. The closed form lands on the right row, but it runs
 * through a square root and rows begin at exact triangular numbers, so it is
 * corrected rather than trusted.
 */
function rowOf(local: number): number {
  let row = Math.floor((Math.sqrt(8 * local + 1) + 1) / 2);

  if (rowStart(row) > local) row -= 1;
  else if (rowStart(row + 1) <= local) row += 1;

  return row;
}

export function slotAt(index: number): PyramidSlot {
  const pyramid = Math.floor(index / PYRAMID_CAPACITY);
  const local = index - pyramid * PYRAMID_CAPACITY;
  const row = rowOf(local);
  const col = local - rowStart(row);

  return {
    pyramid,
    row,
    col,
    // The row is centred on the apex, so it steps out half a hexagon each time
    // it grows — which is exactly the offset that makes the rows interlock.
    x: (col - (row - 1) / 2) * HEX_W + pyramid * PYRAMID_SPAN,
    y: (row - 1) * HEX_PITCH_Y,
  };
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

/**
 * The box the first `slots` rooms fit inside, in viewBox units.
 *
 * Measured over the slots actually drawn rather than assumed to be the whole
 * pyramid — a hotel of three rooms should stand back far enough to see three
 * rooms, not far enough to see the fifty-two that are not there yet.
 */
export function pyramidBounds(slots: number): Bounds {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let index = 0; index < Math.max(1, slots); index += 1) {
    const { x, y } = slotAt(index);
    minX = Math.min(minX, x - HEX_W / 2);
    maxX = Math.max(maxX, x + HEX_W / 2);
    minY = Math.min(minY, y - HEX_HALF_H);
    maxY = Math.max(maxY, y + HEX_HALF_H);
  }

  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

export interface Fit {
  scale: number;
  x: number;
  y: number;
}

/** the scale and offset that centre `bounds` inside a viewport, with margin */
export function fitToViewport(
  bounds: Bounds,
  viewportWidth: number,
  viewportHeight: number,
  margin: number,
): Fit {
  const usableWidth = Math.max(1, viewportWidth - margin * 2);
  const usableHeight = Math.max(1, viewportHeight - margin * 2);
  const scale = Math.min(usableWidth / bounds.width, usableHeight / bounds.height);

  return {
    scale,
    x: viewportWidth / 2 - (bounds.minX + bounds.width / 2) * scale,
    y: viewportHeight / 2 - (bounds.minY + bounds.height / 2) * scale,
  };
}

/**
 * The same box, opened out on every side.
 *
 * `pyramidBounds` measures hexagons, and a room is not drawn entirely inside
 * its own: the frame stroke is centred on the outline so half of it falls
 * beyond, and the miter where two sides meet at 120 degrees reaches half again
 * as far. Anything that crops to the bare bounds therefore cuts the frame off
 * every room around the pyramid's edge, worst at the corners. A room's viewBox
 * already reserves the room for this — it is why it is bigger than the hexagon
 * — so that reserve is what callers pass here.
 */
export function expandBounds(bounds: Bounds, x: number, y: number): Bounds {
  const minX = bounds.minX - x;
  const maxX = bounds.maxX + x;
  const minY = bounds.minY - y;
  const maxY = bounds.maxY + y;

  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}
