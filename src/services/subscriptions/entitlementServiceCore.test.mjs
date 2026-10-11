import test from 'node:test';
import assert from 'node:assert/strict';
import { lookupUserEntitlement } from './entitlementServiceCore.ts';
import { PRO_ENTITLEMENT } from './entitlementResolution.ts';

const activeCustomerInfo = {
  entitlements: {
    active: {
      [PRO_ENTITLEMENT]: {
        isActive: true,
        productIdentifier: 'azora.pro.annual',
        expirationDate: '2027-01-01T00:00:00Z',
        periodType: 'NORMAL',
      },
    },
  },
};

function createDependencies(overrides = {}) {
  return {
    getMirrorEntitlement: async () => ({ isPro: false }),
    getAuthenticatedUserId: async () => 'user-1',
    getCurrentAuthUserId: () => 'user-1',
    getCurrentRevenueCatAppUserId: () => 'user-1',
    refreshRevenueCatCustomerInfo: async () => activeCustomerInfo,
    ...overrides,
  };
}

test('startup waits for delayed RevenueCat identity and customer info before resolving stale free state', async () => {
  let completeRefresh;
  let resolved = false;
  let revenueCatUserId = null;
  const refresh = new Promise((resolve) => { completeRefresh = resolve; });
  const lookup = lookupUserEntitlement('user-1', createDependencies({
    getCurrentRevenueCatAppUserId: () => revenueCatUserId,
    refreshRevenueCatCustomerInfo: () => refresh,
  })).then((value) => { resolved = true; return value; });

  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(resolved, false);
  revenueCatUserId = 'user-1';
  completeRefresh(activeCustomerInfo);
  assert.equal((await lookup).isPro, true);
});

test('a missing backend row does not remove RevenueCat confirmed Pro', async () => {
  const result = await lookupUserEntitlement('user-1', createDependencies({
    getMirrorEntitlement: async () => null,
  }));
  assert.equal(result.isPro, true);
});

test('backend lookup errors fall back to RevenueCat confirmed Pro', async () => {
  const result = await lookupUserEntitlement('user-1', createDependencies({
    getMirrorEntitlement: async () => { throw new Error('backend unavailable'); },
  }));
  assert.equal(result.isPro, true);
});

test('backend errors remain errors when RevenueCat cannot confirm Pro', async () => {
  const backendError = new Error('backend unavailable');
  await assert.rejects(lookupUserEntitlement('user-1', createDependencies({
    getMirrorEntitlement: async () => { throw backendError; },
    refreshRevenueCatCustomerInfo: async () => ({ entitlements: { active: {} } }),
  })), (error) => error === backendError);
});

test('RevenueCat refresh failure preserves backend confirmed Pro', async () => {
  const backendRow = { isPro: true, status: 'active' };
  const result = await lookupUserEntitlement('user-1', createDependencies({
    getMirrorEntitlement: async () => backendRow,
    refreshRevenueCatCustomerInfo: async () => { throw new Error('SDK offline'); },
  }));
  assert.equal(result, backendRow);
});

test('an already changed account cannot start the entitlement lookup', async () => {
  let didRefresh = false;
  await assert.rejects(lookupUserEntitlement('user-1', createDependencies({
    getCurrentAuthUserId: () => 'user-2',
    refreshRevenueCatCustomerInfo: async () => { didRefresh = true; return activeCustomerInfo; },
  })), /Authenticated user changed/);
  assert.equal(didRefresh, false);
});

test('sign-out or account switch during async lookup cannot publish the previous account Pro', async () => {
  for (const nextUserId of [null, 'user-2']) {
    let currentUserId = 'user-1';
    await assert.rejects(lookupUserEntitlement('user-1', createDependencies({
      getCurrentAuthUserId: () => currentUserId,
      refreshRevenueCatCustomerInfo: async () => {
        currentUserId = nextUserId;
        return activeCustomerInfo;
      },
    })), /Authenticated user changed/);
  }
});

test('mismatched backend auth or RevenueCat identity cannot grant Pro', async () => {
  await assert.rejects(lookupUserEntitlement('user-1', createDependencies({
    getAuthenticatedUserId: async () => 'user-2',
  })), /Authenticated user changed/);
  await assert.rejects(lookupUserEntitlement('user-1', createDependencies({
    getCurrentRevenueCatAppUserId: () => 'user-2',
  })), /RevenueCat user changed/);
});

test('failed authenticated user lookup cannot use an entitlement from either source', async () => {
  await assert.rejects(lookupUserEntitlement('user-1', createDependencies({
    getAuthenticatedUserId: async () => { throw new Error('session unavailable'); },
  })), /session unavailable/);
});

test('the account is checked again before returning the resolved entitlement', async () => {
  let checks = 0;
  await assert.rejects(lookupUserEntitlement('user-1', createDependencies({
    getCurrentAuthUserId: () => ++checks < 3 ? 'user-1' : 'user-2',
  })), /Authenticated user changed/);
});
