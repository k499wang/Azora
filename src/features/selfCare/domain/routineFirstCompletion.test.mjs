import test from 'node:test';
import assert from 'node:assert/strict';
import {
  routineStreakCount,
  routineStreakSubtitle,
  routineStreakWeekSlots,
  shouldOfferStreakGoal,
  STREAK_GOAL_DAYS,
  STREAK_GOAL_LABELS,
  streakOdometerDigits,
} from './routineFirstCompletion.ts';

test('routine streak count is the supplied streak, never below one', () => {
  assert.equal(routineStreakCount(0), 1);
  assert.equal(routineStreakCount(1), 1);
  assert.equal(routineStreakCount(12.7), 12);
});

test('routine streak subtitle welcomes day one and points ahead after it', () => {
  assert.equal(routineStreakSubtitle(1), 'Every streak starts with day one.');
  assert.equal(routineStreakSubtitle(5), 'Come back tomorrow to keep it going.');
});

test('routine streak week is the seven days ending today, oldest first', () => {
  const slots = routineStreakWeekSlots(3, [0, 1, 5]);

  assert.deepEqual(slots.map(slot => slot.label), ['Th', 'Fr', 'Sa', 'Su', 'Mo', 'Tu', 'We']);
  assert.deepEqual(slots.map(slot => slot.filled), [false, true, false, false, false, true, true]);
  assert.deepEqual(slots.map(slot => slot.isToday), [false, false, false, false, false, false, true]);
  assert.equal(slots[6].name, 'Wed');
});

test('routine streak week wraps across the start of the week', () => {
  const slots = routineStreakWeekSlots(0, [6]);

  assert.deepEqual(slots.map(slot => slot.label), ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']);
  assert.equal(slots[0].filled, true);
  assert.equal(slots[6].filled, false);
});

test('streak odometer rolls only changed digits, and the whole number on a length change', () => {
  assert.deepEqual(streakOdometerDigits(3, 4), [{ from: '3', to: '4' }]);
  assert.deepEqual(streakOdometerDigits(12, 13), [{ from: '1', to: '1' }, { from: '2', to: '3' }]);
  assert.deepEqual(streakOdometerDigits(19, 20), [{ from: '1', to: '2' }, { from: '9', to: '0' }]);
  assert.deepEqual(streakOdometerDigits(9, 10), [{ from: '9', to: '10' }]);
  assert.deepEqual(streakOdometerDigits(99, 100), [{ from: '99', to: '100' }]);
});

test('a streak goal is offered on the first day of a streak only', () => {
  assert.equal(shouldOfferStreakGoal(1), true);
  assert.equal(shouldOfferStreakGoal(2), false);
  assert.equal(shouldOfferStreakGoal(7), false);
  assert.equal(shouldOfferStreakGoal(60), false);
});

test('every streak goal option has a label', () => {
  for (const days of STREAK_GOAL_DAYS) assert.equal(typeof STREAK_GOAL_LABELS[days], 'string');
  assert.equal(STREAK_GOAL_LABELS[7], 'Strong start');
});
