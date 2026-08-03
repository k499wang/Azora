import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWeeklyProgress,
  withTodaysSession,
  WEEKLY_DAY_GOAL,
} from './weeklyProgress.ts';

test('counts only the last seven days', () => {
  const progress = buildWeeklyProgress([0, 2, 6, 7, 13]);
  assert.deepEqual(progress.completedOffsets, [0, 2, 6]);
  assert.equal(progress.daysCompleted, 3);
});

test('a day logged twice counts once', () => {
  assert.equal(buildWeeklyProgress([0, 0, 1]).daysCompleted, 2);
});

test('goal is met at the threshold, not past it', () => {
  const atGoal = Array.from({ length: WEEKLY_DAY_GOAL }, (_, i) => i);
  assert.equal(buildWeeklyProgress(atGoal).goalMet, true);
  assert.equal(buildWeeklyProgress(atGoal.slice(1)).goalMet, false);
});

test('ignores negative and non-integer offsets', () => {
  assert.equal(buildWeeklyProgress([-1, 1.5, 2]).daysCompleted, 1);
});

test('an empty history is zero, not an error', () => {
  const progress = buildWeeklyProgress([]);
  assert.equal(progress.daysCompleted, 0);
  assert.equal(progress.goalMet, false);
});

test('the just-finished session extends a run the cache has not caught up to', () => {
  const view = withTodaysSession(4, [1, 2, 3, 4]);
  assert.equal(view.currentStreak, 5);
  assert.deepEqual(view.completedDaysAgo, [0, 1, 2, 3, 4]);
});

test('a session already recorded today is not double counted', () => {
  const view = withTodaysSession(3, [0, 1, 2]);
  assert.equal(view.currentStreak, 3);
  assert.deepEqual(view.completedDaysAgo, [0, 1, 2]);
});

test('only the session that puts today on the board flags an extension', () => {
  assert.equal(withTodaysSession(4, [1, 2, 3, 4]).extendedToday, true);
  assert.equal(withTodaysSession(3, [0, 1, 2]).extendedToday, false);
});

test('the first ever session is a streak of one', () => {
  assert.equal(withTodaysSession(0, []).currentStreak, 1);
});

test('returning after a gap restarts at one rather than resuming a dead run', () => {
  assert.equal(withTodaysSession(6, [3, 4, 5]).currentStreak, 1);
});
