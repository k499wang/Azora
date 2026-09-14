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

test('onboarding intro stays on the free-trial presentation while eligibility resolves', () => {
  assert.match(paywallScreen, /const showFreeTrialIntro = true;/);
  assert.equal(
    (paywallScreen.match(/hasTrial=\{showFreeTrialIntro\}/g) ?? []).length,
    2,
  );
});

test('the plan step keeps billing claims tied to actual trial eligibility', () => {
  assert.match(paywallScreen, /hasAnnualTrial=\{hasAnnualTrial\}/);
  assert.match(paywallScreen, /\{hasAnnualTrial \? \(/);
  assert.match(paywallScreen, /selectedPackageHasTrial\s+\? 'No Payment Due Now'/);
  assert.match(paywallScreen, /isAnnualSelected && selectedPackageHasTrial/);
});
