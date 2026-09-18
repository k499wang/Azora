/**
 * The profile's month as a grid of days.
 *
 * Always six weeks, never however many weeks the month happens to need: a card
 * that grows and shrinks by a row reflows every section under it. The
 * neighbouring months' dates stay on the grid so no row is ragged, but a
 * completed mark only ever describes the month the data belongs to — the grey
 * dates are the shape of the month, not history.
 */

export const COMPLETION_CALENDAR_WEEKS = 6;

/** The shape of the month, before anything is said about its days. */
export interface MonthGridCell {
  key: string;
  /** The date drawn in the cell, which may belong to a neighbouring month. */
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export interface CompletionCalendarCell extends MonthGridCell {
  isCompleted: boolean;
}

/**
 * The grid itself, which every calendar card in the app draws the same way.
 *
 * Kept apart from what is marked on it: the completion card fills a day it was
 * shown up on, the mood card colours it by how it went, and neither needs its
 * own idea of where a Tuesday goes.
 */
export function buildMonthGrid(
  monthDate: Date,
  /** Injectable so a test can name the day it is looking at. */
  today: Date = new Date(),
): MonthGridCell[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const leadingSlots = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();

  const cells: MonthGridCell[] = [];

  for (let index = 0; index < leadingSlots; index += 1) {
    cells.push({
      key: `leading-${index}`,
      dayNumber: previousMonthDays - leadingSlots + index + 1,
      isCurrentMonth: false,
      isToday: false,
    });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const isToday =
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day;

    cells.push({
      key: `day-${day}`,
      dayNumber: day,
      isCurrentMonth: true,
      isToday,
    });
  }

  let trailingDay = 1;

  while (cells.length < COMPLETION_CALENDAR_WEEKS * 7) {
    cells.push({
      key: `trailing-${trailingDay}`,
      dayNumber: trailingDay,
      isCurrentMonth: false,
      isToday: false,
    });
    trailingDay += 1;
  }

  return cells;
}

export function buildCompletionCalendar(
  monthDate: Date,
  completedDays: Set<number>,
  today: Date = new Date(),
): CompletionCalendarCell[] {
  return buildMonthGrid(monthDate, today).map((cell) => ({
    ...cell,
    isCompleted: cell.isCurrentMonth && completedDays.has(cell.dayNumber),
  }));
}
