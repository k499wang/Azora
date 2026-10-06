import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isRoutineStreakWeekdayFilled,
  routineStreakCount,
  routineStreakSubtitle,
  shouldOfferStreakGoal,
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

test('routine streak week fills today and earlier completed weekdays only', () => {
  const todayIndex = 3;
  const completedDaysAgo = [0, 1, 2];

  assert.equal(isRoutineStreakWeekdayFilled(3, todayIndex, completedDaysAgo), true);
  assert.equal(isRoutineStreakWeekdayFilled(2, todayIndex, completedDaysAgo), true);
  assert.equal(isRoutineStreakWeekdayFilled(1, todayIndex, completedDaysAgo), true);
  assert.equal(isRoutineStreakWeekdayFilled(0, todayIndex, completedDaysAgo), false);
  assert.equal(isRoutineStreakWeekdayFilled(4, todayIndex, completedDaysAgo), false);
});

test('a streak goal is offered on the first day of a streak only', () => {
  assert.equal(shouldOfferStreakGoal(1), true);
  assert.equal(shouldOfferStreakGoal(2), false);
  assert.equal(shouldOfferStreakGoal(7), false);
  assert.equal(shouldOfferStreakGoal(60), false);
});
