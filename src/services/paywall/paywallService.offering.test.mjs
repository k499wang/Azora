import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as eligibility from './paywallTrialEligibility.ts';

const code = ts.transpileModule(readFileSync(new URL('./paywallService.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function packageWithOffer(packageType, identifier, introPrice = null) {
  return {
    identifier,
    packageType,
    product: {
      identifier,
      price: 59.99,
      priceString: '$59.99',
      pricePerMonthString: '$5.00',
      currencyCode: 'USD',
      subscriptionPeriod: packageType === 'ANNUAL' ? 'P1Y' : 'P1M',
      introPrice,
    },
  };
}

const annual = packageWithOffer('ANNUAL', 'annual', {
  price: 0, priceString: '$0.00', periodUnit: 'DAY', periodNumberOfUnits: 7,
});
const fallbackMonthly = packageWithOffer('MONTHLY', 'regular-monthly');
const trialMonthly = packageWithOffer('MONTHLY', 'trial-monthly', {
  price: 0.99, priceString: '$0.99', periodUnit: 'DAY', periodNumberOfUnits: 3,
});

function setup(paidTrialPackages, { eligible = true, offeringError = null, placementOffering = null } = {}) {
  const exports = {};
  const purchased = [];
  const placement = placementOffering ?? {
    identifier: 'onboarding', metadata: {}, annual, monthly: fallbackMonthly,
    availablePackages: [annual, fallbackMonthly],
  };
  const dependencies = {
    ...eligibility,
    PACKAGE_TYPE: { ANNUAL: 'ANNUAL', MONTHLY: 'MONTHLY', WEEKLY: 'WEEKLY' },
    PaywallPlacement: { OnboardingComplete: 'onboarding_complete' },
    RevenueCatSignedOutError: class extends Error {},
    isRevenueCatReady: () => true,
    hasCurrentRevenueCatIdentity: () => true,
    getCurrentRevenueCatAppUserId: () => 'user-1',
    requireCurrentRevenueCatAppUserId: () => 'user-1',
    getRevenueCatOfferingForPlacement: async () => placement,
    getRevenueCatOffering: async () => {
      if (offeringError) throw offeringError;
      return paidTrialPackages == null ? null : { availablePackages: paidTrialPackages };
    },
    checkRevenueCatTrialEligibility: async ids => Object.fromEntries(ids.map(id => [id, { status: eligible ? 2 : 1 }])),
    purchaseRevenueCatPackage: async pkg => { purchased.push(pkg); return {}; },
    mapRevenueCatProEntitlement: () => ({}),
    logRevenueCatPaywallOfferingSnapshot() {},
    logRevenueCatCustomerInfoSnapshot() {},
  };
  vm.runInNewContext(code, { exports, require: () => dependencies });
  return { exports, purchased };
}

test('trial choices show eligible store offers and purchase their matching packages', async () => {
  const harness = setup([trialMonthly]);
  const result = await harness.exports.getPaywallOffering('onboarding_complete');
  assert.equal(result.offering.packages[0].trialDays, 7);
  assert.equal(result.offering.packages[1].introOffer.days, 3);
  assert.equal(result.offering.packages[1].introOffer.priceString, '$0.99');
  for (const id of ['annual', 'monthly']) {
    const displayed = result.offering.packages.find(pkg => pkg.id === id);
    assert.equal(displayed.productIdentifier, result.revenueCatPackages[id].product.identifier);
    assert.equal((await harness.exports.purchasePaywallPackage(result.revenueCatPackages[id])).status, 'purchased');
  }
  assert.deepEqual(harness.purchased, [annual, trialMonthly]);
});

test('monthly trial selection finds the monthly package even when another package comes first', async () => {
  const harness = setup([annual, trialMonthly]);
  const result = await harness.exports.getPaywallOffering('onboarding_complete');
  assert.equal(result.revenueCatPackages.monthly, trialMonthly);
  assert.deepEqual(Array.from(result.offering.packages, pkg => pkg.id), ['annual', 'monthly']);
});

test('missing, invalid, or unavailable paid trial offering falls back to the placement monthly package', async () => {
  for (const [packages, options] of [[null], [[]], [[annual]], [null, { offeringError: new Error('Offline') }]]) {
    const harness = setup(packages, options);
    const result = await harness.exports.getPaywallOffering('onboarding_complete');
    assert.equal(result.revenueCatPackages.monthly, fallbackMonthly);
    assert.equal(result.offering.packages[1].productIdentifier, fallbackMonthly.product.identifier);
    assert.equal(result.offering.packages[1].introOffer, null);
  }
});

test('ineligible subscriptions show regular prices without advertising trial offers', async () => {
  const harness = setup([trialMonthly], { eligible: false });
  const result = await harness.exports.getPaywallOffering('onboarding_complete');
  assert.equal(result.offering.packages[0].trialLabel, null);
  assert.equal(result.offering.packages[0].trialDays, null);
  assert.equal(result.offering.packages[1].introOffer, null);
});

test('a weekly package fills the short-plan slot and bills per week', async () => {
  const weekly = packageWithOffer('WEEKLY', 'weekly');
  const harness = setup([weekly]);
  const result = await harness.exports.getPaywallOffering('onboarding_complete');
  assert.equal(result.revenueCatPackages.monthly, weekly);
  assert.equal(result.offering.packages[1].billingPeriod, 'week');
  assert.equal(result.offering.packages[1].title, 'Weekly');
  assert.equal(result.offering.packages[0].billingPeriod, 'year');
});

test('weekly + monthly offerings put monthly first and can show either alone', async () => {
  const trialWeekly = { ...packageWithOffer('WEEKLY', 'trial-weekly', {
    price: 0.99, priceString: '$0.99', periodUnit: 'WEEK', periodNumberOfUnits: 1,
  }) };
  const pairMonthly = packageWithOffer('MONTHLY', 'pair-monthly', {
    price: 4.99, priceString: '$4.99', periodUnit: 'MONTH', periodNumberOfUnits: 1,
  });
  const placementOffering = { identifier: 'pair', metadata: {}, availablePackages: [trialWeekly, pairMonthly] };
  const result = await setup([trialMonthly], { placementOffering }).exports.getPaywallOffering('onboarding_complete');
  const [first, second] = result.offering.packages;
  assert.equal(`${first.id} ${first.billingPeriod} ${first.introOffer.days}`, 'annual month 30');
  assert.equal(`${second.id} ${second.billingPeriod} ${second.introOffer.days}`, 'monthly week 7');
  assert.equal(result.revenueCatPackages.annual, pairMonthly);
  assert.equal(result.revenueCatPackages.monthly, trialWeekly);

  for (const [trialPackage, expected] of [['monthly', 'annual'], ['weekly', 'monthly']]) {
    const only = await setup([trialMonthly], {
      placementOffering: { ...placementOffering, metadata: { trial_package: trialPackage } },
    }).exports.getPaywallOffering('onboarding_complete');
    assert.equal(only.offering.onlyPackageId, expected);
  }
});
