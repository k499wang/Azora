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
