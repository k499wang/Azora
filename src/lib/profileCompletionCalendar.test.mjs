/**
 * The profile's completion calendar as a grid.
 *
 * The things worth holding: the grid is always six weeks whatever the month,
 * every date of the month lands in its own weekday column exactly once, the
 * grey neighbouring dates fill the gaps without ever claiming to be completed,
 * and today is marked only in the month being shown.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COMPLETION_CALENDAR_WEEKS,
  buildCompletionCalendar,
} from './profileCompletionCalendar.ts';

// September 2026 starts on a Tuesday, so it is the month that shows both a
// leading and a trailing neighbouring week.
const SEPTEMBER_2026 = new Date(2026, 8, 1);
const SEPTEMBER_18_2026 = new Date(2026, 8, 18);

const build = (completedDays = [], today = SEPTEMBER_18_2026) =>
  buildCompletionCalendar(SEPTEMBER_2026, new Set(completedDays), today);

const currentMonthCells = (cells) => cells.filter((cell) => cell.isCurrentMonth);

test('the grid is six weeks whatever the month', () => {
  for (const month of [0, 1, 8, 11]) {
    const cells = buildCompletionCalendar(new Date(2026, month, 1), new Set());
    assert.equal(cells.length, COMPLETION_CALENDAR_WEEKS * 7, `month ${month}`);
    assert.equal(cells.length % 7, 0, `month ${month}`);
  }
});

test('every date of the month lands in the grid once, in order', () => {
  const days = currentMonthCells(build()).map((cell) => cell.dayNumber);
  assert.deepEqual(days, Array.from({ length: 30 }, (_, index) => index + 1));
});

test('a month fills its weekday columns', () => {
  const cells = build();
  const [firstCurrent] = currentMonthCells(cells);
  assert.equal(cells.indexOf(firstCurrent), 2, 'September 2026 starts on a Tuesday');
  assert.equal(firstCurrent.dayNumber, 1);
});

test('the gaps are the neighbouring months, marked as outside the month', () => {
  const cells = build();
  assert.deepEqual(
    cells.slice(0, 2).map((cell) => [cell.dayNumber, cell.isCurrentMonth]),
    [
      [30, false],
      [31, false],
    ],
  );
  const trailing = cells.filter((cell) => !cell.isCurrentMonth).slice(2);
  assert.deepEqual(
    trailing.map((cell) => cell.dayNumber),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );
});

test('the days the data names are marked, and the day belongs to this month', () => {
  const cells = build([1, 18, 30]);
  assert.deepEqual(
    cells.filter((cell) => cell.isCompleted).map((cell) => cell.dayNumber),
    [1, 18, 30],
  );
  assert.ok(cells.filter((cell) => cell.isCompleted).every((cell) => cell.isCurrentMonth));
});

test('a numbered neighbour is never mistaken for the same day of this month', () => {
  // The leading grey 30 is August's, so September's 30th is the only match.
  const cells = build([30]);
  const marked = cells.filter((cell) => cell.isCompleted);
  assert.equal(marked.length, 1);
  assert.equal(marked[0].key, 'day-30');
  assert.equal(cells[0].dayNumber, 30);
  assert.equal(cells[0].isCompleted, false);
});

test('today is marked once, and only while its month is the one shown', () => {
  const todayCells = build().filter((cell) => cell.isToday);
  assert.deepEqual(todayCells.map((cell) => cell.dayNumber), [18]);

  const otherMonth = buildCompletionCalendar(new Date(2026, 9, 1), new Set(), SEPTEMBER_18_2026);
  assert.equal(otherMonth.some((cell) => cell.isToday), false);
});
