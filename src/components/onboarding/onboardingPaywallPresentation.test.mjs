import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const paywallScreen = readFileSync(
  join(here, 'screens', 'OnboardingPaywallScreen.tsx'),
  'utf8',
);
const longForm = readFileSync(
  join(
    here,
    '..',
    'paywall',
    'longForm',
    'PaywallLongForm.tsx',
  ),
  'utf8',
);

test('onboarding stays on the free-trial presentation while eligibility resolves', () => {
  assert.match(paywallScreen, /const showFreeTrialIntro = true;/);
  assert.match(paywallScreen, /hasTrial=\{showFreeTrialIntro\}/);
});

test('the paywall is one scrolling page, not a deck of steps', () => {
  assert.doesNotMatch(paywallScreen, /PaywallStepKey/);
  assert.match(paywallScreen, /<PaywallLongForm/);
  // The plan cards in the tray are the only buy control, visible the whole way
  // down; nothing on the page itself charges anybody.
  assert.equal((paywallScreen.match(/<PaywallTrayPlans/g) ?? []).length, 1);
  assert.doesNotMatch(longForm, /ChunkyButton|PrimaryButton|PlanCard/);
});

test('the page receives the plan it is selling', () => {
  assert.match(paywallScreen, /primarySessionMinutes: number;/);
  assert.match(paywallScreen, /intent=\{planIntent \?\? 'stress_relief'\}/);
  assert.match(paywallScreen, /sessionMinutes=\{primarySessionMinutes\}/);
});

test('a hard paywall drops the Free vs Pro comparison', () => {
  const flow = readFileSync(join(here, 'OnboardingFlow.tsx'), 'utf8');

  assert.match(
    paywallScreen,
    /comparison=\{\s*showPlanComparison \? \(/,
  );
  assert.match(flow, /showPlanComparison=\{paywallMode !== 'hard'\}/);
});

test('billing claims stay tied to actual trial eligibility', () => {
  assert.match(paywallScreen, /selectedPackageHasTrial\s+\? 'No Payment Due Now'/);
  assert.match(paywallScreen, /hasAnnualTrial\s+\? 'Cancel Anytime In Seconds'/);
});

test('a plan card buys the plan it shows, not the one already selected', () => {
  const flow = readFileSync(join(here, 'OnboardingFlow.tsx'), 'utf8');
  const pro = readFileSync(
    join(here, '..', '..', 'screens', 'ProPaywallScreen.tsx'),
    'utf8',
  );

  for (const source of [flow, pro]) {
    assert.match(source, /paywall\.purchaseSelectedPackage\(packageId\)/);
  }
});

test('the exit-intent countdown starts when the offer has been scrolled to', () => {
  assert.match(paywallScreen, /OFFER_REACHED_SHARE/);
  assert.match(paywallScreen, /onOfferReached\?\.\(\)/);
});
