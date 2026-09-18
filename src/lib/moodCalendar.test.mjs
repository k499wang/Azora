import assert from 'node:assert/strict';
import test from 'node:test';
import { moodLevelsByDay } from './moodCalendar';

const march = new Date(2026, 2, 15);

test('keeps only the days of the month on screen', () => {
  const levels = moodLevelsByDay(
    [
      { localDate: '2026-03-01', score: 100 },
      { localDate: '2026-02-28', score: 0 },
      { localDate: '2026-04-01', score: 0 },
    ],
    march,
  );

  assert.deepEqual([...levels.entries()], [[1, 5]]);
});

test('puts a score back on the five points it was answered on', () => {
  const levels = moodLevelsByDay(
    [
      { localDate: '2026-03-02', score: 0 },
      { localDate: '2026-03-03', score: 25 },
      { localDate: '2026-03-04', score: 50 },
      { localDate: '2026-03-05', score: 75 },
      { localDate: '2026-03-06', score: 100 },
    ],
    march,
  );

  assert.deepEqual(
    [2, 3, 4, 5, 6].map((day) => levels.get(day)),
    [1, 2, 3, 4, 5],
  );
});

test('a day without a check-in is absent, never a low one', () => {
  const levels = moodLevelsByDay([{ localDate: '2026-03-09', score: 40 }], march);

  assert.equal(levels.has(10), false);
  assert.equal(levels.get(9), 3);
});
