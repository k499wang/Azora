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

function setup(paidTrialPackages, {
  eligible = true,
  offeringError = null,
  placementOffering = null,
  namedOfferings = {},
  catalog = {},
  ready = true,
  checkEligibility,
} = {}) {
  const exports = {};
  const purchased = [];
  const offeringLookups = [];
  let appUserId = 'user-1';
  class RevenueCatSignedOutError extends Error {}
  const placement = placementOffering ?? {
    identifier: 'onboarding', metadata: {}, annual, monthly: fallbackMonthly,
    availablePackages: [annual, fallbackMonthly],
  };
  const dependencies = {
    ...eligibility,
    PACKAGE_TYPE: { ANNUAL: 'ANNUAL', MONTHLY: 'MONTHLY', WEEKLY: 'WEEKLY' },
    PaywallPlacement: { OnboardingComplete: 'onboarding_complete', ExitDiscount: 'exit_discount' },
    RevenueCatSignedOutError,
    isRevenueCatReady: () => ready,
    hasCurrentRevenueCatIdentity: () => appUserId != null,
    getCurrentRevenueCatAppUserId: () => appUserId,
    requireCurrentRevenueCatAppUserId: () => {
      if (appUserId == null) throw new RevenueCatSignedOutError();
      return appUserId;
    },
    getRevenueCatOfferingForPlacement: async () => placement,
    getRevenueCatOffering: async identifier => {
      offeringLookups.push(identifier);
      if (Object.hasOwn(namedOfferings, identifier)) return namedOfferings[identifier];
      if (identifier !== 'paid_trial_monthly') return null;
      if (offeringError) throw offeringError;
      return paidTrialPackages == null ? null : { availablePackages: paidTrialPackages };
    },
    getRevenueCatOfferings: async () => catalog,
    checkRevenueCatTrialEligibility: checkEligibility ?? (async ids => Object.fromEntries(ids.map(id => [id, { status: eligible ? 2 : 1 }]))),
    purchaseRevenueCatPackage: async pkg => { purchased.push(pkg); return {}; },
    mapRevenueCatProEntitlement: () => ({}),
    logRevenueCatPaywallOfferingSnapshot() {},
    logRevenueCatCustomerInfoSnapshot() {},
  };
  vm.runInNewContext(code, { exports, require: () => dependencies });
  return {
    exports, purchased, offeringLookups, RevenueCatSignedOutError,
    switchAccount: id => { appUserId = id; },
  };
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

test('annual + weekly paid-trial offerings use their own weekly and the annual paid intro', async () => {
  const paidAnnual = packageWithOffer('ANNUAL', 'paid-annual', {
    price: 4.99, priceString: '$4.99', periodUnit: 'MONTH', periodNumberOfUnits: 1,
  });
  const paidWeekly = packageWithOffer('WEEKLY', 'paid-weekly', {
    price: 0.99, priceString: '$0.99', periodUnit: 'WEEK', periodNumberOfUnits: 1,
  });
  const placementOffering = { identifier: 'pair', metadata: {}, annual: paidAnnual, availablePackages: [paidWeekly, paidAnnual] };
  const result = await setup([trialMonthly], { placementOffering }).exports.getPaywallOffering('onboarding_complete');
  const [first, second] = result.offering.packages;
  assert.equal(`${first.billingPeriod} ${first.trialLabel} ${first.introOffer.days} ${first.introOffer.priceString}`, 'year null 30 $4.99');
  assert.equal(`${second.billingPeriod} ${second.introOffer.days} ${second.introOffer.priceString}`, 'week 7 $0.99');
  assert.equal(result.revenueCatPackages.monthly, paidWeekly);
});

test('a weekly free trial in the offering is kept and shown instead of the paid-trial offering', async () => {
  const freeWeekly = packageWithOffer('WEEKLY', 'free-weekly', {
    price: 0, priceString: '$0.00', periodUnit: 'WEEK', periodNumberOfUnits: 1,
  });
  const placementOffering = { identifier: 'weekly-only', metadata: {}, availablePackages: [freeWeekly] };
  const harness = setup([trialMonthly], { placementOffering });
  const result = await harness.exports.getPaywallOffering('onboarding_complete');
  assert.equal(result.revenueCatPackages.monthly, freeWeekly);
  assert.deepEqual(harness.offeringLookups, []);
  const [weekly] = result.offering.packages;
  assert.equal(`${weekly.id} ${weekly.billingPeriod} ${weekly.trialLabel} ${weekly.trialDays}`, 'monthly week 7-day free trial 7');
  assert.equal(weekly.introOffer, null);

  const ineligible = await setup([trialMonthly], { placementOffering, eligible: false }).exports.getPaywallOffering('onboarding_complete');
  assert.equal(ineligible.offering.packages[0].trialLabel, null);
  assert.equal(ineligible.revenueCatPackages.monthly, freeWeekly);
});

test('the exit offer sells its own short plan, never the paid-trial swap', async () => {
  const plainMonthly = packageWithOffer('MONTHLY', 'exit-monthly');
  const placementOffering = { identifier: 'exit', metadata: {}, availablePackages: [plainMonthly] };
  const harness = setup([trialMonthly], { placementOffering });
  const result = await harness.exports.getPaywallOffering('exit_discount');
  assert.equal(result.revenueCatPackages.monthly, plainMonthly);
  assert.deepEqual(harness.offeringLookups, []);
});

test('explicit offering access displays and purchases that offering’s own products', async () => {
  const ownAnnual = packageWithOffer('ANNUAL', 'review-annual');
  const ownMonthly = packageWithOffer('MONTHLY', 'review-monthly');
  const reviewOffering = {
    identifier: 'review-pair', metadata: {}, annual: ownAnnual, monthly: ownMonthly,
    availablePackages: [ownAnnual, ownMonthly],
  };
  const harness = setup([trialMonthly], { namedOfferings: { 'review-pair': reviewOffering } });
  const result = await harness.exports.getPaywallOffering('onboarding_complete', 'review-pair');

  assert.equal(result.offering.offeringIdentifier, 'review-pair');
  assert.deepEqual(harness.offeringLookups, ['review-pair']);
  assert.equal(result.revenueCatPackages.annual, ownAnnual);
  assert.equal(result.revenueCatPackages.monthly, ownMonthly);
  assert.equal(result.offering.packages[1].introOffer, null);
  for (const option of result.offering.packages) {
    const pkg = result.revenueCatPackages[option.id];
    assert.equal(option.productIdentifier, pkg.product.identifier);
    assert.equal((await harness.exports.purchasePaywallPackage(pkg)).status, 'purchased');
  }
  assert.deepEqual(harness.purchased, [ownAnnual, ownMonthly]);
});

test('explicit single-plan offerings stay single-plan and missing offerings do not fall back', async () => {
  const shortOnly = {
    identifier: 'short-only', metadata: {}, monthly: fallbackMonthly,
    availablePackages: [fallbackMonthly],
  };
  const harness = setup([trialMonthly], { namedOfferings: { 'short-only': shortOnly } });
  const result = await harness.exports.getPaywallOffering('onboarding_complete', 'short-only');
  assert.equal(result.revenueCatPackages.annual, null);
  assert.equal(result.revenueCatPackages.monthly, fallbackMonthly);
  assert.equal(result.offering.packages.length, 1);

  const missing = await harness.exports.getPaywallOffering('onboarding_complete', 'missing');
  assert.equal(missing.offering, null);
  assert.equal(missing.revenueCatPackages.annual, null);
  assert.equal(missing.revenueCatPackages.monthly, null);
  assert.deepEqual(harness.offeringLookups, ['short-only', 'missing']);
});

test('review offering caches are isolated from placements, other offerings, and other accounts', async () => {
  const namedOfferings = Object.fromEntries(['review-a', 'review-b'].map(identifier => [identifier, {
    identifier, metadata: {}, annual,
    availablePackages: [annual, fallbackMonthly],
  }]));
  const harness = setup([trialMonthly], { namedOfferings });
  const production = await harness.exports.getPaywallOffering('onboarding_complete');
  const reviewA = await harness.exports.getPaywallOffering('onboarding_complete', 'review-a');
  const reviewB = await harness.exports.getPaywallOffering('onboarding_complete', 'review-b');
  assert.equal(production.revenueCatPackages.monthly, trialMonthly);
  assert.equal(reviewA.revenueCatPackages.monthly, fallbackMonthly);
  assert.equal(harness.exports.getCachedPaywallOffering('onboarding_complete'), production);
  assert.equal(harness.exports.getCachedPaywallOffering('onboarding_complete', 'review-a'), reviewA);
  assert.equal(harness.exports.getCachedPaywallOffering('onboarding_complete', 'review-b'), reviewB);
  assert.equal(harness.exports.getCachedPaywallOffering('profile_upgrade', 'review-a'), null);
  harness.switchAccount('user-2');
  assert.equal(harness.exports.getCachedPaywallOffering('onboarding_complete'), null);
  assert.equal(harness.exports.getCachedPaywallOffering('onboarding_complete', 'review-a'), null);
  harness.switchAccount('user-1');
  assert.equal(harness.exports.getCachedPaywallOffering('onboarding_complete'), production);
});

test('review catalog lists configured nonempty offerings with stable IDs and product counts', async () => {
  const catalog = {
    z: { identifier: 'z', serverDescription: 'Zebra', availablePackages: [annual, fallbackMonthly] },
    empty: { identifier: 'empty', serverDescription: 'Empty', availablePackages: [] },
    a: { identifier: 'a', serverDescription: '', availablePackages: [trialMonthly] },
  };
  const result = await setup([], { catalog }).exports.getPaywallReviewOfferings();
  assert.deepEqual(JSON.parse(JSON.stringify(result)), [
    { identifier: 'a', title: 'a', packageCount: 1, hasFirstPlan: false, hasShortPlan: true },
    { identifier: 'z', title: 'Zebra', packageCount: 2, hasFirstPlan: true, hasShortPlan: true },
  ]);
});

test('an account change during eligibility cannot publish or cache another account’s offering', async () => {
  let resolveEligibility, eligibilityStarted;
  const pendingEligibility = new Promise(resolve => { resolveEligibility = resolve; });
  const started = new Promise(resolve => { eligibilityStarted = resolve; });
  const review = { identifier: 'review', metadata: {}, annual, availablePackages: [annual] };
  const harness = setup([], {
    namedOfferings: { review },
    checkEligibility: async () => { eligibilityStarted(); return pendingEligibility; },
  });
  const request = harness.exports.getPaywallOffering('onboarding_complete', 'review');
  await started;
  harness.switchAccount('user-2');
  resolveEligibility({ annual: { status: 2 } });
  await assert.rejects(request, harness.RevenueCatSignedOutError);
  assert.equal(harness.exports.getCachedPaywallOffering('onboarding_complete', 'review'), null);
  harness.switchAccount('user-1');
  assert.equal(harness.exports.getCachedPaywallOffering('onboarding_complete', 'review'), null);
});

test('review catalog rejects signed-out, unready, and changed-account requests', async () => {
  const signedOut = setup([]);
  signedOut.switchAccount(null);
  await assert.rejects(signedOut.exports.getPaywallReviewOfferings(), signedOut.RevenueCatSignedOutError);
  await assert.rejects(setup([], { ready: false }).exports.getPaywallReviewOfferings(), /not ready/);

  let resolveCatalog;
  const catalog = new Promise(resolve => { resolveCatalog = resolve; });
  const changed = setup([], { catalog });
  const request = changed.exports.getPaywallReviewOfferings();
  changed.switchAccount('user-2');
  resolveCatalog({ a: { identifier: 'a', availablePackages: [annual] } });
  await assert.rejects(request, changed.RevenueCatSignedOutError);
});
