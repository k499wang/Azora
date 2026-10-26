import test from 'node:test';
import assert from 'node:assert/strict';

import { onboardingModeFrom } from './onboardingMode.ts';

test('the flag on selects the cleaning onboarding', () => {
  assert.equal(onboardingModeFrom(true), 'cleaning_mode');
});

test('the flag off or missing falls back to standard', () => {
  assert.equal(onboardingModeFrom(false), 'standard');
  assert.equal(onboardingModeFrom(undefined), 'standard');
});
