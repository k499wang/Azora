import { buildProgramEnrollment } from '../../program/domain/programEnrollment.ts';
import { FIRST_TRIAL_WEEK_REVISION } from './lessonCatalogue.ts';
import { latestProgramPreset } from '../../program/domain/programCatalogue.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pressureLessonTrackForIntent, pressureLessonTrackForEnrollment } from './pressureLessonTrack.ts';
import { ONBOARDING_INTENT_LOOKUP_OPTIONS } from '../../../components/onboarding/data/intentOptions.ts';
import { buildIntentTitleLookup, resolvePlanIntent } from '../../../lib/planProgress.ts';
import { onboardingPresetFor } from '../../../lib/onboardingPreset.ts';

test('each visible pressure goal chooses the lessons its wording describes', () => {
  const lookup = buildIntentTitleLookup(ONBOARDING_INTENT_LOOKUP_OPTIONS);
  for (const [intent, track] of [
    ['stress_relief', 'stress'],
    ['calm_fast', 'overthinking'],
    ['emotional_balance', 'anger'],
  ]) {
    const title = ONBOARDING_INTENT_LOOKUP_OPTIONS.find((option) => option.id === intent)?.title;
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
  const option = ONBOARDING_INTENT_LOOKUP_OPTIONS.find((candidate) => candidate.id === 'emotional_balance');
  assert.equal(option.title, 'Being patient with people');
  assert.ok(option.legacyTitles.includes('Staying calm with people'));
  assert.ok(option.legacyTitles.includes('Keeping my cool with people'));
  assert.ok(option.legacyTitles.includes('I snap at people too easily'));
  assert.ok(option.legacyTitles.includes('I can’t keep up with myself'));
  const lookup = buildIntentTitleLookup(ONBOARDING_INTENT_LOOKUP_OPTIONS);
  assert.equal(resolvePlanIntent('I can’t keep up with myself', lookup), 'emotional_balance');
});


test('running pressure guidance follows its frozen lesson snapshot rather than a changed goal', () => {
  for (const pressureLessonTrack of ['stress', 'overthinking', 'anger']) {
    for (const presetRevision of [FIRST_TRIAL_WEEK_REVISION.pressure - 1, latestProgramPreset('pressure', pressureLessonTrack).revision]) {
      const { enrollment } = buildProgramEnrollment({ enrollmentId: 'saved', planId: 'pressure',
        presetRevision, pressureLessonTrack, enrolledOn: '2026-10-16' });
      const snapshot = JSON.parse(JSON.stringify(enrollment));
      assert.equal(pressureLessonTrackForEnrollment(snapshot), pressureLessonTrack);
      // Selecting a different intent for a future enrollment does not change this one.
      pressureLessonTrackForIntent(pressureLessonTrack === 'anger' ? 'calm_fast' : 'emotional_balance');
      assert.equal(pressureLessonTrackForEnrollment(snapshot), pressureLessonTrack);
    }
  }
});

test('missing or unrecognised pressure snapshots keep the broad historical guidance', () => {
  assert.equal(pressureLessonTrackForEnrollment(null), undefined);
  assert.equal(pressureLessonTrackForEnrollment({ planId: 'night', resolved: { days: [] } }), undefined);
  assert.equal(pressureLessonTrackForEnrollment({ planId: 'pressure', resolved: { days: [] } }), undefined);
  assert.equal(pressureLessonTrackForEnrollment({ planId: 'pressure', resolved: { days: [{ lessonActivityId: 'lesson:unknown' }] } }), undefined);
});
