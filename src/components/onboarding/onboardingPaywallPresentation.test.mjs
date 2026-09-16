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
  // The promise step and the comparison step both keep the stable presentation,
  // so "for free" is the same claim the rest of the deck makes.
  assert.equal(
    (paywallScreen.match(/hasTrial=\{showFreeTrialIntro\}/g) ?? []).length,
    2,
  );
});

test('the promise step names the goal and every step leads with one heading', () => {
  const benefitsStep = readFileSync(
    join(here, 'paywall', 'PaywallBenefitsStep.tsx'),
    'utf8',
  );
  const comparisonStep = readFileSync(
    join(here, 'paywall', 'PaywallFreeVsProStep.tsx'),
    'utf8',
  );
  const heroStep = readFileSync(
    join(here, 'paywall', 'PaywallFreeTrialHeroStep.tsx'),
    'utf8',
  );

  assert.match(benefitsStep, /Azo wants you to try your personalized/);
  assert.match(benefitsStep, /planNounForIntent\(intent\)/);
  assert.match(comparisonStep, /personalizedRoutineLabel\(intent, durationMinutes\)/);
  assert.match(comparisonStep, /Quick daily exercises/);
  assert.match(comparisonStep, /Azo companion guidance/);
  assert.match(comparisonStep, /Progress tracking/);
  // A heading per step, and nothing hanging under it.
  assert.doesNotMatch(benefitsStep, /stepSubtitle/);
  assert.doesNotMatch(comparisonStep, /stepSubtitle/);
  assert.doesNotMatch(heroStep, /bellHint/);
});

test('the multi-step paywall receives the configured primary routine', () => {
  assert.match(paywallScreen, /primarySessionMinutes: number;/);
  assert.match(
    paywallScreen,
    /<PaywallFreeVsProStep[\s\S]*?intent=\{planIntent\}[\s\S]*?durationMinutes=\{primarySessionMinutes\}/,
  );
});

test('the plan step keeps billing claims tied to actual trial eligibility', () => {
  assert.match(paywallScreen, /hasAnnualTrial=\{hasAnnualTrial\}/);
  assert.match(paywallScreen, /\{hasAnnualTrial \? \(/);
  assert.match(paywallScreen, /selectedPackageHasTrial\s+\? 'No Payment Due Now'/);
  assert.match(paywallScreen, /isAnnualSelected && selectedPackageHasTrial/);
});
