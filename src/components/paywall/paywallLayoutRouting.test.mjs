import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '..', '..');
const read = (...parts) => readFileSync(join(src, ...parts), 'utf8');

const paywallScreen = read('components', 'onboarding', 'screens', 'OnboardingPaywallScreen.tsx');
const service = read('services', 'paywall', 'paywallService.ts');
const clientCore = read('services', 'subscriptions', 'revenueCatClientCore.ts');
const flow = read('components', 'onboarding', 'OnboardingFlow.tsx');
const pro = read('screens', 'ProPaywallScreen.tsx');
const longPage = read('components', 'paywall', 'NoTrialLongPaywall.tsx');

test('the layout is read from the offering metadata and defaults to the deck', () => {
  assert.match(
    service,
    /value === 'long' \|\| value === 'long_then_trial' \? value : 'deck'/,
  );
});

test('only a long offering swaps the deck for the long page', () => {
  const longIndex = paywallScreen.search(
    /if \(props\.offering\?\.paywallLayout === 'long'\) \{\s*return <NoTrialLongPaywall \{\.\.\.props\} \/>;\s*\}/,
  );
  const deckIndex = paywallScreen.indexOf('return <TrialDeck {...props} />;');
  assert.ok(longIndex > 0, 'router checks paywallLayout');
  assert.ok(deckIndex > longIndex, 'deck is the fallback after the layout check');
});

test('onboarding and in-app paywalls ask RevenueCat for different placements', () => {
  assert.match(flow, /usePaywall\(\{\s*placement: PaywallPlacement\.OnboardingComplete/);
  assert.match(flow, /<OnboardingPaywallScreen/);
  assert.match(pro, /placement: route\.params\?\.placement \?\? PaywallPlacement\.ProfileUpgrade/);
  assert.match(pro, /<OnboardingPaywallScreen/);
});

test('each placement resolves its own offering and cache entry', () => {
  assert.match(clientCore, /getCurrentOfferingForPlacement\(placement\)/);
  assert.match(service, /offeringCacheKey\(placement, offeringIdentifier\)/);
  assert.match(service, /`\$\{appUserId\}:\$\{placement\}`/);
});

test('the long page switches to trial copy only when the package has a trial', () => {
  assert.match(longPage, /const title = trialDays != null \? `\$\{trialDays\}-day trial` : pkg\.title;/);
  assert.match(longPage, /const introductoryPrice = hasTrial \? 'Free' : intro\?\.priceString;/);
  assert.match(longPage, /selectedTrialDays != null \? `Redeem \$\{selectedTrialDays\}-day trial`/);
});

test('the plan picker is read from offering metadata and defaults to stacked', () => {
  assert.match(service, /planPicker: toPlanPicker\(getMetadataString\(offering\.metadata, 'plan_picker'\)\)/);
  assert.match(service, /value === 'side_by_side' \? value : 'stacked'/);
  assert.match(paywallScreen, /planPicker=\{offering\?\.planPicker \?\? 'stacked'\}/);
});
