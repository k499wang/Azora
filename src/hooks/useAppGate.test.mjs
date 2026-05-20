import test from 'node:test';
import assert from 'node:assert/strict';
import { computeAppGate } from './appGateCore.ts';

const noop = async () => {};

function createBaseQueries(overrides = {}) {
  return {
    onboardingStatusQuery: {
      isPending: false,
      isError: false,
      data: undefined,
      ...overrides.onboardingStatusQuery,
    },
    savedOnboardingProfileQuery: {
      isPending: false,
      isError: false,
      data: null,
      ...overrides.savedOnboardingProfileQuery,
    },
    entitlementQuery: {
      isPending: false,
      data: undefined,
      ...overrides.entitlementQuery,
    },
  };
}

test('returns booting when authStatus is booting', () => {
  const { onboardingStatusQuery, savedOnboardingProfileQuery, entitlementQuery } =
    createBaseQueries();

  const result = computeAppGate(
    'booting',
    { id: 'user-1' },
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    false,
    null,
    noop,
    noop,
    false,
  );

  assert.equal(result.status, 'booting');
});

test('returns signed_out when authStatus is signed_out', () => {
  const { onboardingStatusQuery, savedOnboardingProfileQuery, entitlementQuery } =
    createBaseQueries();

  const result = computeAppGate(
    'signed_out',
    { id: 'user-1' },
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    false,
    null,
    noop,
    noop,
    false,
  );

  assert.equal(result.status, 'signed_out');
});

test('returns signed_out when user is null', () => {
  const { onboardingStatusQuery, savedOnboardingProfileQuery, entitlementQuery } =
    createBaseQueries();

  const result = computeAppGate(
    'signed_in',
    null,
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    false,
    null,
    noop,
    noop,
    false,
  );

  assert.equal(result.status, 'signed_out');
});

test('returns booting when onboardingStatusQuery is pending', () => {
  const { onboardingStatusQuery, savedOnboardingProfileQuery, entitlementQuery } =
    createBaseQueries({
      onboardingStatusQuery: { isPending: true, isError: false, data: undefined },
    });

  const result = computeAppGate(
    'signed_in',
    { id: 'user-1' },
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    false,
    null,
    noop,
    noop,
    false,
  );

  assert.equal(result.status, 'booting');
});

test('returns signed_out when onboardingStatusQuery is error', () => {
  const { onboardingStatusQuery, savedOnboardingProfileQuery, entitlementQuery } =
    createBaseQueries({
      onboardingStatusQuery: { isPending: false, isError: true, data: undefined },
    });

  const result = computeAppGate(
    'signed_in',
    { id: 'user-1' },
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    false,
    null,
    noop,
    noop,
    false,
  );

  assert.equal(result.status, 'signed_out');
});

test('returns signed_out when savedOnboardingProfileQuery is error', () => {
  const { onboardingStatusQuery, savedOnboardingProfileQuery, entitlementQuery } =
    createBaseQueries({
      onboardingStatusQuery: { isPending: false, isError: false, data: false },
      savedOnboardingProfileQuery: { isPending: false, isError: true, data: null },
    });

  const result = computeAppGate(
    'signed_in',
    { id: 'user-1' },
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    false,
    null,
    noop,
    noop,
    false,
  );

  assert.equal(result.status, 'signed_out');
});

test('returns booting when savedOnboardingProfileQuery is pending', () => {
  const { onboardingStatusQuery, savedOnboardingProfileQuery, entitlementQuery } =
    createBaseQueries({
      onboardingStatusQuery: { isPending: false, isError: false, data: false },
      savedOnboardingProfileQuery: { isPending: true, isError: false, data: null },
    });

  const result = computeAppGate(
    'signed_in',
    { id: 'user-1' },
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    false,
    null,
    noop,
    noop,
    false,
  );

  assert.equal(result.status, 'booting');
});

test('returns needs_onboarding when onboarding is incomplete and no saved profile', () => {
  const { onboardingStatusQuery, savedOnboardingProfileQuery, entitlementQuery } =
    createBaseQueries({
      onboardingStatusQuery: { isPending: false, isError: false, data: false },
    });

  const result = computeAppGate(
    'signed_in',
    { id: 'user-1' },
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    false,
    null,
    noop,
    noop,
    false,
  );

  assert.equal(result.status, 'needs_onboarding');
  assert.equal(result.savedOnboardingProfile, null);
});

test('returns ready when onboarding is completed', () => {
  const { onboardingStatusQuery, savedOnboardingProfileQuery, entitlementQuery } =
    createBaseQueries({
      onboardingStatusQuery: { isPending: false, isError: false, data: true },
    });

  const result = computeAppGate(
    'signed_in',
    { id: 'user-1' },
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    false,
    null,
    noop,
    noop,
    false,
  );

  assert.equal(result.status, 'ready');
});

test('returns booting when pro user has saved profile and entitlement is pending', () => {
  const { onboardingStatusQuery, savedOnboardingProfileQuery, entitlementQuery } =
    createBaseQueries({
      onboardingStatusQuery: { isPending: false, isError: false, data: false },
      savedOnboardingProfileQuery: {
        isPending: false,
        isError: false,
        data: { onboardingGoal: 'stress', age: 30, gender: 'male', dailyMinutes: 10 },
      },
      entitlementQuery: { isPending: true, data: undefined },
    });

  const result = computeAppGate(
    'signed_in',
    { id: 'user-1' },
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    false,
    null,
    noop,
    noop,
    false,
  );

  assert.equal(result.status, 'booting');
});

test('returns booting when pro user has saved profile and auto-complete is in progress', () => {
  const { onboardingStatusQuery, savedOnboardingProfileQuery, entitlementQuery } =
    createBaseQueries({
      onboardingStatusQuery: { isPending: false, isError: false, data: false },
      savedOnboardingProfileQuery: {
        isPending: false,
        isError: false,
        data: { onboardingGoal: 'stress', age: 30, gender: 'male', dailyMinutes: 10 },
      },
      entitlementQuery: { isPending: false, data: { isPro: true } },
    });

  const result = computeAppGate(
    'signed_in',
    { id: 'user-1' },
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    true,
    null,
    noop,
    noop,
    false,
  );

  assert.equal(result.status, 'booting');
});

test('returns needs_onboarding when auto-complete previously failed for this user', () => {
  const savedProfile = { onboardingGoal: 'stress', age: 30, gender: 'male', dailyMinutes: 10 };
  const { onboardingStatusQuery, savedOnboardingProfileQuery, entitlementQuery } =
    createBaseQueries({
      onboardingStatusQuery: { isPending: false, isError: false, data: false },
      savedOnboardingProfileQuery: {
        isPending: false,
        isError: false,
        data: savedProfile,
      },
      entitlementQuery: { isPending: false, data: { isPro: true } },
    });

  const result = computeAppGate(
    'signed_in',
    { id: 'user-1' },
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    false,
    'user-1',
    noop,
    noop,
    false,
  );

  assert.equal(result.status, 'needs_onboarding');
  assert.deepEqual(result.savedOnboardingProfile, savedProfile);
});
