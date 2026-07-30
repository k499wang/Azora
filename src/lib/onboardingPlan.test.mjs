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

const baseInputs = {
  intents: ['stress_relief'],
  stressLevel: 5,
  sleepQuality: 8,
  age: 30,
  dailyMinutes: 3,
  breathHoldSeconds: 40,
  avgBpm: 72,
};

const actionById = (plan, id) => plan.actions.find((action) => action.id === id);

test('every plan is one session plus one daily check-in', () => {
  const plan = buildOnboardingPlan(baseInputs);
  assert.equal(plan.actions.length, 2);
  assert.ok(actionById(plan, 'session'));
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

test('an unrecognised goal still yields a technique', () => {
  const plan = buildOnboardingPlan({ ...baseInputs, intents: ['nonsense'] });
  assert.equal(actionById(plan, 'session').techniqueId, 'box');
});

test('the check-in is never a guided technique', () => {
  assert.equal(actionById(buildOnboardingPlan(baseInputs), 'checkIn').techniqueId, null);
});

test('heart rate does not affect session duration', () => {
  const minutes = (avgBpm) =>
    actionById(buildOnboardingPlan({ ...baseInputs, avgBpm }), 'session').minutes;
  assert.equal(minutes(45), minutes(120));
  assert.equal(minutes(45), Math.round(baseInputs.dailyMinutes));
});

test('daily total counts the session and the check-in', () => {
  const plan = buildOnboardingPlan(baseInputs);
  assert.equal(
    plan.fullDailyMinutes,
    actionById(plan, 'session').minutes + actionById(plan, 'checkIn').minutes,
  );
});

test('heart rate note reports the measured BPM at face value', () => {
  const plan = buildOnboardingPlan({ ...baseInputs, avgBpm: 72.4 });
  assert.equal(plan.heartRateNote, 'Your measured heart rate: 72 BPM.');
});

test('heart rate note is omitted without a baseline read', () => {
  const plan = buildOnboardingPlan({ ...baseInputs, avgBpm: null });
  assert.equal(plan.heartRateNote, null);
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
