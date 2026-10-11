import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { PRO_ENTITLEMENT, mapRevenueCatProEntitlement } from '../subscriptions/entitlementResolution.ts';

const code = ts.transpileModule(readFileSync(new URL('./paywallService.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const active = { entitlements: { active: { [PRO_ENTITLEMENT]: {
  isActive: true, productIdentifier: 'annual', periodType: 'NORMAL', expirationDate: null,
} } } };
const free = { entitlements: { active: {} } };
const pkg = { identifier: '$rc_annual', product: { identifier: 'annual' } };

function setup({ initial = active, refreshed = active, purchaseError = null } = {}) {
  const exports = {};
  let appUserId = 'user-1';
  let refreshes = 0;
  class RevenueCatSignedOutError extends Error {}
  const dependencies = {
    PRO_ENTITLEMENT,
    mapRevenueCatProEntitlement,
    RevenueCatSignedOutError,
    isRevenueCatReady: () => true,
    hasCurrentRevenueCatIdentity: () => true,
    getCurrentRevenueCatAppUserId: () => appUserId,
    requireCurrentRevenueCatAppUserId: () => appUserId,
    purchaseRevenueCatPackage: async () => { if (purchaseError) throw purchaseError; return initial; },
    restoreRevenueCatPurchases: async () => initial,
    getRevenueCatCustomerInfo: async () => { refreshes += 1; return refreshed; },
    logRevenueCatCustomerInfoSnapshot: () => {},
    PURCHASES_ERROR_CODE: { PURCHASE_CANCELLED_ERROR: 'cancelled', INVALID_RECEIPT_ERROR: 'invalid_receipt' },
  };
  vm.runInNewContext(code, {
    exports, require: () => dependencies,
    setTimeout: (callback) => { callback(); },
  });
  return { exports, refreshes: () => refreshes, switchAccount: () => { appUserId = 'user-2'; } };
}

test('purchase and restore return confirmed customer info with the purchasing account', async () => {
  for (const flow of ['purchase', 'restore']) {
    const harness = setup();
    const result = flow === 'purchase'
      ? await harness.exports.purchasePaywallPackage(pkg)
      : await harness.exports.restorePaywallPurchases();
    assert.equal(result.status, flow === 'purchase' ? 'purchased' : 'restored');
    assert.equal(result.isPro, true);
    assert.equal(result.customerInfo, active);
    assert.equal(result.appUserId, 'user-1');
    assert.equal(harness.refreshes(), 0);
  }
});

test('delayed entitlement activation publishes the refreshed customer info', async () => {
  const harness = setup({ initial: free });
  const result = await harness.exports.purchasePaywallPackage(pkg);
  assert.equal(result.isPro, true);
  assert.equal(result.customerInfo, active);
  assert.equal(harness.refreshes(), 1);
});

test('a purchase without the Pro entitlement never reports Pro access', async () => {
  const harness = setup({ initial: free, refreshed: free });
  const result = await harness.exports.purchasePaywallPackage(pkg);
  assert.equal(result.status, 'purchased');
  assert.equal(result.isPro, false);
  assert.equal(result.customerInfo, free);
});

test('account changes during purchase or restore cannot return confirmed access', async () => {
  for (const flow of ['purchase', 'restore']) {
    const harness = setup();
    const request = flow === 'purchase'
      ? harness.exports.purchasePaywallPackage(pkg)
      : harness.exports.restorePaywallPurchases();
    harness.switchAccount();
    const result = await request;
    assert.equal(result.status, 'not_presented');
    assert.equal(result.reason, 'signed_out');
  }
});

test('store cancellation and missing package behavior are preserved', async () => {
  const harness = setup({ purchaseError: { code: 'cancelled', message: 'cancelled', userCancelled: true } });
  assert.equal((await harness.exports.purchasePaywallPackage(pkg)).status, 'cancelled');
  const missing = await harness.exports.purchasePaywallPackage(null);
  assert.equal(missing.status, 'not_presented');
  assert.equal(missing.reason, 'missing_package');
});
