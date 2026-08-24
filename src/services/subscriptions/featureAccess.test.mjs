import test from 'node:test';
import assert from 'node:assert/strict';
import { FeatureKey, getFeatureAccess } from './featureAccessCore.ts';

test('breathing heart-rate monitoring is Pro-only for free users', () => {
  assert.deepEqual(
    getFeatureAccess({
      feature: FeatureKey.BreathingHeartRateMonitoring,
      isPro: false,
    }),
    {
      allowed: false,
      isPro: false,
      reason: 'pro_only',
      used: 0,
      limit: null,
    },
  );
});

test('breathing heart-rate monitoring is allowed for Pro users', () => {
  assert.deepEqual(
    getFeatureAccess({
      feature: FeatureKey.BreathingHeartRateMonitoring,
      isPro: true,
    }),
    {
      allowed: true,
      isPro: true,
      reason: 'pro',
      used: 0,
      limit: null,
    },
  );
});

test('daily free limits still apply to standalone heart-rate measurement', () => {
  assert.equal(
    getFeatureAccess({
      feature: FeatureKey.HeartRateMeasurement,
      isPro: false,
      usage: {
        localDate: '2026-06-27',
        breathHoldCount: 0,
        breathingSessionCount: 0,
        heartRateCaptureCount: 0,
      },
    }).allowed,
    true,
  );

  assert.equal(
    getFeatureAccess({
      feature: FeatureKey.HeartRateMeasurement,
      isPro: false,
      usage: {
        localDate: '2026-06-27',
        breathHoldCount: 0,
        breathingSessionCount: 0,
        heartRateCaptureCount: 1,
      },
    }).reason,
    'free_limit_reached',
  );
});

function dailyUsage({ breathHolds = 0, breathingSessions = 0 } = {}) {
  return {
    localDate: '2026-08-23',
    breathHoldCount: breathHolds,
    breathingSessionCount: breathingSessions,
    heartRateCaptureCount: 0,
  };
}

test('free users can complete three daily exercises', () => {
  for (const used of [0, 1, 2]) {
    const access = getFeatureAccess({
      feature: FeatureKey.DailyExercise,
      isPro: false,
      usage: dailyUsage({ breathingSessions: used }),
    });

    assert.equal(access.allowed, true);
    assert.equal(access.reason, 'within_free_limit');
    assert.equal(access.used, used);
    assert.equal(access.limit, 3);
  }
});

test('the fourth daily exercise is blocked for free users', () => {
  assert.deepEqual(
    getFeatureAccess({
      feature: FeatureKey.DailyExercise,
      isPro: false,
      usage: dailyUsage({ breathingSessions: 3 }),
    }),
    {
      allowed: false,
      isPro: false,
      reason: 'free_limit_reached',
      used: 3,
      limit: 3,
    },
  );
});

test('daily exercise usage combines breath holds and breathing sessions', () => {
  const access = getFeatureAccess({
    feature: FeatureKey.DailyExercise,
    isPro: false,
    usage: dailyUsage({ breathHolds: 1, breathingSessions: 2 }),
  });

  assert.equal(access.allowed, false);
  assert.equal(access.used, 3);
});

test('Pro users have unlimited daily exercises', () => {
  assert.deepEqual(
    getFeatureAccess({
      feature: FeatureKey.DailyExercise,
      isPro: true,
      usage: dailyUsage({ breathHolds: 4, breathingSessions: 7 }),
    }),
    {
      allowed: true,
      isPro: true,
      reason: 'pro',
      used: 0,
      limit: null,
    },
  );
});

test('session history is available to free users', () => {
  assert.deepEqual(
    getFeatureAccess({
      feature: FeatureKey.SessionHistory,
      isPro: false,
    }),
    {
      allowed: true,
      isPro: false,
      reason: 'within_free_limit',
      used: 0,
      limit: null,
    },
  );
});
