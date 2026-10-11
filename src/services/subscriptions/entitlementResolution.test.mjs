import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRO_ENTITLEMENT,
  mapRevenueCatProEntitlement,
  resolveUserEntitlement,
} from './entitlementResolution.ts';

function customerInfo(overrides = {}) {
  return {
    entitlements: {
      active: {
        [PRO_ENTITLEMENT]: {
          isActive: true,
          productIdentifier: 'azora.pro.annual',
          store: 'APP_STORE',
          expirationDate: '2027-01-01T00:00:00Z',
          willRenew: true,
          periodType: 'NORMAL',
          ...overrides,
        },
      },
    },
  };
}

test('SDK active Pro unlocks a missing or stale free backend mirror', () => {
  const revenueCatRow = mapRevenueCatProEntitlement(customerInfo());
  assert.equal(resolveUserEntitlement(null, revenueCatRow).isPro, true);
  const result = resolveUserEntitlement({ isPro: false, status: 'expired' }, revenueCatRow);
  assert.equal(result.isPro, true);
  assert.equal(result.status, 'active');
  assert.equal(result.productId, 'azora.pro.annual');
});

test('SDK active state remains authoritative with a past local expiration date', () => {
  const result = mapRevenueCatProEntitlement(customerInfo({ expirationDate: '2000-01-01T00:00:00Z' }));
  assert.equal(result.isPro, true);
  assert.equal(result.currentPeriodEndsAt, '2000-01-01T00:00:00Z');
});

test('inactive or absent Pro is never mapped as Pro', () => {
  assert.equal(mapRevenueCatProEntitlement(customerInfo({ isActive: false })), null);
  assert.equal(mapRevenueCatProEntitlement({ entitlements: { active: {} } }), null);
});

test('an active lifetime entitlement with no expiration date remains Pro', () => {
  const result = mapRevenueCatProEntitlement(customerInfo({ expirationDate: null, willRenew: false }));
  assert.equal(result.isPro, true);
  assert.equal(result.currentPeriodEndsAt, null);
  assert.equal(result.willRenew, false);
});

test('RevenueCat enriches trial data and preserves backend experiment attribution', () => {
  const revenueCatRow = mapRevenueCatProEntitlement(customerInfo({ periodType: 'TRIAL' }));
  const result = resolveUserEntitlement({
    isPro: true,
    trialEndsAt: null,
    initialOfferingId: 'launch',
    experimentId: 'experiment-1',
    experimentVariant: 'variant-a',
  }, revenueCatRow);
  assert.equal(result.trialEndsAt, '2027-01-01T00:00:00Z');
  assert.equal(result.initialOfferingId, 'launch');
  assert.equal(result.experimentId, 'experiment-1');
  assert.equal(result.experimentVariant, 'variant-a');
});

test('fresh RevenueCat paid period clears stale backend trial and product', () => {
  const result = resolveUserEntitlement({
    isPro: true,
    productId: 'azora.pro.weekly',
    currentPeriodEndsAt: '2026-01-01T00:00:00Z',
    trialEndsAt: '2026-01-01T00:00:00Z',
    willRenew: false,
  }, mapRevenueCatProEntitlement(customerInfo()));
  assert.equal(result.productId, 'azora.pro.annual');
  assert.equal(result.currentPeriodEndsAt, '2027-01-01T00:00:00Z');
  assert.equal(result.trialEndsAt, null);
  assert.equal(result.willRenew, true);
});

test('backend confirmed Pro remains available when RevenueCat is unavailable', () => {
  const backendRow = { isPro: true, status: 'active', trialEndsAt: '2027-01-01T00:00:00Z' };
  assert.equal(resolveUserEntitlement(backendRow, null), backendRow);
  assert.equal(resolveUserEntitlement(null, null), null);
});
