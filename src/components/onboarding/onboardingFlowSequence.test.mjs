import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const flow = readFileSync(new URL('./OnboardingFlow.tsx', import.meta.url), 'utf8');
const result = readFileSync(
  new URL('./baseline/BaselineHeartRateResult.tsx', import.meta.url),
  'utf8',
);
const privacy = readFileSync(
  new URL('./screens/BaselinePrivacyScreen.tsx', import.meta.url),
  'utf8',
);

function stepBlock(step) {
  const start = flow.indexOf(`if (step === '${step}')`);
  assert.notEqual(start, -1, `onboarding has no '${step}' step`);
  const end = flow.indexOf('\n  if (step === ', start + 1);
  return flow.slice(start, end === -1 ? undefined : end);
}

function assertTransition(step, prop, target, action) {
  assert.match(
    stepBlock(step),
    new RegExp(`${prop}=\\{[\\s\\S]*?goToStep\\('${target}', '${action}'`),
    `${step}.${prop} should go to ${target} as ${action}`,
  );
}

test('heart-rate baseline follows the key onboarding questions', () => {
  const orderSource = flow.slice(
    flow.indexOf('const STEP_ORDER'),
    flow.indexOf('const BASE_STEP_INDEX'),
  );
  const steps = [...orderSource.matchAll(/'([^']+)'/g)].map((match) => match[1]);
  const sequence = [
    'azoFresh',
    'personalizeIntro',
    'support',
    'intent',
    'intentPriority',
    'intentReflection',
    'analyzeIntent',
    'goalProof',
    'baselineIntro',
    'baselinePrivacy',
    'baseline',
    'heartVariability',
    'stress',
  ];

  assert.deepEqual(
    steps.slice(steps.indexOf('azoFresh'), steps.indexOf('azoFresh') + sequence.length),
    sequence,
  );
});

test('heart-rate baseline and surrounding steps retain coherent navigation', () => {
  assertTransition('azoFresh', 'onContinue', 'personalizeIntro', 'continue');
  assertTransition('personalizeIntro', 'onBack', 'azoFresh', 'back');
  assertTransition('analyzeIntent', 'onDone', 'goalProof', 'auto');
  assert.match(
    stepBlock('goalProof'),
    /INTENT_REFLECTION_ENABLED && !isOnlyCustomIntent[\s\S]*?\? 'intentReflection'[\s\S]*?selectedIntents\.length >= 2[\s\S]*?\? 'intentPriority'[\s\S]*?: 'intent'/,
  );
  assertTransition('goalProof', 'onContinue', 'baselineIntro', 'continue');
  assertTransition('baselineIntro', 'onBack', 'goalProof', 'back');
  assertTransition('baselineIntro', 'onContinue', 'baselinePrivacy', 'continue');
  assertTransition('baselinePrivacy', 'onBack', 'baselineIntro', 'back');
  assertTransition('baselinePrivacy', 'onContinue', 'baseline', 'continue');
  assertTransition('baselinePrivacy', 'onSkip', 'heartVariability', 'skip');
  assertTransition('baseline', 'onContinue', 'heartVariability', 'continue');
  assert.match(
    stepBlock('baseline'),
    /onSkip=\{[\s\S]*?goToStep\(\s*'heartVariability',\s*attempt\.completed \? 'continue' : 'skip'/,
    'baseline.onSkip should preserve the attempt outcome when advancing',
  );
  assert.match(stepBlock('baseline'), /initialResult=\{baseline\}/);
  assert.match(stepBlock('baseline'), /onResultCaptured=\{setBaseline\}/);
  assertTransition('heartVariability', 'onContinue', 'stress', 'continue');
  assertTransition('heartVariability', 'onBack', 'baseline', 'back');
  assertTransition('heartVariability', 'onSkip', 'stress', 'skip');
  assertTransition('stress', 'onBack', 'heartVariability', 'back');
  assertTransition('consistency', 'onContinue', 'name', 'continue');
  assertTransition('name', 'onBack', 'consistency', 'back');
  assertTransition('name', 'onContinue', 'scienceCredibility', 'continue');
  assertTransition('name', 'onSkip', 'scienceCredibility', 'skip');
  assertTransition('scienceCredibility', 'onBack', 'name', 'back');
  assertTransition('gender', 'onContinue', 'acquisitionSource', 'continue');
  assertTransition('gender', 'onSkip', 'acquisitionSource', 'skip');
  assertTransition('acquisitionSource', 'onBack', 'gender', 'back');
  assertTransition('doctorReferral', 'onContinue', 'planIntro', 'continue');
  assertTransition('doctorReferral', 'onSkip', 'planIntro', 'skip');
  assertTransition('planIntro', 'onBack', 'doctorReferral', 'back');
});

test('the redundant greeting is absent from the active flow', () => {
  const orderSource = flow.slice(
    flow.indexOf('const STEP_ORDER'),
    flow.indexOf('const BASE_STEP_INDEX'),
  );

  assert.doesNotMatch(orderSource, /'greeting'/);
  assert.doesNotMatch(flow, /goToStep\(\s*'greeting'/);
  assert.doesNotMatch(flow, /if \(step === 'greeting'\)/);
  assert.doesNotMatch(flow, /import GreetingScreen/);
});

test('privacy requires explicit consent while keeping measurement optional', () => {
  assert.match(privacy, /useState\(false\)/);
  assert.match(privacy, /accessibilityRole="checkbox"/);
  assert.match(privacy, /accessibilityState=\{\{ checked: hasConsented \}\}/);
  assert.match(privacy, /disabled=\{!hasConsented\}/);
  assert.match(privacy, /accessibilityRole="link"/);
  assert.match(privacy, /https:\/\/www\.tryazora\.app\/privacy/);
  assert.match(privacy, /Measure later/);
});

test('early baseline result does not depend on demographics', () => {
  assert.doesNotMatch(result, /describeRestingHeartRate|peerLabel|typicalLow|typicalHigh/);
  assert.doesNotMatch(result, /\bage\b|\bgender\b/);
  assert.match(result, /Your baseline/);
  assert.match(result, /notice changes over time/);
});
