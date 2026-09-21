import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildIntentTitleLookup,
  resolvePlanIntent,
  resolvePlanIntents,
} from './planProgress.ts';
import {
  INTENT_OPTIONS,
  ONBOARDING_INTENT_LOOKUP_OPTIONS,
} from '../components/onboarding/data/intentOptions.ts';

const lookup = buildIntentTitleLookup(ONBOARDING_INTENT_LOOKUP_OPTIONS);

test('new users see only the seven focused onboarding intents', () => {
  assert.deepEqual(
    INTENT_OPTIONS.map((option) => option.id),
    [
      'focus',
      'stress_relief',
      'calm_fast',
      'emotional_balance',
      'sleep',
      'energy',
      'heart_health',
    ],
  );
});

/**
 * The stored goal is titles, not ids, so a copy edit to an option's title is
 * what would quietly strand every user written by an older build on the
 * fallback plan. This fails loudly at that moment instead.
 */
test('every onboarding option title still resolves to its own goal', () => {
  for (const option of INTENT_OPTIONS) {
    assert.equal(
      resolvePlanIntent(option.title, lookup),
      option.id,
      `"${option.title}" no longer maps to ${option.id}`,
    );
  }
});

test('the goal that was ranked first is the one the plan follows', () => {
  assert.equal(resolvePlanIntent('Sleep better, Reduce stress', lookup), 'sleep');
  assert.equal(resolvePlanIntent('Reduce stress, Sleep better', lookup), 'stress_relief');
});

test('a goal from a build with different words still gets a plan', () => {
  for (const stored of [null, undefined, '', 'Something we never shipped']) {
    assert.equal(resolvePlanIntent(stored, lookup), 'other');
  }
});

test('an unrecognised leading goal falls through to one we know', () => {
  assert.equal(resolvePlanIntent('Retired wording, Sleep better', lookup), 'sleep');
});

test('titles match whatever case and spacing they were stored in', () => {
  assert.equal(resolvePlanIntent('  sleep BETTER  ', lookup), 'sleep');
});










/**
 * A resumed profile rejoins onboarding at the paywall, so the goal questions
 * are never asked again. The saved goal string is the only record of what they
 * picked, and both the plan they get enrolled on and the name Home prints are
 * read back out of it — so they have to come back as the same thing.
 */
test('a saved goal resolves back to every goal it was written from', () => {
  assert.deepEqual(resolvePlanIntents('Sleep better, Reduce stress', lookup), [
    'sleep',
    'stress_relief',
  ]);
  assert.deepEqual(resolvePlanIntents('Sleep better', lookup), ['sleep']);
});

test('a resumed profile with no saved goal names no goals rather than guessing', () => {
  for (const stored of [null, undefined, '', 'Words we never shipped']) {
    assert.deepEqual(resolvePlanIntents(stored, lookup), []);
  }
});

test('the leading saved goal is the plan, so resuming cannot change it', () => {
  const goal = 'Sleep better, Reduce stress';

  // What the flow seeds its state with, and what Home reads, agree.
  assert.equal(resolvePlanIntents(goal, lookup)[0], resolvePlanIntent(goal, lookup));
});

test('a goal repeated in the stored string is named once', () => {
  assert.deepEqual(resolvePlanIntents('Sleep better, Sleep better', lookup), [
    'sleep',
  ]);
});
