import test from 'node:test';
import assert from 'node:assert/strict';
const LADDER = {
  startMinutes: 5,
  startTime: '9:30 PM',
  startDate: new Date(2026, 8, 17),
  resetCount: 3,
  fullMinutes: 8,
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

const EASE_IN =
  'Everything in your plan comes from research on paced breathing, and the doses start low on purpose.';

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
      ['Settling in', 'When it starts to stick', 'By the end of it'],
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

  // Step one opens the same way everywhere on purpose: the evidence and the
  // shape of the day are facts about the plan they just built, not about the
  // territory. Everything after it has to be the plan's own words, or the
  // ladder is generic on a screen titled "personalized".
  for (const index of [0, 1, 2]) {
    const reaches = [...byPreset.values()].map((phases) => phases[index].reach);
    assert.equal(new Set(reaches).size, 5, `step ${index} shares its reach`);
  }
  for (const index of [1, 2]) {
    const details = [...byPreset.values()].map((phases) => phases[index].detail);
    assert.equal(new Set(details).size, 5, `step ${index} shares its wording`);
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

test('the first step is written in the numbers the user just chose', () => {
  for (const intent of EVERY_INTENT) {
    const [first] = planPhases(intent, {
      ...LADDER,
      resetCount: 2,
      fullMinutes: 11,
    });
    assert.match(
      first.detail,
      /You start with two short resets that come to about 11 minutes across the day/,
      intent,
    );
  }
});

test('a one-reset plan says reset, not resets', () => {
  const [first] = planPhases('sleep', {
    ...LADDER,
    resetCount: 1,
    fullMinutes: 4,
  });
  assert.match(
    first.detail,
    /You start with one short reset that comes? to about 4 minutes across the day/,
  );
});

test('every rung is dated, so the plan sits on a calendar rather than on week numbers', () => {
  for (const intent of EVERY_INTENT) {
    const phases = planPhases(intent, LADDER);
    assert.match(phases[0].dateRange, /^17 Sep – /, intent);
    for (const phase of phases) {
      assert.match(phase.dateRange, /^\d{1,2} \w{3} – \d{1,2} \w{3}$/, intent);
    }
    // The last step ends on the plan's own goal date.
    assert.ok(
      phases[phases.length - 1].dateRange.endsWith(
        planGoalDate(intent, LADDER.startDate),
      ),
      intent,
    );
  }
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
 * The failure mode this guards is not long-windedness — it is the opposite. A
 * page of clipped four-word sentences all cut to the same length is the tell
 * that nobody wrote it. Real copy runs long and short in the same breath, so
 * what is checked here is variety, not brevity.
 */
function sentences(line) {
  return line
    .split(/(?<=[.?!])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

const LADDER_LINES = (intent) =>
  planPhases(intent, LADDER).flatMap((phase) => [phase.detail, phase.reach]);

function wordCounts(intent) {
  return LADDER_LINES(intent).flatMap((line) =>
    sentences(line).map((sentence) => sentence.split(/\s+/).length),
  );
}

test('the copy runs long and short, rather than all one clipped length', () => {
  for (const intent of EVERY_INTENT) {
    const counts = wordCounts(intent);
    const longest = Math.max(...counts);
    const shortest = Math.min(...counts);
    assert.ok(longest >= 20, `${intent} never lets a sentence breathe: ${longest}`);
    assert.ok(
      longest - shortest >= 10,
      `${intent} sentences are all one length (${shortest}–${longest})`,
    );
    assert.ok(longest <= 36, `${intent} has a runaway sentence: ${longest}`);
  }
});

test('no rung is left empty, and every one says what it means in the body', () => {
  for (const intent of EVERY_INTENT) {
    for (const phase of planPhases(intent, LADDER)) {
      assert.ok(phase.detail.length > 0, `${intent} ${phase.name} detail`);
      assert.ok(phase.reach.length > 0, `${intent} ${phase.name} reach`);
    }
  }
});

test('the copy uses contractions rather than the formal long form', () => {
  for (const intent of EVERY_INTENT) {
    const joined = LADDER_LINES(intent).join(' ');
    assert.match(joined, /['’](ll|s|re|t|ve)\b/, `${intent} reads formally`);
  }
});

test('the first step says what the plan asks for, and eases them into it', () => {
  for (const intent of EVERY_INTENT) {
    const [one] = planPhases(intent, LADDER);
    assert.ok(one.detail.startsWith(EASE_IN), `${intent} does not ease them in`);
    // The shape it names has to be the shape of the list further down the
    // screen, or the ladder is describing a different plan.
    assert.match(
      one.detail,
      /You start with three short resets that come to about 8 minutes across the day/,
      intent,
    );
  }
});

test('the rooms counted are the weeks of the plan, which is what the loop pays', () => {
  // A room is seven filled slots and a slot is a finished day, so a week of
  // the plan is a room. Nothing here is a promise the app does not keep.
  for (const intent of EVERY_INTENT) {
    const [, two, three] = planPhases(intent, LADDER);
    const { weeks } = onboardingPresetFor(intent);
    const word = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
    // Step two counts the rooms filled so far; the wording around it varies by
    // plan, so what is pinned is the number, not the sentence it sits in.
    assert.match(
      two.reach,
      new RegExp(`Azo has ${word[two.endWeek]} rooms filled`),
      intent,
    );
    assert.match(
      three.reach,
      new RegExp(`Azo finishes with ${word[weeks]} rooms`),
      intent,
    );
  }
});

test('every step pays out in both directions, in you and in the room', () => {
  for (const intent of EVERY_INTENT) {
    for (const phase of planPhases(intent, LADDER)) {
      assert.match(phase.reach, /Azo/, `${intent} ${phase.name} drops the reward`);
      assert.match(phase.detail, /\w/, intent);
    }
  }
});

test('no em dashes anywhere in what the plan screen says', () => {
  const lines = EVERY_INTENT.flatMap((intent) => [
    ...LADDER_LINES(intent),
    planProofLine(intent),
    ...planPhases(intent, LADDER).map((phase) => phase.name),
  ]);
  for (const line of lines) {
    assert.ok(!line.includes('—'), `em dash in: ${line}`);
  }
});

test('the later steps name what the user will actually notice', () => {
  // A payoff line that only says "a run worth protecting" is describing the
  // app. These have to describe the person: what is different, in their body
  // and their day, by the date on the card.
  for (const intent of EVERY_INTENT) {
    const [, two, three] = planPhases(intent, LADDER);
    assert.match(two.reach, /By here you should|By here the/, intent);
    assert.match(three.reach, /^Expect /, intent);
  }
});
