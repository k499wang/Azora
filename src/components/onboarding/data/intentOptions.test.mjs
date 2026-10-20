import assert from 'node:assert/strict';
import test from 'node:test';
import { INTENT_OPTIONS, PERSONALIZED_INTENT_OPTIONS } from './intentOptions.ts';
import { intentFollowUpsFor, stakesBenefitFor } from './intentFollowUps.ts';
import { onboardingPresetFor } from '../../../lib/onboardingPreset.ts';
import { techniqueForIntent } from '../../../features/exercise/guidedBreathing/techniqueSelection.ts';
import { onboardingStepOrder } from '../onboardingStepOrder.ts';
import { buildIntentTitleLookup, resolvePlanIntent } from '../../../lib/planProgress.ts';

test('onboarding offers the nine approved goals in their chosen order', () => {
  assert.deepEqual(INTENT_OPTIONS.map(({ id, title }) => [id, title]), [
    ['cleaning', 'Keeping my home tidy'],
    ['scrolling', 'Control my doomscrolling'],
    ['burnout', 'Feeling less burned out'],
    ['procrastination', 'Stop my procrastination'],
    ['calm_fast', 'Overthinking less'],
    ['stress_relief', 'Calm my stress & anxiety'],
    ['sleep', 'Sleeping better'],
    ['focus', 'Staying focused'],
    ['daily_habit', 'Sticking to a routine'],
  ]);
});

test('saved goals still resolve after the intent labels change', () => {
  const lookup = buildIntentTitleLookup(PERSONALIZED_INTENT_OPTIONS);
  for (const [intent, oldTitle] of [
    ['cleaning', 'Keeping my home tidy'],
    ['scrolling', 'Spending less time scrolling'],
    ['burnout', 'Feeling less burned out'],
    ['procrastination', 'Putting things off less'],
    ['calm_fast', 'Overthinking less'],
    ['stress_relief', 'Feeling less stressed'],
    ['sleep', 'Sleeping better'],
    ['focus', 'Staying focused'],
    ['daily_habit', 'Sticking to a routine'],
  ]) {
    assert.equal(resolvePlanIntent(oldTitle, lookup), intent);
    const currentTitle = INTENT_OPTIONS.find(({ id }) => id === intent).title;
    assert.equal(resolvePlanIntent(currentTitle, lookup), intent);
  }
});

test('scrolling, burnout, procrastination and routine select independent defaults without extra answers', () => {
  for (const [intent, plan, technique] of [
    ['scrolling', 'phone', 'relaxing'],
    ['burnout', 'recovery', 'relaxing'],
    ['procrastination', 'focus', 'box'],
    ['daily_habit', 'selfTrust', 'box'],
    ['energy', 'morning', 'box'],
  ]) {
    assert.equal(onboardingPresetFor(intent).id, plan, intent);
    assert.equal(techniqueForIntent(intent), technique, intent);
  }
  assert.equal(onboardingPresetFor('energy', { followUpAnswers: { when_energy: ['constant'] } }).id, 'recovery');
});

test('new goals have complete targeted follow-ups that appear in the flow and feed the benefit copy', () => {
  const questionIds = new Set();
  for (const intent of ['scrolling', 'burnout', 'procrastination']) {
    const metadata = PERSONALIZED_INTENT_OPTIONS.find(({ id }) => id === intent);
    for (const field of ['body', 'hook', 'goalPhrase', 'assessmentPlan', 'reflectionHeadline', 'reflectionBody']) {
      assert.ok(metadata[field]?.length > 0, `${intent}: ${field}`);
    }
    assert.equal(metadata.valuePoints.length, 3);
    const questions = intentFollowUpsFor(intent);
    assert.equal(questions.length, 3);
    assert.equal(questions[1].multiSelect, true);
    const followUpAnswers = {};
    for (const question of questions) {
      assert.equal(questionIds.has(question.id), false, question.id);
      questionIds.add(question.id);
      assert.ok(question.options.length >= 4, question.id);
      assert.equal(new Set(question.options.map(({ id }) => id)).size, question.options.length);
      assert.ok(question.options.every(({ title, echo }) => title && echo));
      followUpAnswers[question.id] = [question.options[0].id];
    }
    const steps = onboardingStepOrder(intent, 1, questions.length);
    assert.ok(['intentDepth1', 'intentDepth2', 'intentDepth3'].every((step) => steps.includes(step)));
    assert.ok(stakesBenefitFor(intent, followUpAnswers)?.startsWith('Built to give you back '));
  }
});
