import assert from 'node:assert/strict';
import test from 'node:test';
import { openWeekOnArrival, toggledOpenWeek } from './planOpenWeek';

/** As much of a week as the rule reads: where it is, and what it is doing. */
function week(weekNumber, state) {
  return { week: weekNumber, state };
}

test('a plan opens on the week in play', () => {
  const weeks = [week(1, 'done'), week(2, 'today'), week(3, 'ahead')];

  assert.equal(openWeekOnArrival(weeks), 2);
});

test('a plan with no week in play opens nothing', () => {
  // A finished plan, and a plan asked about before its weeks exist.
  assert.equal(openWeekOnArrival([week(1, 'done'), week(2, 'ahead')]), null);
  assert.equal(openWeekOnArrival([]), null);
});

test('opening another week closes the one that was open', () => {
  assert.equal(toggledOpenWeek(2, 3), 3);
});

test('pressing the open week closes it', () => {
  assert.equal(toggledOpenWeek(2, 2), null);
});

test('a press never leaves a third week open', () => {
  for (const open of [null, 1, 2, 3]) {
    for (const pressed of [1, 2, 3]) {
      const next = toggledOpenWeek(open, pressed);

      assert.ok(
        next === null || next === pressed,
        `${open} open, ${pressed} pressed, ${next} open`,
      );
    }
  }
});
