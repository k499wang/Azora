import test from 'node:test';
import assert from 'node:assert/strict';
import { onboardingPlanBenefits } from './onboardingPlanBenefits.ts';
import { enrolledOrGoalPreset, onboardingPresetFor } from './onboardingPreset.ts';
import { latestProgramPreset, PROGRAM_ACTIVITIES } from '../features/program/domain/programCatalogue.ts';

const PLAN_IDS = ['night', 'morning', 'pressure', 'focus', 'quiet', 'home', 'phone', 'recovery', 'selfTrust'];

test('benefits follow the resolved plan, including direct-answer refinements', () => {
  const original = onboardingPlanBenefits(onboardingPresetFor('focus'), 'focus', 'focus on what matters');
  const refined = onboardingPlanBenefits(
    onboardingPresetFor('focus', { followUpAnswers: { when_focus: ['phone'] } }),
    'focus',
    'focus on what matters',
  );
  assert.equal(original.days, 42);
  assert.equal(refined.days, 28);
  assert.match(refined.outcome, /attention/);
  assert.match(refined.approach, /scroll/);
  assert.equal(refined.goal, original.goal);

  const recovery = onboardingPlanBenefits(
    onboardingPresetFor('energy', { followUpAnswers: { when_energy: ['constant'] } }),
    'energy',
    'have energy for yourself',
  );
  assert.match(recovery.approach, /low-energy/);
});

test('every plan names the first scheduled guided reset and its actual delivery duration', () => {
  for (const planId of PLAN_IDS) {
    const preset = enrolledOrGoalPreset(planId, 'other');
    const benefits = onboardingPlanBenefits(preset, 'other', 'feel more like yourself');
    const plan = latestProgramPreset(planId);
    const firstDay = plan.days.find(({ activityIds }) => activityIds.length > 0);
    const firstActivity = PROGRAM_ACTIVITIES.get(firstDay.activityIds[0]);
    assert.equal(benefits.days, plan.days.length, planId);
    assert.equal(benefits.firstReset.day, firstDay.day, planId);
    assert.equal(benefits.firstReset.minutes, firstActivity.delivery.minutes, planId);
    assert.ok(benefits.firstReset.title.length > 0, planId);
    assert.notEqual(benefits.firstReset.day, 1, `${planId}: do not imply a reset on the lesson-only first day`);
  }
});

test('heart-health copy describes confidence in a practice without physiological promises', () => {
  const benefits = onboardingPlanBenefits(onboardingPresetFor('heart_health'), 'heart_health', 'look after yourself');
  assert.equal(benefits.outcome, 'more confident making time to pause');
  assert.doesNotMatch(`${benefits.outcome} ${benefits.approach}`, /heart rate|HRV|blood pressure|cortisol|cure|disease/i);
});

test('personalization preserves the supplied goal and only echoes an answer when present', () => {
  const preset = onboardingPresetFor('cleaning');
  const benefits = onboardingPlanBenefits(preset, 'cleaning', '  declutter my closet  ', '  making lists  ');
  assert.equal(benefits.goal, 'declutter my closet');
  assert.equal(benefits.triedNote, 'You’ve tried making lists. This time, we start small.');
  assert.equal(onboardingPlanBenefits(preset, 'cleaning', 'my home', ' ').triedNote, null);
  assert.equal(onboardingPlanBenefits(preset, 'cleaning', ' ').goal, 'make room for yourself');
});
