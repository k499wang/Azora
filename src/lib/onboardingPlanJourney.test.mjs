import test from 'node:test';
import assert from 'node:assert/strict';
import { personalizedPlanJourney } from './onboardingPlanJourney.ts';
import { personalizedPaywallPlan } from './paywall/paywallLongForm.ts';
import { onboardingPresetFor, planPhasesForPlan } from './onboardingPreset.ts';

const INTENTS = [
  'stress_relief', 'calm_fast', 'sleep', 'focus', 'energy', 'self_acceptance',
  'emotional_balance', 'self_care', 'spiritual', 'yoga', 'heart_health',
  'cleaning', 'daily_habit', 'other',
];

function sentenceCount(line) {
  return (line.match(/[^.!?]+[.!?]+/g) ?? []).length;
}

// The day cards both surfaces render, including the goal sentence the last
// milestone carries.
function journeyLines(intent, preset) {
  const plan = personalizedPaywallPlan(preset, intent, 'Alex', 'declutter my closet', new Date(2026, 0, 1));
  return [plan.firstDayLine, ...plan.milestones.map(({ outcome }) => outcome)];
}

test('onboarding and paywall use identical personal descriptions for every goal and refined plan', () => {
  const cases = [
    ...INTENTS.map((intent) => ({ intent, preset: onboardingPresetFor(intent) })),
    { intent: 'sleep', preset: onboardingPresetFor('sleep', { sleepCause: 'phone' }) },
    { intent: 'focus', preset: onboardingPresetFor('focus', { followUpAnswers: { when_focus: ['phone'] } }) },
    { intent: 'energy', preset: onboardingPresetFor('energy', { followUpAnswers: { when_energy: ['constant'] } }) },
  ];
  for (const { intent, preset } of cases) {
    const journey = personalizedPlanJourney(preset, intent, '  Alex  ', '  make room for yourself  ');
    const paywall = personalizedPaywallPlan(preset, intent, '  Alex  ', '  make room for yourself  ', new Date(2026, 0, 1));
    assert.equal(journey.planName, paywall.planName, intent);
    assert.equal(journey.goal, paywall.goal, intent);
    assert.equal(journey.firstDayLine, paywall.firstDayLine, intent);
    assert.deepEqual(journey.milestones, paywall.milestones.map(({ date, ...milestone }) => milestone), intent);
    assert.deepEqual(journey.stops, paywall.stops.map(({ date, ...stop }) => stop), intent);
    assert.deepEqual(journey.stops.slice(1, 3).map(({ day }) => day), [3, 7], intent);
    assert.deepEqual(journey.milestones.map(({ day }) => day), planPhasesForPlan(preset.id).map(({ endWeek }) => endWeek * 7), intent);
    assert.equal('finishDate' in journey, false, 'the shared journey has no calendar assumption');
    assert.ok(journey.milestones.every((milestone) => !('date' in milestone)));
  }
});

test('the shared journey normalizes personal inputs and preserves concrete selected goals', () => {
  const preset = onboardingPresetFor('cleaning');
  const named = personalizedPlanJourney(preset, 'cleaning', '  Alex  ', '  declutter my closet  ');
  assert.equal(named.goal, 'declutter my closet');
  assert.match(named.firstDayLine, /^Alex, day one of Home Order/);
  assert.ok(named.firstDayLine.length <= 70, named.firstDayLine);
  assert.match(named.milestones.at(-1).outcome, /ready to declutter my closet/);

  for (const [name, goal] of [[null, null], [undefined, undefined], ['  ', '  ']]) {
    const fallback = personalizedPlanJourney(preset, 'cleaning', name, goal);
    assert.equal(fallback.goal, 'make room for yourself');
    assert.match(fallback.firstDayLine, /^Day one of Home Order/);
    assert.doesNotMatch(fallback.firstDayLine, /undefined|null|^,/);
    assert.match(fallback.milestones.at(-1).outcome, /ready to make room for yourself/);
  }
});

test('sharing descriptions leaves the paywall calendar targets unchanged', () => {
  const preset = onboardingPresetFor('sleep', { sleepCause: 'phone' });
  const journey = personalizedPlanJourney(preset, 'sleep', 'Alex', 'sleep better');
  const paywall = personalizedPaywallPlan(preset, 'sleep', 'Alex', 'sleep better', new Date(2026, 11, 18, 12));
  assert.deepEqual(paywall.milestones.map(({ day, date }) => ({ day, date })), [
    { day: 14, date: 'Dec 31' }, { day: 21, date: 'Jan 7' }, { day: 28, date: 'Jan 14' },
  ]);
  assert.equal(paywall.finishDate, 'Jan 14');
  assert.match(journey.milestones[0].outcome, /bedtime.*scroll/);
  assert.match(journey.milestones[1].outcome, /phone down.*choosing rest/);
});

test('every day on the journey is one sentence', () => {
  const cases = [
    ...INTENTS.map((intent) => ({ intent, preset: onboardingPresetFor(intent) })),
    { intent: 'sleep', preset: onboardingPresetFor('sleep', { sleepCause: 'phone' }) },
    { intent: 'focus', preset: onboardingPresetFor('focus', { followUpAnswers: { when_focus: ['phone'] } }) },
    { intent: 'energy', preset: onboardingPresetFor('energy', { followUpAnswers: { when_energy: ['constant'] } }) },
  ];
  for (const { intent, preset } of cases) {
    for (const line of journeyLines(intent, preset)) {
      const sentences = sentenceCount(line);
      assert.ok(sentences > 0, `${intent}: ${line}`);
      assert.equal(sentences, 1, `${intent}, ${sentences} sentences: ${line}`);
    }
  }
});
