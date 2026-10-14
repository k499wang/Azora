import assert from 'node:assert/strict';
import test from 'node:test';
import { adjacentOnboardingStep, onboardingStepOrder } from './onboardingStepOrder.ts';

test('the ADHD screen follows the diagnosis question only when ADHD was picked', () => {
  const without = onboardingStepOrder('focus', 1, 3, false);
  assert.equal(without.includes('adhdSupport'), false);
  const withAdhd = onboardingStepOrder('focus', 1, 3, true);
  assert.equal(adjacentOnboardingStep(withAdhd, 'mentalHealth', 'forward'), 'adhdSupport');
  assert.equal(adjacentOnboardingStep(withAdhd, 'adhdSupport', 'forward'), 'homeAtmosphere');
  assert.equal(withAdhd.length, without.length + 1);
});
