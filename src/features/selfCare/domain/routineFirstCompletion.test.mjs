import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isRoutineStreakWeekdayFilled,
  routineStreakTitle,
  shouldOfferStreakGoal,
  streakGoalOptions,
} from './routineFirstCompletion.ts';

test('routine streak title reflects the supplied streak count', () => {
  assert.equal(routineStreakTitle(1), '1 day streak');
  assert.equal(routineStreakTitle(2), '2 day streak');
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

test('streak goal options only include goals still ahead of the streak', () => {
  assert.deepEqual(streakGoalOptions(1), [7, 14, 30, 50]);
  assert.deepEqual(streakGoalOptions(7), [14, 30, 50]);
  assert.deepEqual(streakGoalOptions(50), []);
});

test('a streak goal is offered when none is set or the set one is reached', () => {
  assert.equal(shouldOfferStreakGoal(null, 1), true);
  assert.equal(shouldOfferStreakGoal(7, 3), false);
  assert.equal(shouldOfferStreakGoal(7, 7), true);
  assert.equal(shouldOfferStreakGoal(null, 60), false);
});
