import test from 'node:test';
import assert from 'node:assert/strict';
import {
  personalizedRoutineLabel,
  planNounForIntent,
} from './paywallPlanHighlights.ts';

// The thirteen onboarding goals, each expected to collapse into one of the six
// umbrella nouns the headline can name.
const umbrellaByIntent = {
  stress_relief: 'calm',
  calm_fast: 'calm',
  yoga: 'calm',
  daily_habit: 'calm',
  other: 'calm',
  emotional_balance: 'balance',
  self_acceptance: 'balance',
  self_care: 'balance',
  spiritual: 'balance',
  sleep: 'sleep',
  focus: 'focus',
  energy: 'energy',
  heart_health: 'heart health',
};

test('planNounForIntent maps every goal onto one umbrella noun', () => {
  for (const [intent, expected] of Object.entries(umbrellaByIntent)) {
    assert.equal(planNounForIntent(intent), expected, intent);
  }

  assert.deepEqual(
    [...new Set(Object.values(umbrellaByIntent))].sort(),
    ['balance', 'calm', 'energy', 'focus', 'heart health', 'sleep'],
  );
  assert.equal(planNounForIntent(undefined), planNounForIntent('other'));
});

test('personalizedRoutineLabel names the configured duration and goal', () => {
  assert.equal(
    personalizedRoutineLabel('heart_health', 5),
    '5-minute heart-health routine',
  );
  assert.equal(personalizedRoutineLabel('sleep', 1), '1-minute sleep routine');
});
