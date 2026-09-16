import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOnboardingPlan } from './onboardingPlan.ts';
import {
  buildPlanHighlights,
  personalizedRoutineLabel,
  planNounForIntent,
} from './paywallPlanHighlights.ts';

const plan = buildOnboardingPlan({
  intents: ['stress_relief'],
  stressLevel: 5,
  sleepQuality: 8,
  age: 30,
  dailyMinutes: 3,
  wakeTimeMinutes: 7 * 60,
  sleepTimeMinutes: 22 * 60,
  breathHoldSeconds: 40,
});

const inputs = {
  plan,
  growthArea: { axis: 'calm', value: 42 },
  holdSeconds: 40,
};

test('buildPlanHighlights describes the unlocked capabilities and primary goal', () => {
  assert.deepEqual(buildPlanHighlights(inputs), [
    {
      icon: 'waves',
      text: 'Unlimited mental reset exercises.',
    },
    {
      icon: 'sparkle',
      text: 'Detailed stress and recovery insights.',
    },
    {
      icon: 'heart',
      text: 'Heart-rate tracking during breathing exercises.',
    },
    {
      icon: 'calendar',
      text: 'A daily plan built around your goal to reduce stress.',
    },
  ]);
});

const intentHighlights = {
  stress_relief: 'A daily plan built around your goal to reduce stress.',
  calm_fast: 'A daily plan built around your goal to calm down quickly.',
  sleep: 'A daily plan built around your goal to sleep better.',
  focus:
    'A daily plan built around your goal to stay focused while you work or study.',
  energy: 'A daily plan built around your goal to boost your energy.',
  spiritual:
    'A daily plan built around your goal to deepen your spiritual practice.',
  yoga: 'A daily plan built around your goal to support your yoga practice.',
  heart_health:
    'A daily plan built around your goal to support your heart health and recovery.',
  daily_habit: 'A daily plan built around your goal to build a daily habit.',
  other: 'A daily plan built from your onboarding answers.',
};

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

for (const [intent, expected] of Object.entries(intentHighlights)) {
  test(`buildPlanHighlights describes the ${intent} plan`, () => {
    const highlights = buildPlanHighlights({
      ...inputs,
      plan: { ...plan, intent },
    });

    assert.deepEqual(highlights[3], { icon: 'calendar', text: expected });
  });
}
