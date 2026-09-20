import test from 'node:test';
import assert from 'node:assert/strict';

import {
  onboardingPresetFor,
  planGoalsLine,
  planNameFor,
  planGoalDays,
  planPhaseBounds,
  planPhaseWeeksLabel,
  planPhases,
  planProofLine,
} from './onboardingPreset.ts';
import {
  PROGRAM_NAME,
  latestProgramPreset,
  programPlanShape,
  programPresetWeeks,
} from '../features/program/domain/programCatalogue.ts';

const EASE_IN =
  'Everything starts small on purpose. Short sessions, easy to keep, so the habit lands before the motivation fades.';

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

/**
 * One named practice, not five products. A goal picks what the plan contains;
 * it never picks what the plan is called, because a user choosing between five
 * titles is browsing rather than starting.
 */
test('every goal is handed the same named plan', () => {
  for (const intent of EVERY_INTENT) {
    assert.equal(planNameFor(intent), PROGRAM_NAME);
  }
  assert.equal(PROGRAM_NAME, 'The Azora Protocol');
});

test('the catalogue is five plans, not one per goal', () => {
  const ids = new Set(EVERY_INTENT.map((i) => onboardingPresetFor(i).id));
  assert.equal(ids.size, 5);
});

test('goals in the same territory get the same plan', () => {
  const pressure = ['stress_relief', 'calm_fast', 'emotional_balance',
    'self_acceptance', 'heart_health', 'other'];
  for (const intent of pressure) {
    assert.equal(onboardingPresetFor(intent).id, 'pressure', intent);
  }
  assert.equal(onboardingPresetFor('daily_habit').id, 'focus');
  assert.equal(onboardingPresetFor('yoga').id, 'quiet');
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
    const names = planPhases(intent).map((phase) => phase.name);
    assert.deepEqual(
      names,
      ['Settling in', 'When it starts to stick', 'By the end of it'],
      intent,
    );
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

test('every plan speaks in its own terms, not one set of lines for all five', () => {
  const byPreset = new Map();
  for (const intent of EVERY_INTENT) {
    byPreset.set(onboardingPresetFor(intent).id, planPhases(intent));
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
    for (const phase of planPhases(intent)) {
      assert.ok(phase.detail.length > 0, `${intent} ${phase.name} detail`);
      assert.ok(phase.reach.length > 0, `${intent} ${phase.name} reach`);
    }
  }
});

/**
 * The first rung states the plan's own day, not the session length the user
 * picked in the assessment. Those were the same number until the plan started
 * authoring its own days, and they have not been since: the user chooses when,
 * the plan chooses what and how long.
 */
test('the first step is written in the day the plan actually starts on', () => {
  for (const intent of EVERY_INTENT) {
    const shape = programPlanShape(
      latestProgramPreset(onboardingPresetFor(intent).id),
    );
    const [first] = planPhases(intent);

    assert.equal(shape.firstDayCount, 1, `${intent} no longer starts on one`);
    assert.match(
      first.detail,
      new RegExp(
        `Your day is one short reset of about ${shape.firstDayMinutes} minutes`,
      ),
      intent,
    );
  }
});

/**
 * Every rung describes its own stretch and stops there.
 *
 * The ladder briefly told week one which week a second reset joined and which
 * week a third did. That is a promise about a day the user has not reached: it
 * puts the work in front of them before the habit that carries it exists, and
 * it turns the stretch they are actually in into a warm-up for a later one. A
 * rung may name its own weeks; it may not name a week after them.
 */
test('no rung names a week later than the stretch it describes', () => {
  for (const intent of EVERY_INTENT) {
    for (const phase of planPhases(intent)) {
      const lines = `${phase.detail} ${phase.reach}`;
      for (const [, number] of lines.matchAll(/week (\d+)/gi)) {
        assert.ok(
          Number(number) <= phase.endWeek,
          `${intent} "${phase.name}" names week ${number}, past its week ${phase.endWeek}`,
        );
      }
    }
  }
});

test('the first rung never counts a reset the day does not ask for yet', () => {
  for (const intent of EVERY_INTENT) {
    const [first] = planPhases(intent);
    assert.doesNotMatch(first.detail, /joins|by the end|rather than one/i, intent);
  }
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
  planPhases(intent).flatMap((phase) => [phase.detail, phase.reach]);

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
    for (const phase of planPhases(intent)) {
      assert.ok(phase.detail.length > 0, `${intent} ${phase.name} detail`);
      assert.ok(phase.reach.length > 0, `${intent} ${phase.name} reach`);
    }
  }
});

test('the first step says what the plan asks for, and eases them into it', () => {
  for (const intent of EVERY_INTENT) {
    const [one] = planPhases(intent);
    assert.ok(one.detail.startsWith(EASE_IN), `${intent} does not ease them in`);
    // The shape it names has to be the shape of the list further down the
    // screen, or the ladder is describing a different plan.
    assert.match(one.detail, /Your day is one short reset/, intent);
  }
});

test('the rooms counted are the weeks of the plan, which is what the loop pays', () => {
  // A room is seven filled slots and a slot is a finished day, so a week of
  // the plan is a room. Nothing here is a promise the app does not keep.
  for (const intent of EVERY_INTENT) {
    const [, two, three] = planPhases(intent);
    const { weeks } = onboardingPresetFor(intent);
    const word = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
    // Step two counts the rooms filled so far; the wording around it varies by
    // plan, so what is pinned is the number, not the sentence it sits in.
    assert.match(
      two.reach,
      new RegExp(`${word[two.endWeek]} rooms filled`),
      intent,
    );
    assert.match(
      three.reach,
      new RegExp(`${word[weeks]} rooms`),
      intent,
    );
  }
});

test('every step pays out in both directions, in you and in the room', () => {
  for (const intent of EVERY_INTENT) {
    const [, two, three] = planPhases(intent);
    for (const phase of [two, three]) {
      assert.match(phase.reach, /rooms/, `${intent} ${phase.name} drops the reward`);
      assert.match(phase.detail, /\w/, intent);
    }
  }
});

test('no em dashes anywhere in what the plan screen says', () => {
  const lines = EVERY_INTENT.flatMap((intent) => [
    ...LADDER_LINES(intent),
    planProofLine(intent),
    ...planPhases(intent).map((phase) => phase.name),
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
    const [, two, three] = planPhases(intent);
    assert.match(two.reach, /By here you should|By here the/, intent);
    assert.match(three.reach, /^Expect /, intent);
  }
});

/**
 * Onboarding and the running plan are the same plan.
 *
 * The ladder onboarding shows is a promise about a plan the user has not started
 * yet; the catalogue is what they actually get. These were two tables until the
 * program work landed, and the failure they were heading for is quiet — a plan
 * sold as four weeks that runs for six, with nobody noticing until a user
 * counted.
 */
test('every plan onboarding names is a published plan of the same length', () => {
  for (const intent of EVERY_INTENT) {
    const preset = onboardingPresetFor(intent);
    const published = latestProgramPreset(preset.id);

    assert.ok(published != null, `${preset.id} is not published`);
    assert.equal(preset.name, published.name);
    assert.equal(preset.weeks, programPresetWeeks(published));
    assert.equal(
      preset.weeks * 7,
      published.days.length,
      `${preset.id} is sold as ${preset.weeks} weeks but runs ${published.days.length} days`,
    );
  }
});

test('the phases onboarding describes are the phases the plan runs', () => {
  for (const intent of EVERY_INTENT) {
    const preset = onboardingPresetFor(intent);
    const published = latestProgramPreset(preset.id);
    const bounds = planPhaseBounds(intent);

    assert.equal(bounds.length, published.phases.length);
    bounds.forEach((bound, index) => {
      const phase = published.phases[index];
      assert.equal(
        (bound.startWeek - 1) * 7 + 1,
        phase.startDay,
        `${preset.id} phase ${index + 1} starts on a different day`,
      );
      assert.equal(
        bound.endWeek * 7,
        phase.endDay,
        `${preset.id} phase ${index + 1} ends on a different day`,
      );
    });
  }
});
