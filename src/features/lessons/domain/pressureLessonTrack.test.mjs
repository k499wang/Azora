import test from 'node:test';
import assert from 'node:assert/strict';
import { pressureLessonTrackForIntent } from './pressureLessonTrack.ts';
import { INTENT_OPTIONS, ONBOARDING_INTENT_LOOKUP_OPTIONS } from '../../../components/onboarding/data/intentOptions.ts';
import { buildIntentTitleLookup, resolvePlanIntent } from '../../../lib/planProgress.ts';
import { onboardingPresetFor } from '../../../lib/onboardingPreset.ts';

test('each visible pressure goal chooses the lessons its wording describes', () => {
  const lookup = buildIntentTitleLookup(ONBOARDING_INTENT_LOOKUP_OPTIONS);
  for (const [intent, track] of [
    ['stress_relief', 'stress'],
    ['calm_fast', 'overthinking'],
    ['emotional_balance', 'anger'],
  ]) {
    const title = INTENT_OPTIONS.find((option) => option.id === intent)?.title;
    assert.ok(title, intent);
    assert.equal(onboardingPresetFor(intent).id, 'pressure');
    assert.equal(pressureLessonTrackForIntent(resolvePlanIntent(title, lookup)), track);
  }
});

test('unspecified and legacy broad goals default to stress lessons', () => {
  for (const intent of [undefined, null, 'other', 'heart_health', 'focus']) {
    assert.equal(pressureLessonTrackForIntent(intent), 'stress');
  }
});

test('the clearer irritation choice preserves the previous saved goal title', () => {
  const option = INTENT_OPTIONS.find((candidate) => candidate.id === 'emotional_balance');
  assert.equal(option.title, 'I snap at people too easily');
  assert.ok(option.legacyTitles.includes('I can’t keep up with myself'));
  const lookup = buildIntentTitleLookup(ONBOARDING_INTENT_LOOKUP_OPTIONS);
  assert.equal(resolvePlanIntent('I can’t keep up with myself', lookup), 'emotional_balance');
});
