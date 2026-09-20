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

test('the paywall holds a quiet screen until the offering resolves', () => {
  assert.match(paywallScreen, /const showFreeTrialIntro = true;/);
  assert.match(paywallScreen, /hasTrial=\{showFreeTrialIntro\}/);
  // Which page is shown is decided from the offering, and a missing offering is
  // not an answer: neither page mounts until one arrives or loading fails, so
  // the free-trial deck can never flash after the seal and then swap for the
  // page. A pending answer is no offering and no error — the shared hook reads
  // "not loading" on the first frame because its fetch starts on mount.
  assert.match(paywallScreen, /const hasOffering = props\.offering != null;/);
  assert.match(
    paywallScreen,
    /const isOfferingPending =\s*props\.offering == null && \(props\.isLoading \|\| props\.errorMessage == null\);/,
  );
  assert.match(paywallScreen, /if \(isOfferingPending\) \{\s*return <PaywallHold \/>;\s*\}/);
  assert.match(
    paywallScreen,
    /hasOffering && \(!hasAnnualTrial \|\| isHardPaywall\)[\s\S]{0,80}<LongFormPaywall/,
  );
});

test('only a soft trial steps; every other paywall is one scrolling page', () => {
  assert.match(paywallScreen, /return <TrialDeck \{\.\.\.props\} \/>;/);
  assert.match(paywallScreen, /const isHardPaywall = props\.paywallMode === 'hard';/);

  // The deck is reached by a soft trial and nothing else, so its step list is
  // fixed: the Free/Pro table has a free tier to compare against here.
  assert.match(
    paywallScreen,
    /const TRIAL_STEPS: PaywallStepKey\[\] = \['benefits', 'comparison', 'hero', 'plan'\];/,
  );
  assert.doesNotMatch(paywallScreen, /HARD_PAYWALL_STEPS/);

  // The page is the no-trial path and the hard path, and the plan cards in the
  // tray are its only buy control, visible the whole way down; nothing on the
  // page itself charges anybody.
  assert.match(paywallScreen, /<PaywallLongForm/);
  assert.equal((paywallScreen.match(/<PaywallTrayPlans/g) ?? []).length, 1);
  assert.doesNotMatch(longForm, /ChunkyButton|PrimaryButton|PlanCard/);
});

test('both pages explain how the plan works, as a section', () => {
  const trialStep = readFileSync(
    join(here, 'paywall', 'PaywallTrialStep.tsx'),
    'utf8',
  );
  const pro = readFileSync(
    join(here, '..', '..', 'screens', 'ProPaywallScreen.tsx'),
    'utf8',
  );

  // The same timeline the deck's plan step draws, given a page heading instead.
  assert.match(
    trialStep,
    /<PaywallSection title="How Your Plan Works" singleLineTitle>/,
  );
  assert.match(
    trialStep,
    /<Timeline steps=\{steps\} showTrialTail=\{hasAnnualTrial\} layout="section" \/>/,
  );
  assert.match(trialStep, /layout === 'section' && styles\.timelineSection/);

  // Both pages hand it to the shared long form as a section, above the
  // reserved-plan card — and only when there is a trial, because a timeline of
  // when a plan bills has nothing to say without one.
  for (const source of [paywallScreen, pro]) {
    assert.match(
      source,
      /howItWorks=\{\s*hasAnnualTrial \? \([\s\S]{0,260}layout="section"/,
    );
  }
  // Ordered: how the plan runs, the reminder control that belongs to it, then
  // what is in it.
  const order = ['{howItWorks}', '{trialReminder}', '{comparison}'].map((token) =>
    longForm.indexOf(token),
  );
  assert.ok(
    order.every(
      (index, position) => index > 0 && (position === 0 || index > order[position - 1]),
    ),
    'the timeline leads, its reminder follows, then the Free/Pro table',
  );
});

test('the comparison is a page section, and not every row is a free yes', () => {
  const comparison = readFileSync(
    join(here, 'paywall', 'PaywallFreeVsProStep.tsx'),
    'utf8',
  );

  // The same table is a deck step and a page section: on the long page it takes
  // the page's heading, the gap that goes with it, and a heading that stays on
  // one line rather than pushing the table down.
  assert.match(paywallScreen, /layout="section"/);
  assert.match(comparison, /<PaywallSection title=\{title\} singleLineTitle>/);

  // The routine the plan is built from is the thing being sold, so it is not a
  // free-column yes.
  assert.match(
    comparison,
    /\{ label: personalizedRoutineLabel\(intent, durationMinutes\), free: null \}/,
  );
});

test('the standalone paywall carries the same comparison section', () => {
  const pro = readFileSync(
    join(here, '..', '..', 'screens', 'ProPaywallScreen.tsx'),
    'utf8',
  );

  assert.match(pro, /<PaywallFreeVsProStep/);
  assert.match(pro, /layout="section"/);
  // Same rule as onboarding's page: a hard paywall has no free tier to show.
  assert.match(pro, /paywall\.offering\?\.paywallMode !== 'hard'/);
});

test('the page receives the plan it is selling', () => {
  assert.match(paywallScreen, /primarySessionMinutes: number;/);
  assert.match(paywallScreen, /intent=\{planIntent \?\? 'stress_relief'\}/);
  assert.match(paywallScreen, /sessionMinutes=\{primarySessionMinutes\}/);
});

test('a hard paywall drops the Free vs Pro comparison', () => {
  const flow = readFileSync(join(here, 'OnboardingFlow.tsx'), 'utf8');

  // Onboarding passes the mode itself; the screen decides what to show from it,
  // because it also decides which page to render.
  assert.match(flow, /paywallMode=\{paywallMode\}/);
  assert.match(paywallScreen, /const showPlanComparison = paywallMode !== 'hard';/);
  assert.match(
    paywallScreen,
    /comparison=\{\s*showPlanComparison \? \(/,
  );
});

test('billing claims stay tied to actual trial eligibility', () => {
  // The deck only exists because there is a trial, so its footer follows the
  // package being bought rather than the plan.
  assert.match(paywallScreen, /selectedPackageHasTrial\s+\? 'No Payment Due Now'/);
  assert.match(paywallScreen, /: 'Cancel Anytime In Seconds'/);

  // The page follows the plan it is selling: a trial gets the free-week
  // footnote and "no payment due now", a plan without one promises the refund.
  assert.match(paywallScreen, /hasTrial=\{hasAnnualTrial\}/);
  assert.match(paywallScreen, /'No Payment Due Now'/);
  assert.match(paywallScreen, /30-Day Money-Back Guarantee/);
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
