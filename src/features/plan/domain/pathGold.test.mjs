import test from 'node:test';
import assert from 'node:assert/strict';
import { pathGoldDays, programDayFinishDates } from './pathGold.ts';

const finishes = (...dates) =>
  dates.map((localDate, index) => ({ programDay: index + 1, localDate }));

test('a day finishes on the latest date any of its activities was credited', () => {
  assert.deepEqual(
    programDayFinishDates([
      { programDay: 2, localDate: '2026-10-03' },
      { programDay: 1, localDate: '2026-10-01' },
      { programDay: 2, localDate: '2026-10-02' },
      { programDay: 1, localDate: '2026-10-02' },
    ]),
    [
      { programDay: 1, localDate: '2026-10-02' },
      { programDay: 2, localDate: '2026-10-03' },
    ],
  );
});

test('day one is gold once finished, and a run of consecutive days stays gold', () => {
  const gold = pathGoldDays(finishes('2026-10-01', '2026-10-02', '2026-10-03'), 3);
  assert.deepEqual([...gold], [1, 2, 3]);
});

test('a day after a gap is not gold, and the run picks up again from it', () => {
  const gold = pathGoldDays(
    finishes('2026-10-01', '2026-10-02', '2026-10-05', '2026-10-06'),
    4,
  );
  assert.deepEqual([...gold], [1, 2, 4]);
});

test('two days finished on the same date are not consecutive', () => {
  const gold = pathGoldDays(finishes('2026-10-01', '2026-10-01'), 2);
  assert.deepEqual([...gold], [1]);
});

test('month and year boundaries count as one calendar day', () => {
  const gold = pathGoldDays(finishes('2026-12-31', '2027-01-01'), 2);
  assert.deepEqual([...gold], [1, 2]);
});

test('missing dates are never guessed at', () => {
  const gold = pathGoldDays(
    [
      { programDay: 2, localDate: '2026-10-02' },
      { programDay: 3, localDate: '2026-10-03' },
    ],
    3,
  );
  assert.deepEqual([...gold], [3]);
  assert.deepEqual([...pathGoldDays([], 5)], []);
});

test('days past the done count are never gold', () => {
  const gold = pathGoldDays(finishes('2026-10-01', '2026-10-02'), 1);
  assert.deepEqual([...gold], [1]);
});
