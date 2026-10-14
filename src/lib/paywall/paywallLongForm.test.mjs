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
  assert.equal(plan.planName, 'Phone Detox');
  assert.equal(plan.goal, 'spend less time scrolling');
  assert.equal('approach' in plan, false);
  assert.equal(plan.finishDate, 'Jan 14');
  assert.deepEqual(plan.milestones.map(({ day, date }) => ({ day, date })), [
    { day: 14, date: 'Dec 31' },
    { day: 21, date: 'Jan 7' },
    { day: 28, date: 'Jan 14' },
  ]);
  assert.match(plan.milestones[1].outcome, /urge and the unlock/);
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

test('every plan keeps its authored phase ends and names a concrete practice at each target', () => {
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
    for (const milestone of plan.milestones) {
      assert.match(milestone.outcome, /practice|practis|reset|pause|routine|wind-down|begin|promise|quiet/i);
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
  assert.match(plan.headline, /more confident making time to pause in 56 days/);
  const copy = `${plan.headline} ${plan.milestones.map(({ outcome }) => outcome).join(' ')}`;
  assert.doesNotMatch(copy, /heart rate|HRV|blood pressure|cortisol|cure|disease/i);
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
