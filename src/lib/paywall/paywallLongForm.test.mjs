import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PLAN_RESERVATION_MS,
  formatCountdown,
  paywallHighlights,
  paywallPlanFacts,
  personalizedPaywallPlan,
  planReservationRemaining,
} from './paywallLongForm.ts';
import { enrolledOrGoalPreset, onboardingPresetFor, planPhasesForPlan } from '../onboardingPreset.ts';
import { onboardingPlanBenefits } from '../onboardingPlanBenefits.ts';
import { ARCHETYPE_FOR_PLAN } from '../onboardingArchetype.ts';

const EVERY_INTENT = [
  'stress_relief', 'calm_fast', 'sleep', 'focus', 'energy', 'self_acceptance',
  'emotional_balance', 'self_care', 'spiritual', 'yoga', 'heart_health',
  'cleaning', 'daily_habit', 'other',
];

test('personalized copy uses the resolved plan and preserves the selected goal', () => {
  const preset = onboardingPresetFor('focus', {
    followUpAnswers: { when_focus: ['phone'] },
  });
  const today = new Date(2026, 11, 18, 12);
  const originalTime = today.getTime();
  const plan = personalizedPaywallPlan(preset, 'focus', '  Alex  ', '  spend less time scrolling  ', today);
  const benefits = onboardingPlanBenefits(preset, 'focus', 'spend less time scrolling');

  assert.equal(plan.headline, `Alex, we’ll help you feel ${benefits.outcome} in 28 days.`);
  assert.equal(plan.days, 28);
  assert.equal(plan.planName, 'Digital Discipline');
  assert.equal(plan.goal, 'spend less time scrolling');
  assert.match(plan.firstDayLine, /^Alex, day one of Digital Discipline/);
  assert.equal('approach' in plan, false);
  assert.equal(plan.finishDate, 'Jan 14');
  assert.deepEqual(plan.milestones.map(({ day, date }) => ({ day, date })), [
    { day: 14, date: 'Dec 31' },
    { day: 21, date: 'Jan 7' },
    { day: 28, date: 'Jan 14' },
  ]);
  assert.match(plan.milestones[1].outcome, /Work and study.*fewer interruptions.*stay with one thing/);
  assert.match(plan.milestones[0].outcome, /task you chose.*phone takes over/);
  assert.match(plan.milestones.at(-1).outcome, /ready to spend less time scrolling/);
  assert.equal(today.getTime(), originalTime, 'date input is not mutated');
});

test('the personalized paywall names every plan with its onboarding nickname', () => {
  for (const [planId, archetype] of Object.entries(ARCHETYPE_FOR_PLAN)) {
    const preset = enrolledOrGoalPreset(planId, 'other');
    const plan = personalizedPaywallPlan(preset, 'other', null, null, new Date(2026, 0, 1));
    assert.equal(plan.planName, archetype.planName, planId);
    assert.notEqual(plan.planName, 'Life Reset Plan', planId);
    assert.equal(paywallPlanFacts(preset, 5).planName, preset.name, 'other plan facts keep the catalogue name');
  }
});

test('every plan keeps its authored phase ends and describes distinct personal outcomes', () => {
  const planIds = ['night', 'morning', 'pressure', 'focus', 'quiet', 'home', 'phone', 'recovery', 'selfTrust'];
  for (const planId of planIds) {
    const preset = enrolledOrGoalPreset(planId, 'other');
    const plan = personalizedPaywallPlan(preset, 'other', null, null, new Date(2026, 0, 1));
    const phases = planPhasesForPlan(planId);
    assert.equal(plan.milestones.length, phases.length, planId);
    assert.deepEqual(plan.milestones.map(({ day }) => day), phases.map(({ endWeek }) => endWeek * 7));
    assert.deepEqual(plan.milestones.map(({ title }) => title), phases.map(({ name }) => name));
    assert.equal(plan.milestones.at(-1).day, plan.days, planId);
    assert.equal(plan.milestones.at(-1).date, plan.finishDate, planId);
    assert.equal(new Set(plan.milestones.map(({ outcome }) => outcome)).size, phases.length, planId);
    for (const milestone of plan.milestones) {
      assert.match(milestone.outcome, /you|your/i, 'outcomes address the user');
      assert.doesNotMatch(milestone.outcome, /practis|reset|guided exercise/i, 'milestones describe life beyond the exercises');
      assert.doesNotMatch(milestone.outcome, /cure|heart rate|HRV|blood pressure|cortisol|sleep through/i);
    }
  }
});

test('missing names and goals fall back to a complete sentence without a placeholder', () => {
  const preset = onboardingPresetFor('sleep');
  const plan = personalizedPaywallPlan(preset, 'sleep', '  ', '  ', new Date(2028, 1, 25));
  assert.match(plan.headline, /^We’ll help you feel /);
  assert.doesNotMatch(plan.headline, /undefined|null/);
  assert.equal(plan.goal, 'make room for yourself');
  assert.match(plan.firstDayLine, /^Day one of Sleep Restoration/);
  assert.doesNotMatch(plan.firstDayLine, /undefined|null|^,/);
  assert.match(plan.milestones.at(-1).outcome, /ready to make room for yourself/);
  assert.equal(plan.finishDate, 'Mar 23', 'includes the leap day');
});

test('target dates advance local calendar days across a daylight-saving change', () => {
  const previousTimezone = process.env.TZ;
  process.env.TZ = 'America/Toronto';
  try {
    const preset = onboardingPresetFor('sleep');
    const plan = personalizedPaywallPlan(preset, 'sleep', 'Alex', null, new Date(2026, 2, 7, 23, 30));
    assert.equal(plan.milestones[0].date, 'Mar 20');
    assert.equal(plan.finishDate, 'Apr 3');
  } finally {
    if (previousTimezone == null) delete process.env.TZ;
    else process.env.TZ = previousTimezone;
  }
});

test('heart-health personalization describes a practice instead of a physiological result', () => {
  const plan = personalizedPaywallPlan(
    onboardingPresetFor('heart_health'), 'heart_health', 'Alex', 'look after yourself', new Date(2026, 0, 1),
  );
  assert.match(plan.headline, /more confident making time to pause in 28 days/);
  const copy = `${plan.headline} ${plan.firstDayLine} ${plan.milestones.map(({ outcome }) => outcome).join(' ')}`;
  assert.doesNotMatch(copy, /heart rate|HRV|blood pressure|cortisol|cure|disease/i);
});

test('goals sharing Cool Head receive their own daily-life journey', () => {
  const journeys = new Map();
  for (const intent of ['stress_relief', 'calm_fast', 'emotional_balance', 'heart_health']) {
    const preset = onboardingPresetFor(intent);
    assert.equal(preset.id, 'pressure');
    const plan = personalizedPaywallPlan(preset, intent, 'Alex', 'make room for yourself', new Date(2026, 0, 1));
    journeys.set(intent, plan.milestones.map(({ outcome }) => outcome).join(' '));
    assert.equal(plan.planName, 'Stress Regulation');
    assert.deepEqual(plan.milestones.map(({ day, date }) => ({ day, date })), intent === 'emotional_balance' ? [
      { day: 21, date: 'Jan 21' }, { day: 42, date: 'Feb 11' }, { day: 56, date: 'Feb 25' },
    ] : [
      { day: 14, date: 'Jan 14' }, { day: 21, date: 'Jan 21' }, { day: 28, date: 'Jan 28' },
    ], intent);
  }
  assert.equal(new Set(journeys.values()).size, 4);
  assert.match(journeys.get('stress_relief'), /giant emergency.*boil over.*cool head/);
  assert.match(journeys.get('calm_fast'), /worry.*loop.*anxious thought.*next step/);
  assert.match(journeys.get('emotional_balance'), /big feeling.*Tense moments.*hard conversations/);
  assert.match(journeys.get('heart_health'), /Looking after yourself.*Recovery.*wellbeing/);
});

test('quiet and self-trust journeys distinguish the actual goals sharing each plan', () => {
  const journey = (intent) => personalizedPaywallPlan(
    onboardingPresetFor(intent), intent, null, null, new Date(2026, 0, 1),
  ).milestones.map(({ outcome }) => outcome).join(' ');
  assert.match(journey('self_care'), /belong only to you.*Time for yourself.*calm and roomy/);
  assert.match(journey('spiritual'), /meaning.*what matters.*values/);
  assert.match(journey('yoga'), /mat.*body needs.*calm from your mat/);
  assert.match(journey('daily_habit'), /motivation.*missed day.*proud/);
  assert.match(journey('self_acceptance'), /promise.*begin again.*trust yourself/);
  assert.notEqual(journey('daily_habit'), journey('self_acceptance'));
});

test('different selected goals change the personal journey without changing its schedule', () => {
  const preset = onboardingPresetFor('cleaning');
  const alex = personalizedPaywallPlan(preset, 'cleaning', 'Alex', 'declutter my closet', new Date(2026, 0, 1));
  const sam = personalizedPaywallPlan(preset, 'cleaning', 'Sam', 'stay on top of laundry', new Date(2026, 0, 1));
  assert.match(alex.firstDayLine, /^Alex, /);
  assert.match(sam.firstDayLine, /^Sam, /);
  assert.match(alex.milestones.at(-1).outcome, /ready to declutter my closet/);
  assert.match(sam.milestones.at(-1).outcome, /ready to stay on top of laundry/);
  assert.deepEqual(alex.milestones.map(({ day, date }) => ({ day, date })), sam.milestones.map(({ day, date }) => ({ day, date })));
  assert.deepEqual(alex.milestones.slice(0, -1), sam.milestones.slice(0, -1));
});

test('refined phone and recovery plans keep their context instead of using the broad goal plan', () => {
  const phone = onboardingPresetFor('sleep', { sleepCause: 'phone' });
  const sleep = personalizedPaywallPlan(phone, 'sleep', 'Alex', 'sleep better', new Date(2026, 0, 1));
  const focus = personalizedPaywallPlan(phone, 'focus', 'Alex', 'focus at work', new Date(2026, 0, 1));
  assert.match(sleep.milestones[0].outcome, /bedtime.*scroll/);
  assert.match(sleep.milestones[1].outcome, /phone down.*choosing rest/);
  assert.match(focus.milestones[0].outcome, /task you chose.*phone takes over/);
  assert.notEqual(sleep.milestones[1].outcome, focus.milestones[1].outcome);
  const recovery = personalizedPaywallPlan(
    onboardingPresetFor('energy', { followUpAnswers: { when_energy: ['constant'] } }),
    'energy', 'Alex', 'make space for my day', new Date(2026, 0, 1),
  );
  assert.equal(recovery.planName, 'Burnout Recovery');
  assert.match(recovery.milestones[0].outcome, /Low-energy days still count/);
  assert.match(recovery.milestones.at(-1).outcome, /bounce back.*energy to spare/);
});

test('every first-day description is short and never invents day-one activities', () => {
  for (const [planId, archetype] of Object.entries(ARCHETYPE_FOR_PLAN)) {
    const preset = enrolledOrGoalPreset(planId, 'other');
    const plan = personalizedPaywallPlan(preset, 'other', null, null, new Date(2026, 0, 1));
    assert.ok(plan.firstDayLine.startsWith(`Day one of ${archetype.planName}: `), planId);
    assert.ok(plan.firstDayLine.length <= 70, plan.firstDayLine);
    assert.doesNotMatch(plan.firstDayLine, /guided exercise|breathing session|lesson|check-in/i);
  }
});

test('every goal resolves to a real plan the paywall can name', () => {
  for (const intent of EVERY_INTENT) {
    const facts = paywallPlanFacts(onboardingPresetFor(intent), 5);
    assert.ok(facts.planName.length > 0, intent);
    assert.ok(facts.planDays > 0 && facts.planDays % 7 === 0, intent);
    assert.equal(facts.sessionMinutes, 5);
    assert.doesNotMatch(facts.planName, /breathwork|exercise/i);
  }
});

test('the plan leads every goal, then the goal lines, then the machinery', () => {
  const seen = new Set();
  for (const intent of EVERY_INTENT) {
    const facts = paywallPlanFacts(onboardingPresetFor(intent), 4);
    const highlights = paywallHighlights(intent, facts);

    assert.equal(highlights.length, 7, intent);
    for (const highlight of highlights) {
      assert.ok(highlight.icon.length > 0, intent);
      assert.ok(highlight.text.split(/\s+/).length <= 12, highlight.text);
      assert.doesNotMatch(highlight.text, /breathwork|exercise|heart rate|HRV/i, highlight.text);
    }

    // Same opening line for everybody: the whole plan, personal to them, named
    // as their plan, never by the protocol's own name.
    assert.match(highlights[0].text, new RegExp(String(facts.planDays)));
    assert.match(highlights[0].text, /personalized/);
    assert.doesNotMatch(highlights[0].text, new RegExp(facts.planName));
    assert.match(highlights[4].text, /Small steps every day/);
    assert.match(highlights[1].text, /professionals/);
    seen.add(highlights[2].text);
  }
  assert.equal(seen.size, EVERY_INTENT.length);
});

test('a refined plan keeps its own duration on the paywall', () => {
  const phonePlan = onboardingPresetFor('focus', {
    followUpAnswers: { when_focus: ['phone'] },
  });
  const facts = paywallPlanFacts(phonePlan, 3);

  assert.equal(facts.planDays, phonePlan.weeks * 7);
  assert.equal(facts.planDays, 28);
});

test('the reservation counts down from fifteen minutes and stops at zero', () => {
  const started = 1_000_000;
  assert.equal(planReservationRemaining(started, started), PLAN_RESERVATION_MS);
  assert.equal(
    planReservationRemaining(started, started + 60_000),
    14 * 60 * 1000,
  );
  assert.equal(planReservationRemaining(started, started + PLAN_RESERVATION_MS), 0);
  // A device that slept through the whole window comes back at zero, never
  // negative and never showing time it does not have.
  assert.equal(planReservationRemaining(started, started + 60 * 60 * 1000), 0);
});

test('the countdown reads as a clock', () => {
  assert.equal(formatCountdown(PLAN_RESERVATION_MS), '15:00');
  assert.equal(formatCountdown(14 * 60 * 1000 + 59_000), '14:59');
  assert.equal(formatCountdown(9_400), '0:10');
  assert.equal(formatCountdown(0), '0:00');
});
