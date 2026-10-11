import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { QueryClient } from '@tanstack/react-query';
import { getUserEntitlementQueryKey, publishRevenueCatEntitlement } from '../queries/subscriptions/entitlementCache.ts';
import { PRO_ENTITLEMENT } from '../services/subscriptions/entitlementResolution.ts';

const compiled = (name) => ts.transpileModule(
  readFileSync(new URL(name, import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;
const paywallCode = compiled('./usePaywall.ts');
const bootstrapCode = compiled('./useSubscriptionBootstrap.ts');
const customerInfo = { entitlements: { active: { [PRO_ENTITLEMENT]: {
  isActive: true, productIdentifier: 'annual', periodType: 'NORMAL', expirationDate: null,
} } } };
const flush = () => new Promise((resolve) => setImmediate(resolve));

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let auth = { status: 'signed_in', user: { id: 'user-1' } };
  let currentRevenueCatId = 'user-1';
  let result = { status: 'purchased', isPro: true, customerInfo, appUserId: 'user-1' };
  let refresh = async () => customerInfo;
  let refreshes = 0;
  let purchases = 0;
  const customerInfoListeners = new Set();
  const appStateListeners = new Set();
  const effects = [];
  const stateUpdates = [];
  const events = [];
  const useAuthStore = Object.assign((select) => select(auth), { getState: () => auth });
  const identity = { status: 'synced', appUserId: 'user-1' };
  const useRevenueCatIdentityStore = Object.assign((select) => select(identity), {
    getState: () => identity,
  });
  const dependencies = {
    useAuthStore,
    useRevenueCatIdentityStore,
    useQueryClient: () => client,
    useEffect: (effect) => { effects.push(effect); },
    useRef: (current) => ({ current }),
    useState: (initial) => [typeof initial === 'function' ? initial() : initial,
      (value) => { stateUpdates.push(value); }],
    posthog: { capture: (event) => events.push(event) },
    AnalyticsEvent: { PaywallPurchaseCompleted: 'purchase_completed', PaywallRestoreCompleted: 'restore_completed' },
    logRevenueCatDebugSnapshot: () => {},
    buildPaywallEventProperties: () => ({}),
    getCachedPaywallOffering: () => ({
      offering: { offeringIdentifier: 'default', packages: [] },
      revenueCatPackages: { annual: { identifier: 'annual' }, weekly: null },
    }),
    purchasePaywallPackage: async () => { purchases += 1; return result; },
    restorePaywallPurchases: async () => result,
    syncRevenueCatAttributionForCurrentUser: async () => true,
    refreshRevenueCatCustomerInfoForCurrentUser: async () => { refreshes += 1; return refresh(); },
    getCurrentRevenueCatAppUserId: () => currentRevenueCatId,
    subscribeToRevenueCatCustomerInfo: (listener) => {
      customerInfoListeners.add(listener);
      return () => customerInfoListeners.delete(listener);
    },
    getUserEntitlementQueryKey,
    publishRevenueCatEntitlement,
    AppState: {
      currentState: 'active',
      addEventListener: (_, listener) => {
        appStateListeners.add(listener);
        return { remove: () => appStateListeners.delete(listener) };
      },
    },
  };
  function load(code) {
    const exports = {};
    vm.runInNewContext(code, { exports, require: () => dependencies, setTimeout, clearTimeout });
    return exports;
  }
  return {
    client, events, effects, stateUpdates, customerInfoListeners, appStateListeners,
    paywall: () => load(paywallCode).usePaywall({ placement: 'profile_upgrade' }),
    bootstrap: () => { load(bootstrapCode).useSubscriptionBootstrap(); return effects.pop()(); },
    setResult: (next) => { result = next; },
    switchAccount: () => { auth = { status: 'signed_in', user: { id: 'user-2' } }; currentRevenueCatId = 'user-2'; },
    setRefresh: (next) => { refresh = next; },
    refreshes: () => refreshes,
    purchases: () => purchases,
  };
}

test('real paywall hook publishes confirmed purchase/restore before returning success', async () => {
  for (const status of ['purchased', 'restored']) {
    const harness = setup();
    harness.setResult({ status, isPro: true, customerInfo, appUserId: 'user-1' });
    harness.client.setQueryData(getUserEntitlementQueryKey('user-1'), { isPro: false });
    try {
      const paywall = harness.paywall();
      const result = status === 'purchased'
        ? await paywall.purchaseSelectedPackage()
        : await paywall.restorePurchases();
      assert.equal(result.status, status);
      assert.equal(harness.client.getQueryData(getUserEntitlementQueryKey('user-1')).isPro, true);
      assert.equal(harness.client.getQueryState(getUserEntitlementQueryKey('user-1')).isInvalidated, false);
      assert.equal(harness.stateUpdates.at(-1), false);
    } finally { harness.client.clear(); }
  }
});

test('a purchase handler from a previous account never starts a store transaction', async () => {
  const harness = setup();
  try {
    const paywall = harness.paywall();
    harness.switchAccount();
    const result = await paywall.purchaseSelectedPackage();
    assert.equal(result.status, 'not_presented');
    assert.equal(result.reason, 'signed_out');
    assert.equal(harness.events.includes('purchase_completed'), false);
    assert.equal(harness.purchases(), 0);
    assert.equal(harness.client.getQueryCache().getAll().length, 0);
  } finally { harness.client.clear(); }
});

test('a late purchase result for another account never returns success or publishes Pro', async () => {
  const harness = setup();
  harness.setResult({ status: 'purchased', isPro: true, customerInfo, appUserId: 'user-2' });
  try {
    const result = await harness.paywall().purchaseSelectedPackage();
    assert.equal(result.status, 'not_presented');
    assert.equal(result.reason, 'signed_out');
    assert.equal(harness.events.includes('purchase_completed'), false);
    assert.equal(harness.client.getQueryCache().getAll().length, 0);
  } finally { harness.client.clear(); }
});

test('ten foreground cycles update Pro with one listener, and teardown releases every listener', async () => {
  const harness = setup();
  const cleanup = harness.bootstrap();
  try {
    await flush();
    for (let cycle = 0; cycle < 10; cycle += 1) {
      harness.appStateListeners.forEach((listener) => listener('background'));
      harness.appStateListeners.forEach((listener) => listener('active'));
      await flush();
      assert.equal(harness.client.getQueryData(getUserEntitlementQueryKey('user-1')).isPro, true);
      assert.equal(harness.customerInfoListeners.size, 1);
      assert.equal(harness.appStateListeners.size, 1);
    }
    assert.equal(harness.refreshes(), 11);
  } finally {
    cleanup();
    assert.equal(harness.customerInfoListeners.size, 0);
    assert.equal(harness.appStateListeners.size, 0);
    harness.client.clear();
  }
});

test('SDK background updates reach the cache after a cached free response', async () => {
  const harness = setup();
  harness.setRefresh(async () => ({ entitlements: { active: {} } }));
  harness.client.setQueryData(getUserEntitlementQueryKey('user-1'), { isPro: false });
  const cleanup = harness.bootstrap();
  try {
    await flush();
    harness.customerInfoListeners.forEach((listener) => listener(customerInfo));
    await flush();
    assert.equal(harness.client.getQueryData(getUserEntitlementQueryKey('user-1')).isPro, true);
  } finally { cleanup(); harness.client.clear(); }
});

test('late bootstrap responses after account change or unmount are discarded', async () => {
  for (const stop of ['account_change', 'unmount']) {
    const harness = setup();
    let completeRefresh;
    harness.setRefresh(() => new Promise((resolve) => { completeRefresh = resolve; }));
    const cleanup = harness.bootstrap();
    try {
      await flush();
      if (stop === 'account_change') harness.switchAccount();
      else cleanup();
      completeRefresh(customerInfo);
      await flush();
      assert.equal(harness.client.getQueryCache().getAll().length, 0);
    } finally { cleanup(); harness.client.clear(); }
  }
});
