/**
 * The arithmetic behind dragging a row up or down Home's journey rail.
 *
 * Both lists on the rail — the dailies and the to-dos — reorder the same way,
 * and both hold rows of unequal height, so none of this can assume a row
 * pitch. Everything here is pure and worklet-safe: the gesture runs it on the
 * UI thread, and the tests run it on node.
 */

/** How tall each row is, by id. A row that has not been measured yet is absent. */
export type JourneyRowHeights = Record<string, number>;

/**
 * The top edge of the row at `index`, in a stack laid out in `order` at a
 * fixed `gap`.
 */
export function journeyRowOffset(
  order: readonly string[],
  heights: JourneyRowHeights,
  gap: number,
  index: number,
): number {
  'worklet';
  let offset = 0;
  for (let i = 0; i < index && i < order.length; i += 1) {
    offset += (heights[order[i]] ?? 0) + gap;
  }
  return offset;
}

/** Whether two orders hold the same rows in the same places. */
export function sameJourneyOrder(
  a: readonly string[],
  b: readonly string[],
): boolean {
  'worklet';
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/** `order` with the row at `from` lifted out and dropped back in at `to`. */
export function moveJourneyRow(
  order: readonly string[],
  from: number,
  to: number,
): string[] {
  'worklet';
  if (from === to || from < 0 || from >= order.length) return order.slice();
  const next = order.slice();
  const [moved] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(to, next.length)), 0, moved);
  return next;
}

/**
 * The last slot a row may land in: above `fixedTailId` when the order ends in
 * it, since that row stays last.
 */
export function journeyLastMovableIndex(
  order: readonly string[],
  fixedTailId: string | null,
): number {
  'worklet';
  const last = order.length - 1;
  return fixedTailId != null && order[last] === fixedTailId ? last - 1 : last;
}

/** `order` without its fixed last row, which has no place of its own to keep. */
export function withoutFixedTail(
  order: readonly string[],
  fixedTailId: string | null,
): string[] {
  return fixedTailId == null ? order.slice() : order.filter((id) => id !== fixedTailId);
}

/**
 * Where a row being dragged wants to land.
 *
 * Measured against the committed layout rather than the shifting one: a row
 * takes a slot the moment the dragged row's middle passes the middle of the
 * row that started there. Judging against positions that are themselves moving
 * is what makes a list flicker between two orders when a finger holds still on
 * a boundary.
 *
 * `heights` and `translation` are both in the committed frame, so the answer is
 * an index into the committed order.
 */
export function journeyDropIndex(
  order: readonly string[],
  heights: JourneyRowHeights,
  gap: number,
  fromIndex: number,
  translation: number,
): number {
  'worklet';
  const draggedTop =
    journeyRowOffset(order, heights, gap, fromIndex) + translation;
  const draggedMiddle = draggedTop + (heights[order[fromIndex]] ?? 0) / 2;
  let above = 0;
  let top = 0;
  for (let i = 0; i < order.length; i += 1) {
    const height = heights[order[i]] ?? 0;
    if (i !== fromIndex && top + height / 2 < draggedMiddle) above += 1;
    top += height + gap;
  }
  return above;
}

/** Every row on the rail has been measured, so the drag can do its arithmetic. */
/**
 * How tall the rows stand together, or null while any of them is unmeasured.
 *
 * A list positioned by transform alone gives up telling its parent how tall it
 * is — every row sits at the top and is moved down — so the box has to be told.
 */
export function journeyContentHeight(
  order: readonly string[],
  heights: JourneyRowHeights,
  gap: number,
): number | null {
  if (order.length === 0) return null;

  let total = 0;
  for (let i = 0; i < order.length; i += 1) {
    const height = heights[order[i]] ?? 0;
    if (height <= 0) return null;
    total += height + (i === 0 ? 0 : gap);
  }
  return total;
}

export function journeyRowsMeasured(
  order: readonly string[],
  heights: JourneyRowHeights,
): boolean {
  return order.length > 1 && order.every((id) => (heights[id] ?? 0) > 0);
}

/**
 * What a rail needs to know about the rows it runs beside. Everything is in
 * the order the rail is currently drawn for, which is not always the order the
 * rows were rendered in — see `useJourneyRail`.
 */
export interface JourneyRailMetrics {
  firstHeight: number;
  /** the last row the rail reaches, which is the last row unless it stops short */
  lastHeight: number;
  /** the top edge of that row, measured from the top of the first */
  lastOffset: number;
  /** the height of the box the rail is drawn in, for a rail inset from it */
  height: number;
  /** the rail reaches every row, so it may run on past the last one */
  reachesEnd: boolean;
}

/** The rail's two ends, as insets from the top and bottom of its box. */
export interface JourneyRailEnds {
  top: number;
  bottom: number;
}

/**
 * Where a particular list's rail starts and stops. Written per list because
 * the two differ — one section ends at its last row and the other has an add
 * button below it — and kept a worklet so the same answer is reachable from
 * the render pass and from the UI thread.
 */
export type JourneyRailShape = (metrics: JourneyRailMetrics) => JourneyRailEnds;

/**
 * Where the plan is up to: the first row in `order` that is not done, or
 * `order.length` when every row is. Rows finished out of turn do not move it —
 * the plan is walked in order, and this is how far that walk has got.
 */
export function journeyNextIndex(
  order: readonly string[],
  done: Readonly<Record<string, boolean>>,
): number {
  'worklet';
  let index = 0;
  while (index < order.length && done[order[index]] === true) index += 1;
  return index;
}

/**
 * The rail for one order of rows, or null while any of them is still
 * unmeasured.
 *
 * Null rather than a rail drawn from a zero height: a row that has mounted but
 * not been laid out yet would otherwise pull whichever end it holds up to the
 * top of the list for a frame.
 */
export function journeyRailEnds(
  order: readonly string[],
  heights: JourneyRowHeights,
  gap: number,
  height: number,
  shape: JourneyRailShape,
  /**
   * Stops the rail at the last of the rows leading the order that are all
   * done. A row finished out of turn does not extend it: the line only claims
   * as much of the list as has been walked in order.
   */
  done?: Readonly<Record<string, boolean>>,
): JourneyRailEnds | null {
  'worklet';
  if (order.length === 0) return null;
  for (let i = 0; i < order.length; i += 1) {
    if ((heights[order[i]] ?? 0) <= 0) return null;
  }

  const reach = done == null ? order.length : journeyNextIndex(order, done);
  const last = Math.max(0, reach - 1);

  return shape({
    firstHeight: heights[order[0]] ?? 0,
    lastHeight: heights[order[last]] ?? 0,
    lastOffset: journeyRowOffset(order, heights, gap, last),
    height,
    reachesEnd: reach === order.length,
  });
}
