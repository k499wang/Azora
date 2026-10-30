import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const paywallScreen = readFileSync(join(here, 'screens', 'OnboardingPaywallScreen.tsx'), 'utf8');
const pro = readFileSync(join(here, '..', '..', 'screens', 'ProPaywallScreen.tsx'), 'utf8');
const reminderHook = readFileSync(join(here, '..', '..', 'hooks', 'usePaywallTrialReminder.ts'), 'utf8');
const reminderToggle = readFileSync(join(here, '..', 'paywall', 'PaywallTrialReminderToggle.tsx'), 'utf8');

test('the paywall shows progress until the offering resolves', () => {
  assert.match(paywallScreen, /const isOfferingPending =\s*props\.offering == null && \(props\.isLoading \|\| props\.errorMessage == null\);/);
  assert.match(paywallScreen, /if \(isOfferingPending\) \{\s*return <PaywallHold onRetry=\{props.onRetry\} onContinueWithoutPro=\{props.onContinueWithoutPro\} loadingRecoveryAvailable=\{props.loadingRecoveryAvailable\} \/>;\s*\}/);
});

test('standalone upgrades open the shared compact plan screen', () => {
  assert.match(pro, /<OnboardingPaywallScreen\s+initialStep="plan"/);
  for (const source of [paywallScreen, pro]) {
    assert.doesNotMatch(source, /PaywallLongForm|LongFormPaywall|PaywallTrayPlans/);
  }
  assert.equal((pro.match(/usePaywall\(\{/g) ?? []).length, 1);
  assert.match(pro, /const personalizationUserId = paywall\.offering\?\.paywallLayout === 'deck' \? null : userId;/);
  assert.match(pro, /useSavedOnboardingProfileQuery\(\s*personalizationUserId/);
  assert.match(pro, /useProgramEnrollmentQuery\(personalizationUserId\)/);
  assert.match(paywallScreen, /return <TrialDeck \{\.\.\.props\} \/>;/);
});

test('standalone upgrades leave the entrance to the native slide', () => {
  const navigator = readFileSync(join(here, '..', '..', 'app', 'navigation', 'RootNavigator.tsx'), 'utf8');
  assert.match(navigator, /name="ProPaywall"[\s\S]{0,220}animation: 'slide_from_bottom'/);
  assert.match(paywallScreen, /new Animated.Value\(initialStep === 'plan' \? 1 : 0\)/);
  assert.match(paywallScreen, /hasStartedEntranceRef = useRef\(initialStep === 'plan'\)/);
});

test('trial introductions require eligibility and standalone upgrades skip them', () => {
  assert.match(paywallScreen, /const TRIAL_STEPS: PaywallStepKey\[\] = \['benefits', 'reminder', 'plan'\];/);
  assert.match(paywallScreen, /hasAnnualTrial && initialStep !== 'plan'/);
  assert.match(paywallScreen, /\? TRIAL_STEPS\s*:\s*\['plan'\]/);
  assert.match(paywallScreen, /<PaywallTrialStep\s+hasAnnualTrial=\{selectedPackageHasTrial\}/);
  assert.match(paywallScreen, /hasAnnualTrial \? \([\s\S]{0,160}<PaywallTrialReminderControl/);
  assert.match(paywallScreen, /isAnnualSelected && selectedPackageHasTrial\s*\? `Redeem \$\{selectedTrialDays\} days for \$0\.00`/);
  assert.match(paywallScreen, /selectedPackageHasTrial\s*\? `\$\{selectedTrialDays\} days free, then`/);
  assert.match(paywallScreen, /No commitment, cancel anytime[\s\S]{0,400}label={ctaLabel}[\s\S]{0,400}priceSummaryText/);
});

test('blocking upgrades prevent dismissal until a purchase or restore succeeds', () => {
  assert.match(pro, /gestureEnabled: !isBlocking/);
  assert.match(pro, /if \(!isBlocking\) return;\s*return navigation\.addListener\('beforeRemove', \(event\) => \{\s*if \(!allowDismissRef\.current\) event\.preventDefault\(\);/);
  assert.match(pro, /allowDismissRef\.current = true;\s*navigation\.goBack\(\);/);
  assert.match(pro, /result\.status === 'purchased' && result\.isPro\) \{\s*setWelcome\(/);
  assert.match(pro, /<ProWelcome[\s\S]{0,160}onContinue=\{finishPurchase\}/);
  assert.match(pro, /result\.status === 'restored' && result\.isPro\) finishPurchase\(\)/);
  assert.match(pro, /onOfferPurchased=\{\(\) => setWelcome\(\{ trialDays: null \}\)\}/);
  assert.match(pro, /paywallMode=\{isBlocking \? 'hard'/);
  assert.match(pro, /onContinueWithoutPro=\{isBlocking \? undefined : continueWithoutPro\}/);
  assert.match(pro, /if \(isBlocking \|\| paywall\.isLoading \|\| paywall\.isPurchasing \|\| paywall\.isRestoring\) return;\s*paywall\.trackDismissed\(\);/);
});

test('preview keeps trial reminders local and does not load alternate offerings', () => {
  assert.equal((paywallScreen.match(/usePaywallTrialReminder\(preview\)/g) ?? []).length, 1);
  assert.match(reminderHook, /useNotificationPreferencesQuery\(preview \? null : userId\)/);
  assert.match(paywallScreen, /<PaywallTrialReminderControl\s+reminder=\{finalReminder\}/);
  assert.match(reminderToggle, /const reminder = usePaywallTrialReminder\(preview\)/);
});

test('compact steps reset scroll only when a transition commits', () => {
  assert.match(paywallScreen, /const stepScrollRef = useRef<ScrollView>\(null\);/);
  assert.match(paywallScreen, /stepRef\.current = next;\s*stepScrollRef\.current\?\.scrollTo\(\{ y: 0, animated: false \}\);\s*setStep\(next\);/);
  assert.match(paywallScreen, /<ScrollView\s+ref=\{stepScrollRef\}[\s\S]{0,220}scrollEnabled/);
  assert.match(paywallScreen, /stepTransitionRef\.current\?\.stop\(\);/);
});

test('purchases charge the package chosen on the compact screen', () => {
  const flow = readFileSync(join(here, 'OnboardingFlow.tsx'), 'utf8');
  for (const source of [flow, pro]) {
    assert.match(source, /paywall\.purchaseSelectedPackage\(packageId\)/);
  }
});

test('the final compact step reports when its offer is reached', () => {
  assert.match(paywallScreen, /if \(isFinal\) onOfferReached\?\.\(\);/);
});
