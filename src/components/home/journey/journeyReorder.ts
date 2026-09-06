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
export function journeyRowsMeasured(
  order: readonly string[],
  heights: JourneyRowHeights,
): boolean {
  return order.length > 1 && order.every((id) => (heights[id] ?? 0) > 0);
}
