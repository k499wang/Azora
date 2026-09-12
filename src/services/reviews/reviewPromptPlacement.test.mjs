import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ONBOARDING_FLOW = readFileSync(
  new URL('../../components/onboarding/OnboardingFlow.tsx', import.meta.url),
  'utf8',
);
const STORE_REVIEW = readFileSync(
  new URL('./storeReview.ts', import.meta.url),
  'utf8',
);
const USE_PAYWALL = readFileSync(
  new URL('../../hooks/usePaywall.ts', import.meta.url),
  'utf8',
);

function stepBlock(step) {
  const start = ONBOARDING_FLOW.indexOf(`if (step === '${step}')`);
  assert.notEqual(start, -1, `onboarding has no '${step}' step`);
  const end = ONBOARDING_FLOW.indexOf('\n  if (step === ', start + 1);
  return ONBOARDING_FLOW.slice(start, end === -1 ? undefined : end);
}

test('onboarding asks for a review only after a real baseline reading', () => {
  const calls = ONBOARDING_FLOW.match(/requestStoreReview\(/g) ?? [];
  assert.equal(calls.length, 1, 'exactly one review request in onboarding');

  const diagnosis = stepBlock('diagnosis');
  assert.match(diagnosis, /requestStoreReview\(ReviewTrigger\.OnboardingBaseline\)/);
  assert.match(
    diagnosis,
    /if \(baseline != null\)/,
    'the request must be gated on a captured baseline',
  );
});

test('the permission steps never chase a system dialog with the review sheet', () => {
  // Asking for five stars right after ATT or a notification prompt trains the
  // dismiss reflex, and the skip path asks a user who just declined.
  for (const step of ['attPriming', 'notifications']) {
    assert.doesNotMatch(
      stepBlock(step),
      /requestStoreReview/,
      `'${step}' must not request a review`,
    );
  }

  // The notification handlers live above the step blocks, so bound the search
  // at the first one rather than sweeping the imports too.
  const handlers = ONBOARDING_FLOW.slice(
    ONBOARDING_FLOW.indexOf('const enableNotifications'),
    ONBOARDING_FLOW.indexOf('const stepIndex ='),
  );
  assert.notEqual(handlers.length, 0, 'notification handlers not found');
  assert.doesNotMatch(
    handlers,
    /requestStoreReview/,
    'no review request in the notification submit or skip handlers',
  );
});

test('every review request waits for the screen to settle', () => {
  assert.match(
    STORE_REVIEW,
    /await delay\(PROMPT_DELAY_MS\);\s*\n\s*await StoreReview\.requestReview\(\);/,
    'the settle delay belongs immediately before the native call',
  );
});

test('paywall dismissals are recorded so the cooldown can see them', () => {
  const dismissed = USE_PAYWALL.slice(USE_PAYWALL.indexOf('const trackDismissed'));
  assert.match(dismissed.slice(0, 400), /markPaywallDismissed\(\)/);
});
