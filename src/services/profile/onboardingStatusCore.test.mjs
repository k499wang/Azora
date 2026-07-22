import test from 'node:test';
import assert from 'node:assert/strict';
import { hasRecoverableOnboardingProfile } from './onboardingStatusCore.ts';

const emptyProfile = {
  onboarding_profile_saved_at: null,
  onboarding_goal: null,
  age: null,
  gender: null,
  daily_minutes: null,
};

test('marker-backed all-null onboarding profile is recoverable', () => {
  assert.equal(
    hasRecoverableOnboardingProfile({
      ...emptyProfile,
      onboarding_profile_saved_at: '2026-07-21T12:00:00.000Z',
    }),
    true,
  );
});

test('marker remains authoritative when the legacy goal is blank', () => {
  assert.equal(
    hasRecoverableOnboardingProfile({
      ...emptyProfile,
      onboarding_profile_saved_at: '2026-07-21T12:00:00.000Z',
      onboarding_goal: '   ',
    }),
    true,
  );
});

test('blank bootstrap profile is not recoverable', () => {
  assert.equal(hasRecoverableOnboardingProfile(emptyProfile), false);
});

test('whitespace-only legacy goal is not recoverable', () => {
  assert.equal(
    hasRecoverableOnboardingProfile({
      ...emptyProfile,
      onboarding_goal: '   ',
    }),
    false,
  );
});

test('legacy sparse saved profile is recoverable from its goal alone', () => {
  assert.equal(
    hasRecoverableOnboardingProfile({
      ...emptyProfile,
      onboarding_goal: 'Reduce stress',
    }),
    true,
  );
});

test('legacy fully populated profile remains recoverable without marker', () => {
  assert.equal(
    hasRecoverableOnboardingProfile({
      ...emptyProfile,
      onboarding_goal: 'Reduce stress',
      age: 30,
      gender: 'prefer_not',
      daily_minutes: 5,
    }),
    true,
  );
});

test('legacy profile fields without a goal do not make a bootstrap row recoverable', () => {
  assert.equal(
    hasRecoverableOnboardingProfile({
      ...emptyProfile,
      age: 30,
      gender: 'prefer_not',
      daily_minutes: 5,
    }),
    false,
  );
});
