import test from 'node:test';
import assert from 'node:assert/strict';
import {
  routineStreakCount,
  routineStreakSubtitle,
  routineStreakWeekSlots,
  shouldOfferStreakGoal,
  STREAK_GOAL_DAYS,
  STREAK_GOAL_LABELS,
  formatStreakGoalFinish,
  streakGoalFinishDate,
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

  assert.deepEqual(slots.map(slot => slot.name), ['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed']);
  assert.deepEqual(slots.map(slot => slot.filled), [false, true, false, false, false, true, true]);
  assert.deepEqual(slots.map(slot => slot.isToday), [false, false, false, false, false, false, true]);
});

test('routine streak week wraps across the start of the week', () => {
  const slots = routineStreakWeekSlots(0, [6]);

  assert.deepEqual(slots.map(slot => slot.name), ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
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

const ymd = date => [date.getFullYear(), date.getMonth() + 1, date.getDate()];

test('a goal finishes goal minus streak days after today, as a local midnight', () => {
  const finish = streakGoalFinishDate(new Date(2026, 9, 7, 21, 45), 1, 30);
  assert.deepEqual(ymd(finish), [2026, 11, 5]);
  assert.equal(finish.getHours(), 0);
  assert.deepEqual(ymd(streakGoalFinishDate(new Date(2026, 9, 7), 5, 7)), [2026, 10, 9]);
});

test('goal finish dates roll over month and year ends', () => {
  assert.deepEqual(ymd(streakGoalFinishDate(new Date(2026, 9, 28), 1, 7)), [2026, 11, 3]);
  assert.deepEqual(ymd(streakGoalFinishDate(new Date(2026, 1, 25), 1, 14)), [2026, 3, 10]);
  assert.deepEqual(ymd(streakGoalFinishDate(new Date(2026, 11, 30), 1, 30)), [2027, 1, 28]);
});

test('goal finish dates count calendar days across a daylight-saving change', () => {
  assert.deepEqual(ymd(streakGoalFinishDate(new Date(2026, 9, 30, 23, 30), 1, 7)), [2026, 11, 5]);
  assert.deepEqual(ymd(streakGoalFinishDate(new Date(2026, 2, 26, 0, 30), 1, 7)), [2026, 4, 1]);
  assert.deepEqual(ymd(streakGoalFinishDate(new Date(2026, 2, 6), 1, 7)), [2026, 3, 12]);
});

test('goal finish formats as a desk-calendar page and a short label', () => {
  assert.deepEqual(formatStreakGoalFinish(new Date(2025, 10, 6)), { month: 'NOV', day: '6', weekday: 'Thu', label: 'Thu, Nov 6' });
});
