import test from 'node:test';
import assert from 'node:assert/strict';
import { countDayCompletion } from './dayCompletion.ts';

function counts(overrides = {}) {
  return countDayCompletion({
    dailiesDone: 0,
    dailiesTotal: 2,
    ...overrides,
  });
}

test('completed plan activities complete the day', () => {
  const result = counts({ dailiesDone: 2 });

  assert.equal(result.done, 2);
  assert.equal(result.total, 2);
  assert.equal(result.liveCompleted, true);
});

/**
 * The day is as long as the plan says it is. A plan asks for one exercise in
 * week one and three in its last, so a bar that always read "of 2" was wrong at
 * both ends: it told a week-one user they were half done when they were
 * finished, and a last-week user they were finished with a third of it left.
 */
test('a day of one is complete on that one', () => {
  const result = counts({ dailiesDone: 1, dailiesTotal: 1 });

  assert.equal(result.done, 1);
  assert.equal(result.total, 1);
  assert.equal(result.liveCompleted, true);
});

test('a day of three is not complete on two of them', () => {
  const result = counts({ dailiesDone: 2, dailiesTotal: 3 });

  assert.equal(result.total, 3);
  assert.equal(result.liveCompleted, false);
});

test('a day asking for nothing is never complete, so nothing is earned on it', () => {
  // A plan whose day this build cannot draw would otherwise pay out a
  // decoration for doing nothing at all.
  const result = counts({ dailiesDone: 0, dailiesTotal: 0 });

  assert.equal(result.total, 0);
  assert.equal(result.liveCompleted, false);
});

test('a daily the plan has stopped asking for never counts past the day', () => {
  const result = counts({ dailiesDone: 3, dailiesTotal: 2 });

  assert.equal(result.done, 2);
  assert.equal(result.total, 2);
});
