import test from 'node:test';
import assert from 'node:assert/strict';
import { changedOnboardingAnswers } from './onboardingAnswers.ts';

test('unanswered questions are not sent', () => {
  assert.deepEqual(
    changedOnboardingAnswers(
      { sleepDuration: null, struggles: [], intentFollowUps: {}, name: '' },
      {},
    ),
    {},
  );
});

test('new answers are sent', () => {
  assert.deepEqual(
    changedOnboardingAnswers({ sleepDuration: 'six_to_seven', struggles: ['focus'] }, {}),
    { sleepDuration: 'six_to_seven', struggles: ['focus'] },
  );
});

test('answers identical to the last save are not resent', () => {
  assert.deepEqual(
    changedOnboardingAnswers(
      { sleepDuration: 'six_to_seven', struggles: ['focus'] },
      { sleepDuration: '"six_to_seven"', struggles: '["focus"]' },
    ),
    {},
  );
});

test('a changed answer replaces the saved one', () => {
  assert.deepEqual(
    changedOnboardingAnswers({ age: 31 }, { age: '30' }),
    { age: 31 },
  );
});

test('clearing a saved answer is sent so the row stays the latest', () => {
  assert.deepEqual(
    changedOnboardingAnswers({ struggles: [] }, { struggles: '["focus"]' }),
    { struggles: [] },
  );
});
