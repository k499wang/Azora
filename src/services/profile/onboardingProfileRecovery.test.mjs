import test from 'node:test';
import assert from 'node:assert/strict';
import { hasRecoverableOnboardingProfile } from './onboardingProfileRecovery.ts';

test('a completed flow is recoverable', () => {
  assert.equal(hasRecoverableOnboardingProfile({ onboarding_goal: 'Stress relief' }), true);
});

test('a skipped gender step stays recoverable', () => {
  // The row a user writes when they skip gender: goal is set, gender is not.
  // Requiring gender here sent them back to step one on the next cold launch.
  assert.equal(
    hasRecoverableOnboardingProfile({
      onboarding_goal: 'Stress relief',
      age: 25,
      gender: null,
      daily_minutes: 5,
    }),
    true,
  );
});

test('a freshly bootstrapped row is not recoverable', () => {
  assert.equal(hasRecoverableOnboardingProfile({ onboarding_goal: null }), false);
});

test('an empty goal is not recoverable', () => {
  assert.equal(hasRecoverableOnboardingProfile({ onboarding_goal: '' }), false);
});
