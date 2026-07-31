import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildOnboardingPlan,
  formatPlanTime,
  formatRetestDate,
  projectHold,
  sessionTimeFor,
  toClockString,
} from './onboardingPlan.ts';
import { estimateLungAge, MIN_LUNG_AGE } from './lungAge.ts';

const baseInputs = {
  intents: ['stress_relief'],
  stressLevel: 5,
  sleepQuality: 8,
  age: 30,
  dailyMinutes: 3,
  breathHoldSeconds: 40,
};

const actionById = (plan, id) => plan.actions.find((action) => action.id === id);

test('every plan has exactly two exercises and one daily check-in', () => {
  const plan = buildOnboardingPlan(baseInputs);
  assert.equal(plan.actions.length, 3);
  assert.ok(actionById(plan, 'session'));
  assert.ok(actionById(plan, 'handPicked'));
  assert.ok(actionById(plan, 'checkIn'));
});

test('actions are ordered through the day', () => {
  const times = buildOnboardingPlan(baseInputs).actions.map(
    (action) => action.minutesFromMidnight,
  );
  assert.deepEqual([...times].sort((a, b) => a - b), times);
});

test('the check-in sits opposite the session, never on top of it', () => {
  for (const intents of [['focus'], ['sleep'], ['stress_relief']]) {
    const plan = buildOnboardingPlan({ ...baseInputs, intents });
    const session = actionById(plan, 'session').minutesFromMidnight;
    const checkIn = actionById(plan, 'checkIn').minutesFromMidnight;
    assert.notEqual(session, checkIn);
    assert.ok(Math.abs(session - checkIn) >= 6 * 60);
  }
});

test('session time follows the goal', () => {
  assert.equal(sessionTimeFor(['focus'], 8), 8 * 60);
  assert.equal(sessionTimeFor(['energy'], 8), 8 * 60);
  assert.equal(sessionTimeFor(['sleep'], 8), 21 * 60 + 30);
  assert.equal(sessionTimeFor(['stress_relief'], 8), 18 * 60);
});

test('poor sleepers get a late session even without a sleep goal', () => {
  assert.equal(sessionTimeFor(['stress_relief'], 3), 21 * 60 + 30);
});

test('the technique follows the goal', () => {
  const forIntent = (intent) =>
    actionById(buildOnboardingPlan({ ...baseInputs, intents: [intent] }), 'session')
      .techniqueId;
  assert.equal(forIntent('sleep'), '478');
  assert.equal(forIntent('focus'), 'box');
  assert.equal(forIntent('heart_health'), 'resonance');
  assert.equal(forIntent('stress_relief'), 'relaxing');
});

test('the hand-picked exercise is deterministic and complements every recognized goal', () => {
  const expectedByIntent = {
    stress_relief: 'resonance',
    calm_fast: 'resonance',
    sleep: 'relaxing',
    focus: 'extended-exhale',
    energy: 'morning-charge',
    spiritual: 'coherent-6',
    yoga: 'belly',
    heart_health: 'coherent-6',
    daily_habit: 'belly',
    other: 'belly',
  };

  for (const [intent, expectedTechnique] of Object.entries(expectedByIntent)) {
    const firstPlan = buildOnboardingPlan({ ...baseInputs, intents: [intent] });
    const secondPlan = buildOnboardingPlan({ ...baseInputs, intents: [intent] });
    const primary = actionById(firstPlan, 'session');
    const handPicked = actionById(firstPlan, 'handPicked');

    assert.equal(handPicked.techniqueId, expectedTechnique);
    assert.notEqual(handPicked.techniqueId, primary.techniqueId);
    assert.deepEqual(handPicked, actionById(secondPlan, 'handPicked'));
  }
});

test('the hand-picked exercise is scheduled at 1 PM with its catalog duration', () => {
  const oneMinuteTechniques = new Set(['relaxing', 'belly']);

  for (const intents of [
    ['stress_relief'],
    ['sleep'],
    ['focus'],
    ['energy'],
    ['spiritual'],
    ['yoga'],
  ]) {
    const handPicked = actionById(
      buildOnboardingPlan({ ...baseInputs, intents }),
      'handPicked',
    );
    assert.equal(handPicked.minutesFromMidnight, 13 * 60);
    assert.equal(handPicked.minutes, oneMinuteTechniques.has(handPicked.techniqueId) ? 1 : 2);
  }
});

test('an unrecognised goal still yields a technique', () => {
  const plan = buildOnboardingPlan({ ...baseInputs, intents: ['nonsense'] });
  assert.equal(actionById(plan, 'session').techniqueId, 'box');
});

test('the check-in is never a guided technique', () => {
  assert.equal(actionById(buildOnboardingPlan(baseInputs), 'checkIn').techniqueId, null);
});

test('session duration follows only the daily minute commitment', () => {
  const minutes = (inputs) =>
    actionById(buildOnboardingPlan(inputs), 'session').minutes;
  assert.equal(minutes(baseInputs), Math.round(baseInputs.dailyMinutes));
  assert.equal(
    minutes({
      ...baseInputs,
      stressLevel: 10,
      sleepQuality: 1,
      age: 70,
      breathHoldSeconds: null,
    }),
    Math.round(baseInputs.dailyMinutes),
  );
});

test('daily total counts both exercises and the check-in', () => {
  const plan = buildOnboardingPlan(baseInputs);
  assert.equal(
    plan.fullDailyMinutes,
    actionById(plan, 'session').minutes +
      actionById(plan, 'handPicked').minutes +
      actionById(plan, 'checkIn').minutes,
  );
});

test('the projection is above baseline but stays conservative', () => {
  const projection = projectHold(40);
  assert.ok(projection.lowSeconds > 40);
  assert.ok(projection.highSeconds > projection.lowSeconds);
  assert.ok(projection.highSeconds <= 60);
});

test('short holds still get a meaningful range', () => {
  const projection = projectHold(12);
  assert.ok(projection.lowSeconds >= 14);
  assert.ok(projection.highSeconds >= projection.lowSeconds + 3);
});

test('no projection without a recorded hold', () => {
  assert.equal(buildOnboardingPlan({ ...baseInputs, breathHoldSeconds: null }).projection, null);
});

test('the lung-age goal uses the projected high hold', () => {
  const plan = buildOnboardingPlan(baseInputs);
  const expectedTarget = estimateLungAge(
    plan.projection.highSeconds,
    baseInputs.age,
  ).years;

  assert.equal(plan.lungAgeGoal.mode, 'lower');
  assert.equal(plan.lungAgeGoal.targetYears, expectedTarget);
  assert.ok(plan.lungAgeGoal.targetYears < plan.lungAgeGoal.currentYears);
});

test('the current lung age uses the exact recorded hold', () => {
  const breathHoldSeconds = 10.13;
  const plan = buildOnboardingPlan({ ...baseInputs, breathHoldSeconds });

  assert.equal(
    plan.lungAgeGoal.currentYears,
    estimateLungAge(breathHoldSeconds, baseInputs.age).years,
  );
  assert.equal(plan.projection.baselineSeconds, Math.round(breathHoldSeconds));
});

test('there is no lung-age goal without a positive recorded hold', () => {
  for (const breathHoldSeconds of [null, 0, -1]) {
    const plan = buildOnboardingPlan({ ...baseInputs, breathHoldSeconds });
    assert.equal(plan.lungAgeGoal, null);
  }
});

test('the youngest lung age gets a maintain goal', () => {
  const plan = buildOnboardingPlan({ ...baseInputs, breathHoldSeconds: 60 });

  assert.deepEqual(plan.lungAgeGoal, {
    mode: 'maintain',
    currentYears: MIN_LUNG_AGE,
    targetYears: MIN_LUNG_AGE,
  });
});

test('the re-test lands six days out, counting today as day one', () => {
  assert.equal(formatRetestDate(new Date(2026, 6, 29)), 'Aug 4');
  assert.equal(formatRetestDate(new Date(2026, 11, 30)), 'Jan 5');
});

test('clock strings are zero-padded twenty-four hour', () => {
  assert.equal(toClockString(21 * 60 + 30), '21:30');
  assert.equal(toClockString(8 * 60), '08:00');
  assert.equal(toClockString(0), '00:00');
});

test('times format in twelve-hour clock', () => {
  assert.equal(formatPlanTime(0), '12:00 AM');
  assert.equal(formatPlanTime(8 * 60), '8:00 AM');
  assert.equal(formatPlanTime(12 * 60), '12:00 PM');
  assert.equal(formatPlanTime(18 * 60), '6:00 PM');
  assert.equal(formatPlanTime(21 * 60 + 30), '9:30 PM');
});
