import test from 'node:test';
import assert from 'node:assert/strict';
import {
  onboardingPresetFor,
  planGoalsLine,
  planNameFor,
  planPhaseWeeksLabel,
  planPhases,
} from './onboardingPreset.ts';

const EVERY_INTENT = [
  'stress_relief', 'calm_fast', 'sleep', 'focus', 'energy', 'self_acceptance',
  'emotional_balance', 'self_care', 'spiritual', 'yoga', 'heart_health',
  'daily_habit', 'other',
];

test('every goal resolves to a plan, so none is handed over unnamed', () => {
  for (const intent of EVERY_INTENT) {
    assert.ok(planNameFor(intent).length > 0, intent);
  }
});

test('every plan names a territory and points at the daily unit', () => {
  for (const intent of EVERY_INTENT) {
    const name = planNameFor(intent);
    assert.ok(name.startsWith('Azora’s '), name);
    assert.ok(name.endsWith(' Reset'), name);
  }
});

test('the catalogue is five plans, not one per goal', () => {
  const ids = new Set(EVERY_INTENT.map((i) => onboardingPresetFor(i).id));
  assert.equal(ids.size, 5);
});

test('goals in the same territory get the same plan', () => {
  const pressure = ['stress_relief', 'calm_fast', 'emotional_balance',
    'self_acceptance', 'heart_health', 'other'];
  for (const intent of pressure) {
    assert.equal(planNameFor(intent), 'Azora’s Pressure Reset', intent);
  }
  assert.equal(planNameFor('daily_habit'), 'Azora’s Focus Reset');
  assert.equal(planNameFor('yoga'), 'Azora’s Quiet Reset');
});

test('every plan has a length, so every plan can be finished', () => {
  for (const intent of EVERY_INTENT) {
    const { weeks } = onboardingPresetFor(intent);
    assert.ok(Number.isInteger(weeks) && weeks >= 4 && weeks <= 12, intent);
  }
});

test('the goals line leads with the one they ranked first', () => {
  assert.equal(
    planGoalsLine('sleep', ['focus', 'sleep', 'stress_relief']),
    'built around sleep and focus',
  );
});

test('a single goal reads as a single goal', () => {
  assert.equal(planGoalsLine('sleep', ['sleep']), 'built around sleep');
});

test('nothing beyond two goals is named', () => {
  const line = planGoalsLine('sleep', ['sleep', 'focus', 'energy', 'yoga']);
  assert.equal(line, 'built around sleep and focus');
});

test('goals that share a phrase are not said twice', () => {
  // spiritual and self_care both sit in the quiet territory; only one subject
  // may appear, and never the same word joined to itself.
  const line = planGoalsLine('spiritual', ['spiritual', 'self_care']);
  assert.equal(line, 'built around quiet and looking after yourself');
});

test('a goal that names nothing specific leaves the line off', () => {
  assert.equal(planGoalsLine('other', ['other']), null);
  assert.equal(planGoalsLine(null, []), null);
});

test('an unranked goal still leads the line', () => {
  assert.equal(planGoalsLine(null, ['focus']), 'built around focus');
});

test('every plan runs Settle, Deepen and Carry, in that order', () => {
  for (const intent of EVERY_INTENT) {
    const names = planPhases(intent).map((phase) => phase.name);
    assert.deepEqual(names, ['Settle', 'Deepen', 'Carry'], intent);
  }
});

test('the phases cover the plan exactly, with no gap and no overlap', () => {
  for (const intent of EVERY_INTENT) {
    const phases = planPhases(intent);
    assert.equal(phases[0].startWeek, 1, intent);
    assert.equal(
      phases[phases.length - 1].endWeek,
      onboardingPresetFor(intent).weeks,
      intent,
    );
    for (let i = 1; i < phases.length; i += 1) {
      assert.equal(phases[i].startWeek, phases[i - 1].endWeek + 1, intent);
    }
  }
});

test('no phase is empty, so every phase is a real part of the plan', () => {
  for (const intent of EVERY_INTENT) {
    for (const phase of planPhases(intent)) {
      assert.ok(phase.endWeek >= phase.startWeek, `${intent} ${phase.name}`);
    }
  }
});

test('a week range reads as a range, and a single week as a week', () => {
  const [settle, , carry] = planPhases('sleep');
  assert.equal(planPhaseWeeksLabel(settle), 'Weeks 1–2');
  assert.equal(planPhaseWeeksLabel(carry), 'Week 4');
});
