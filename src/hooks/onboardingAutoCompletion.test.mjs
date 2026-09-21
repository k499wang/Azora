import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./useAppGate.ts', import.meta.url), 'utf8');
const start = source.indexOf('const shouldStartAutoCompleteOnboarding =');
const condition = source.slice(source.indexOf('=', start) + 1, source.indexOf(';', start));

function shouldAutoComplete(activeSaveUserId, profile = {}) {
  const dependencies = {
    onboardingStatusQuery: { data: false },
    savedOnboardingProfileQuery: { data: profile },
    entitlementQuery: { data: { isPro: true } },
    isCompletingOnboarding: false,
    userId: 'user',
    activeOnboardingSaveUserRef: { current: activeSaveUserId },
    autoCompleteAttemptedRef: { current: null },
    autoCompleteFailedForUserId: null,
  };
  return new Function(...Object.keys(dependencies), `return (${condition});`)(
    ...Object.values(dependencies),
  );
}

test('saving a profile in the active onboarding cannot auto-complete before its todos', () => {
  assert.equal(shouldAutoComplete(null, null), false);
  assert.equal(shouldAutoComplete('user'), false);
  assert.match(source, /async \(input\) => \{\s*activeOnboardingSaveUserRef\.current = userId;\s*await saveOnboardingProfileMutation\.mutateAsync\(input\);/);
});

test('an existing Pro profile still auto-completes when resumed', () => {
  assert.equal(shouldAutoComplete(null), true);
  assert.equal(shouldAutoComplete('another-user'), true);
});
