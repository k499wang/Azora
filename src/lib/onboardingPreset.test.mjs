import test from 'node:test';
import assert from 'node:assert/strict';
const LADDER = {
  startMinutes: 5,
  startTime: '9:30 PM',
  startDate: new Date(2026, 8, 17),
  startScore: 42,
  targetScore: 78,
};

import {
  onboardingPresetFor,
  planGoalsLine,
  planNameFor,
  planGoalDate,
  planPhaseWeeksLabel,
  planPhases,
  planProofLine,
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

test('every plan runs the same three steps, named in plain words', () => {
  for (const intent of EVERY_INTENT) {
    const names = planPhases(intent, LADDER).map((phase) => phase.name);
    assert.deepEqual(
      names,
      ['Build the habit', 'Go longer', 'Make it yours'],
      intent,
    );
  }
});

test('the phases cover the plan exactly, with no gap and no overlap', () => {
  for (const intent of EVERY_INTENT) {
    const phases = planPhases(intent, LADDER);
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
    for (const phase of planPhases(intent, LADDER)) {
      assert.ok(phase.endWeek >= phase.startWeek, `${intent} ${phase.name}`);
    }
  }
});

test('a week range reads as a range, and a single week as a week', () => {
  const [settle, , carry] = planPhases('sleep', LADDER);
  assert.equal(planPhaseWeeksLabel(settle), 'Weeks 1–2');
  assert.equal(planPhaseWeeksLabel(carry), 'Week 4');
});

test('every plan speaks in its own terms, not one set of lines for all five', () => {
  const byPreset = new Map();
  for (const intent of EVERY_INTENT) {
    byPreset.set(onboardingPresetFor(intent).id, planPhases(intent, LADDER));
  }
  assert.equal(byPreset.size, 5);

  // Settle means the same thing everywhere; it must not be worded the same
  // everywhere, or the ladder is generic on a screen titled "personalized".
  for (const index of [0, 1, 2]) {
    const details = [...byPreset.values()].map((phases) => phases[index].detail);
    assert.equal(new Set(details).size, 5, `phase ${index} shares wording`);
    const reaches = [...byPreset.values()].map((phases) => phases[index].reach);
    assert.equal(new Set(reaches).size, 5, `phase ${index} shares its reach`);
  }
});

test('every rung says what changes and what you can do by the end of it', () => {
  for (const intent of EVERY_INTENT) {
    for (const phase of planPhases(intent, LADDER)) {
      assert.ok(phase.detail.length > 0, `${intent} ${phase.name} detail`);
      assert.ok(phase.reach.length > 0, `${intent} ${phase.name} reach`);
    }
  }
});

test('the ladder carries the day 7 re-test and the last guided day, once each', () => {
  for (const intent of EVERY_INTENT) {
    const phases = planPhases(intent, LADDER);
    const milestones = phases.flatMap((phase) => phase.milestones);
    const labels = milestones.map((milestone) => milestone.label);
    const finalDay = onboardingPresetFor(intent).weeks * 7;
    assert.deepEqual(labels, ['Day 7', `Day ${finalDay}`], intent);

    // The re-test lands inside the first phase and the finish inside the last,
    // so neither is orphaned on a rung it has nothing to do with.
    assert.equal(phases[0].milestones.length, 1, intent);
    assert.equal(phases[phases.length - 1].milestones.length, 1, intent);
    for (const milestone of milestones) {
      assert.ok(milestone.note.length > 0, `${intent} ${milestone.label}`);
    }
  }
});

test('the first rung is written in the numbers the user just chose', () => {
  for (const intent of EVERY_INTENT) {
    const [settle] = planPhases(intent, {
      ...LADDER,
      startMinutes: 7,
      startTime: '6:45 AM',
    });
    assert.match(settle.detail, /7 minutes at 6:45 AM/, intent);
  }
});

test('a plan with no hour on it still states the length', () => {
  const [settle] = planPhases('sleep', {
    ...LADDER,
    startMinutes: 1,
    startTime: null,
  });
  assert.match(settle.detail, /^1 minute,/);
  assert.ok(!settle.detail.includes('at null'));
});

test('every rung is dated, so the plan sits on a calendar rather than on week numbers', () => {
  for (const intent of EVERY_INTENT) {
    const phases = planPhases(intent, LADDER);
    assert.match(phases[0].dateRange, /^17 Sep – /, intent);
    for (const phase of phases) {
      assert.match(phase.dateRange, /^\d{1,2} \w{3} – \d{1,2} \w{3}$/, intent);
      assert.match(phase.endsOn, /^\d{1,2} \w{3}$/, intent);
    }
    // The last rung ends on the plan's own goal date.
    assert.equal(
      phases[phases.length - 1].endsOn,
      planGoalDate(intent, LADDER.startDate),
      intent,
    );
  }
});

test('the projection climbs, front-loaded, and lands exactly on the target', () => {
  for (const intent of EVERY_INTENT) {
    const scores = planPhases(intent, LADDER).map((p) => p.projectedScore);
    assert.ok(scores[0] > LADDER.startScore, intent);
    assert.ok(scores[1] > scores[0], intent);
    assert.equal(scores[2], LADDER.targetScore, intent);

    // Front-loaded: the first rung takes more of the climb than a straight
    // line would give it, which is what stops the middle reading as a stall.
    const climb = LADDER.targetScore - LADDER.startScore;
    const phases = planPhases(intent, LADDER);
    const linear =
      LADDER.startScore + (climb * phases[0].endWeek) / phases[2].endWeek;
    assert.ok(scores[0] > linear, `${intent} projection is not front-loaded`);
  }
});

test('a flat plan projects a flat line rather than an invented climb', () => {
  const phases = planPhases('sleep', {
    ...LADDER,
    startScore: 60,
    targetScore: 60,
  });
  for (const phase of phases) {
    assert.equal(phase.projectedScore, 60);
  }
});

test('the dated moments carry their calendar day too', () => {
  const [settle, , carry] = planPhases('sleep', LADDER);
  assert.equal(settle.milestones[0].date, '23 Sep');
  assert.equal(carry.milestones[0].date, planGoalDate('sleep', LADDER.startDate));
});

test('every plan states the evidence it rests on, and states its own', () => {
  const lines = new Set();
  for (const intent of EVERY_INTENT) {
    const line = planProofLine(intent);
    assert.ok(line.length > 40, intent);
    lines.add(line);
  }
  assert.equal(lines.size, 5, 'one proof line per plan, not one shared claim');
});

/**
 * The house voice, enforced rather than trusted.
 *
 * Every consumer plan this screen is modelled on writes the same way: short
 * sentences, contractions, second person. Long compound sentences are what the
 * copy drifts back into, so the shape is a test rather than a note.
 */
function sentences(line) {
  return line
    .split(/(?<=[.?!])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

const LADDER_LINES = (intent) =>
  planPhases(intent, LADDER).flatMap((phase) => [
    phase.detail,
    phase.reach,
    phase.feel,
  ]);

test('the ladder speaks in short sentences, the way these plans are written', () => {
  for (const intent of EVERY_INTENT) {
    for (const line of LADDER_LINES(intent)) {
      for (const sentence of sentences(line)) {
        const words = sentence.split(/\s+/).length;
        assert.ok(words <= 17, `${intent}: ${words} words — "${sentence}"`);
      }
    }
  }
});

test('no rung is left empty, and every one says what it means in the body', () => {
  for (const intent of EVERY_INTENT) {
    for (const phase of planPhases(intent, LADDER)) {
      assert.ok(phase.detail.length > 0, `${intent} ${phase.name} detail`);
      assert.ok(phase.reach.length > 0, `${intent} ${phase.name} reach`);
      assert.ok(phase.feel.length > 0, `${intent} ${phase.name} feel`);
    }
  }
});

test('the copy uses contractions rather than the formal long form', () => {
  for (const intent of EVERY_INTENT) {
    const joined = LADDER_LINES(intent).join(' ');
    assert.match(joined, /['’](ll|s|re|t|ve)\b/, `${intent} reads formally`);
  }
});

test('the ladder shows a dose going up, not three takes on the same session', () => {
  for (const intent of EVERY_INTENT) {
    const [one, two, three] = planPhases(intent, LADDER);
    // Step one is what they chose; step two is longer; step three is that same
    // length with the guidance taken off. A user can read the change off the
    // rungs without being told it in a sentence.
    assert.match(one.detail, /^5 minutes at 9:30 PM/, intent);
    assert.match(two.detail, /^8 minutes at 9:30 PM/, intent);
    assert.match(three.detail, /^8 minutes,/, intent);
    assert.match(three.detail, /no voice|no script|nothing leading/, intent);
  }
});
