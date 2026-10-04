import test from 'node:test';
import assert from 'node:assert/strict';

import {
  enrolledOrGoalPreset,
  onboardingPresetFor,
  planNameFor,
  planGoalDays,
  planPhaseBounds,
  planPhaseWeeksLabel,
  planPhases,
  planPhasesForPlan,
  planFinishLine,
  planFirstDayLine,
  planJourney,
  planOutcome,
  planProofLineForPreset,
  planProofLine,
} from './onboardingPreset.ts';
import {
  PROGRAM_NAME,
  latestProgramPreset,
  programPlanShape,
  programPresetWeeks,
} from '../features/program/domain/programCatalogue.ts';
import { INTENT_OPTIONS } from '../components/onboarding/data/intentOptions.ts';

const EVERY_INTENT = [
  'stress_relief', 'calm_fast', 'sleep', 'focus', 'energy', 'self_acceptance',
  'emotional_balance', 'self_care', 'spiritual', 'yoga', 'heart_health',
  'daily_habit', 'cleaning', 'other',
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

test('the catalogue has distinct plans for each supported territory', () => {
  const ids = new Set([
    ...EVERY_INTENT.map((i) => onboardingPresetFor(i).id),
    onboardingPresetFor('focus', {
      followUpAnswers: { when_focus: ['phone'] },
    }).id,
    onboardingPresetFor('energy', {
      followUpAnswers: { when_energy: ['constant'] },
    }).id,
  ]);
  assert.equal(ids.size, 9);
});

test('goals in the same territory get the same plan', () => {
  const pressure = ['stress_relief', 'calm_fast', 'emotional_balance',
    'heart_health', 'other'];
  for (const intent of pressure) {
    assert.equal(onboardingPresetFor(intent).id, 'pressure', intent);
  }
  assert.equal(onboardingPresetFor('self_acceptance').id, 'selfTrust');
  assert.equal(onboardingPresetFor('daily_habit').id, 'selfTrust');
  assert.equal(onboardingPresetFor('yoga').id, 'quiet');
});

test('the visible stress, overthinking and emotional-load choices start the pressure plan', () => {
  const choices = [
    ['stress_relief', 'I’m stressed all the time'],
    ['calm_fast', 'I overthink everything'],
    ['emotional_balance', 'I snap at people too easily'],
  ];
  for (const [intent, title] of choices) {
    assert.equal(INTENT_OPTIONS.find((option) => option.id === intent)?.title, title);
    assert.equal(onboardingPresetFor(intent).id, 'pressure');
  }
  assert.equal(INTENT_OPTIONS.some((option) => option.id === 'heart_health'), false);
  assert.equal(INTENT_OPTIONS.some((option) => option.id === 'other'), false);
});

test('the first-day invitation describes the purpose of the chosen plan', () => {
  const contexts = {
    night: /ready for bed/,
    morning: /morning step/,
    pressure: /overwhelming/,
    focus: /work or study/,
    home: /household task/,
    phone: /urge to scroll/,
    recovery: /without pushing through low energy/,
    selfTrust: /without needing a perfect result/,
    quiet: /quiet moment/,
  };
  for (const [planId, context] of Object.entries(contexts)) {
    assert.match(planFirstDayLine(planId), context, planId);
  }
});

test('direct answers refine a plan without second-guessing a stated goal', () => {
  assert.equal(
    onboardingPresetFor('focus', {
      followUpAnswers: { when_focus: ['phone'] },
    }).id,
    'phone',
  );
  assert.equal(
    onboardingPresetFor('sleep', { sleepCause: 'phone' }).id,
    'phone',
  );
  assert.equal(
    onboardingPresetFor('energy', {
      followUpAnswers: { when_energy: ['constant'] },
    }).id,
    'recovery',
  );
  assert.equal(
    onboardingPresetFor('focus', {
      followUpAnswers: { when_focus: ['starting'] },
    }).id,
    'focus',
  );
});

test('every plan has a length, so every plan can be finished', () => {
  for (const intent of EVERY_INTENT) {
    const { weeks } = onboardingPresetFor(intent);
    assert.ok(Number.isInteger(weeks) && weeks >= 4 && weeks <= 12, intent);
  }
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

test('every plan speaks in its own terms, not one set of lines for all territories', () => {
  const byPreset = new Map([
    ['night', planPhasesForPlan('night')],
    ['morning', planPhasesForPlan('morning')],
    ['pressure', planPhasesForPlan('pressure')],
    ['focus', planPhasesForPlan('focus')],
    ['quiet', planPhasesForPlan('quiet')],
    ['home', planPhasesForPlan('home')],
    ['phone', planPhasesForPlan('phone')],
    ['recovery', planPhasesForPlan('recovery')],
    ['selfTrust', planPhasesForPlan('selfTrust')],
  ]);
  assert.equal(byPreset.size, 9);

  // Every line has to be the plan's own words, or the journey is generic on a
  // screen titled "personalized".
  for (const index of [0, 1, 2]) {
    const reaches = [...byPreset.values()].map((phases) => phases[index].reach);
    assert.equal(new Set(reaches).size, 9, `step ${index} shares its reach`);
  }
});

test('a refined recommendation uses its own proof and phase copy', () => {
  const preset = onboardingPresetFor('focus', {
    followUpAnswers: { when_focus: ['phone'] },
  });

  assert.equal(preset.id, 'phone');
  assert.match(planProofLineForPreset(preset, 'focus'), /scroll/i);
  assert.match(planPhasesForPlan(preset.id)[0].reach, /pull/i);
});

test('every card line is short enough to read at a glance', () => {
  for (const intent of EVERY_INTENT) {
    for (const phase of planPhases(intent)) {
      assert.ok(phase.reach.length > 0, `${intent} ${phase.name} reach`);
      assert.ok(phase.reach.length <= 64, `${intent} ${phase.name} reach`);
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
    const line = planFirstDayLine(onboardingPresetFor(intent).id);

    assert.equal(shape.firstDayCount, 1, `${intent} no longer starts on one`);
    const length = shape.firstDayMinutes === 1 ? 'a minute' : `${shape.firstDayMinutes} minutes`;
    assert.ok(line.endsWith(`About ${length}.`), `${intent}: ${line}`);
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
      for (const [, number] of phase.reach.matchAll(/week (\d+)/gi)) {
        assert.ok(
          Number(number) <= phase.endWeek,
          `${intent} "${phase.name}" names week ${number}, past its week ${phase.endWeek}`,
        );
      }
    }
  }
});

test('the week copy speaks to someone who has never used the app', () => {
  // A new user does not know what a reset or Azo's rooms are, so the weeks are
  // described in terms of the exercise and what it changes in them.
  for (const intent of EVERY_INTENT) {
    for (const phase of planPhases(intent)) {
      assert.doesNotMatch(phase.reach, /\breset|rooms? filled|\bAzo\b/i, `${intent} ${phase.name}`);
    }
  }
});

test('no em dashes anywhere in what the plan screen says', () => {
  const lines = EVERY_INTENT.flatMap((intent) => [
    ...planPhases(intent).map((phase) => phase.reach),
    planProofLine(intent),
    ...planPhases(intent).map((phase) => phase.name),
  ]);
  for (const line of lines) {
    assert.ok(!line.includes('—'), `em dash in: ${line}`);
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

test('the finish line counts today as day one and names the condition', () => {
  const fourWeeks = { ...onboardingPresetFor('sleep'), weeks: 4 };
  const today = new Date(2026, 8, 26);
  assert.equal(
    planFinishLine(fourWeeks, today),
    'One step a day gets you there by Oct 23.',
  );
});

test('every goal\'s plan has an outcome to lead with', () => {
  for (const intent of ['stress_relief', 'sleep', 'focus', 'energy', 'other']) {
    const outcome = planOutcome(onboardingPresetFor(intent).id);
    assert.ok(outcome.length > 0, intent);
  }
});

test('the journey runs from day one to the last day, in order, one card a day', () => {
  for (const intent of EVERY_INTENT) {
    const preset = onboardingPresetFor(intent);
    const days = planJourney(preset.id).map((stop) => stop.day);
    assert.equal(days[0], 1, intent);
    assert.equal(days[days.length - 1], preset.weeks * 7, intent);
    assert.ok(days.includes(3) && days.includes(7), intent);
    assert.deepEqual(days, [...new Set(days)].sort((a, b) => a - b), intent);
  }
});

test('a later paywall describes the plan they enrolled in, not the goal alone', () => {
  // Focus with the phone as the trigger is refined to the shorter phone plan.
  // Rebuilt from the goal alone it becomes the longer focus plan, which is the
  // mismatch the enrollment exists to prevent.
  const refined = onboardingPresetFor('focus', {
    followUpAnswers: { when_focus: ['phone'] },
  });
  const goalOnly = onboardingPresetFor('focus');
  assert.notEqual(refined.weeks, goalOnly.weeks);

  assert.deepEqual(enrolledOrGoalPreset(refined.id, 'focus'), refined);
});

test('with no enrollment, a later paywall falls back to the goal', () => {
  for (const intent of EVERY_INTENT) {
    assert.deepEqual(enrolledOrGoalPreset(null, intent), onboardingPresetFor(intent));
  }
});
