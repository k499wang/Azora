import test from 'node:test';
import assert from 'node:assert/strict';
import { countDayCompletion } from './dayCompletion.ts';

function counts(overrides = {}) {
  return countDayCompletion({
    guidedCompleted: false,
    handPickedCompleted: false,
    breathHoldCompleted: false,
    todosDone: 0,
    todosTotal: 0,
    ...overrides,
  });
}

test('an empty to-do list is complete on the three dailies alone', () => {
  const result = counts({
    guidedCompleted: true,
    handPickedCompleted: true,
    breathHoldCompleted: true,
  });

  assert.equal(result.done, 3);
  assert.equal(result.total, 3);
  assert.equal(result.liveCompleted, true);
});

test('to-dos are counted alongside the dailies', () => {
  const result = counts({
    guidedCompleted: true,
    todosDone: 2,
    todosTotal: 4,
  });

  assert.equal(result.dailiesDone, 1);
  assert.equal(result.done, 3);
  assert.equal(result.total, 7);
  assert.equal(result.liveCompleted, false);
});

test('finished dailies with an open to-do do not complete the day', () => {
  const result = counts({
    guidedCompleted: true,
    handPickedCompleted: true,
    breathHoldCompleted: true,
    todosDone: 1,
    todosTotal: 2,
  });

  assert.equal(result.liveCompleted, false);
});

test('a finished to-do list with an unfinished daily does not complete the day', () => {
  const result = counts({
    guidedCompleted: true,
    handPickedCompleted: true,
    todosDone: 2,
    todosTotal: 2,
  });

  assert.equal(result.liveCompleted, false);
});

test('both lists finished completes the day', () => {
  const result = counts({
    guidedCompleted: true,
    handPickedCompleted: true,
    breathHoldCompleted: true,
    todosDone: 3,
    todosTotal: 3,
  });

  assert.equal(result.done, 6);
  assert.equal(result.total, 6);
  assert.equal(result.liveCompleted, true);
});

test('a completed to-do that leaves the list never counts past it', () => {
  const result = counts({
    guidedCompleted: true,
    handPickedCompleted: true,
    breathHoldCompleted: true,
    todosDone: 2,
    todosTotal: 1,
  });

  assert.equal(result.done, 4);
  assert.equal(result.total, 4);
  assert.equal(result.liveCompleted, true);
});
