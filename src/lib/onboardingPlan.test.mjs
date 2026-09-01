import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyPlanTimeOverrides,
  buildOnboardingPlan,
  formatPlanTime,
  fromClockString,
  planTimeOfDayLabel,
  sessionTimeFor,
  toClockString,
} from './onboardingPlan.ts';

const baseInputs = {
  intents: ['stress_relief'],
  stressLevel: 5,
  sleepQuality: 8,
  age: 30,
  dailyMinutes: 3,
  wakeTimeMinutes: 7 * 60,
  sleepTimeMinutes: 22 * 60,
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

test('the primary intent owns both the technique and session time', () => {
  const plan = buildOnboardingPlan({
    ...baseInputs,
    intents: ['focus', 'sleep'],
  });
  const session = actionById(plan, 'session');

  assert.equal(session.techniqueId, 'box');
  assert.equal(session.minutesFromMidnight, 7 * 60);
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

test('the hand-picked exercise is scheduled midway through the waking day with its catalog duration', () => {
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
    assert.equal(handPicked.minutesFromMidnight, 14 * 60 + 30);
    assert.equal(handPicked.minutes, oneMinuteTechniques.has(handPicked.techniqueId) ? 1 : 2);
  }
});

test('the plan follows the user\'s wake and sleep routine', () => {
  const routineInputs = {
    ...baseInputs,
    wakeTimeMinutes: 6 * 60 + 30,
    sleepTimeMinutes: 23 * 60,
  };
  const morningPlan = buildOnboardingPlan({ ...routineInputs, intents: ['focus'] });
  const nightPlan = buildOnboardingPlan({ ...routineInputs, intents: ['sleep'] });

  assert.equal(actionById(morningPlan, 'session').minutesFromMidnight, 6 * 60 + 30);
  assert.equal(actionById(morningPlan, 'checkIn').minutesFromMidnight, 22 * 60 + 30);
  assert.equal(actionById(morningPlan, 'handPicked').minutesFromMidnight, 14 * 60 + 45);
  assert.equal(actionById(nightPlan, 'session').minutesFromMidnight, 22 * 60 + 30);
  assert.equal(actionById(nightPlan, 'checkIn').minutesFromMidnight, 6 * 60 + 30);
});

test('overnight waking windows wrap across midnight', () => {
  const plan = buildOnboardingPlan({
    ...baseInputs,
    intents: ['focus'],
    wakeTimeMinutes: 22 * 60,
    sleepTimeMinutes: 7 * 60,
  });

  assert.equal(actionById(plan, 'session').minutesFromMidnight, 22 * 60);
  assert.equal(actionById(plan, 'handPicked').minutesFromMidnight, 2 * 60 + 30);
  assert.equal(actionById(plan, 'checkIn').minutesFromMidnight, 6 * 60 + 30);
});

test('routine times normalize modulo one day', () => {
  const plan = buildOnboardingPlan({
    ...baseInputs,
    intents: ['focus'],
    wakeTimeMinutes: 25 * 60,
    sleepTimeMinutes: -60,
  });

  assert.equal(actionById(plan, 'session').minutesFromMidnight, 60);
  assert.equal(actionById(plan, 'checkIn').minutesFromMidnight, 22 * 60 + 30);
});

test('malformed or equal routine times use safe defaults', () => {
  for (const routine of [
    { wakeTimeMinutes: Number.NaN, sleepTimeMinutes: 22 * 60 },
    { wakeTimeMinutes: 9 * 60, sleepTimeMinutes: 9 * 60 },
  ]) {
    const plan = buildOnboardingPlan({ ...baseInputs, ...routine, intents: ['focus'] });
    assert.equal(actionById(plan, 'session').minutesFromMidnight, 7 * 60);
    assert.equal(actionById(plan, 'handPicked').minutesFromMidnight, 14 * 60 + 30);
    assert.equal(actionById(plan, 'checkIn').minutesFromMidnight, 21 * 60 + 30);
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
