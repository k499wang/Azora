import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { onboardingStepOrder } from './onboardingStepOrder.ts';
import { intentFollowUpsFor } from './data/intentFollowUps.ts';

const flow = readFileSync(new URL('./OnboardingFlow.tsx', import.meta.url), 'utf8');
const cleaningSteps = (adhdStatus = null) =>
  onboardingStepOrder('cleaning', 1, intentFollowUpsFor('cleaning').length, adhdStatus, 'cleaning_mode');

test('cleaning mode asks how to help with cleaning right after the greeting, never the goal picker', () => {
  const steps = cleaningSteps();
  assert.deepEqual(steps.slice(0, 8), [
    'azoChatInvite',
    'azoChat',
    'name',
    'greeting',
    'cleaningHelp',
    'usageStyle',
    'personalizeIntro',
    'communityProof',
  ]);
  assert.equal(steps.includes('intent'), false);
  assert.equal(steps.includes('intentPriority'), false);
});

test('cleaning mode asks barriers and the toughest tidying part right after the 2x proof', () => {
  const steps = cleaningSteps();
  const proof = steps.indexOf('goalProof');
  assert.deepEqual(steps.slice(proof, proof + 3), ['goalProof', 'intentDepth2', 'intentDepth6']);
  assert.equal(intentFollowUpsFor('cleaning')[5].id, 'tidying_challenge');
  for (const depth of ['intentDepth3', 'intentDepth4', 'intentDepth5', 'intentDepth7']) {
    assert.ok(steps.includes(depth), depth);
  }
});

test('cleaning mode keeps the ADHD follow-up and ends on the usual plan section', () => {
  const steps = cleaningSteps('suspected');
  assert.equal(steps[steps.indexOf('adhdStatus') + 1], 'adhdSupport');
  assert.deepEqual(steps.slice(-2), ['pact', 'paywall']);
  assert.deepEqual(steps.slice(steps.indexOf('dailyTime'), steps.indexOf('planIntro') + 1), ['dailyTime', 'feelAtHome', 'homeAtmosphere', 'planIntro']);
});

test('every cleaning mode step renders', () => {
  for (const step of new Set(cleaningSteps('suspected'))) {
    if (step.startsWith('intentDepth') || step.startsWith('statement') || step === 'paywall') continue;
    assert.ok(flow.includes(`step === '${step}'`), `no render for '${step}'`);
  }
});

test('the personality intro leads straight into the four agree-or-disagree statements', () => {
  const steps = cleaningSteps();
  const intro = steps.indexOf('cleaningPersonalityIntro');
  assert.deepEqual(steps.slice(intro - 1, intro + 7), [
    'habitsFocusInsight',
    'cleaningPersonalityIntro',
    'statementShutDown',
    'statementDoomPile',
    'statementGaveUp',
    'statementAvoidGuests',
    'statementAvoidCleaning',
    'habitsFocusScience1',
  ]);
  assert.match(flow, /if \(isCleaningStatementStep\(step\)\)/);
});

test('cleaning mode drops the steps that do not fit a cleaning plan', () => {
  const steps = cleaningSteps();
  for (const step of ['doctorReferral', 'untappedPotential', 'sacrificeForOthers', 'intent']) {
    assert.equal(steps.includes(step), false, step);
  }
  assert.equal(steps[steps.indexOf('doingItFor') + 1], 'scienceCredibility');
});

test('standard order is unchanged by default', () => {
  assert.deepEqual(
    onboardingStepOrder('cleaning', 1, 7),
    onboardingStepOrder('cleaning', 1, 7, null, 'standard'),
  );
  assert.ok(onboardingStepOrder('cleaning', 1, 7).includes('intent'));
});
