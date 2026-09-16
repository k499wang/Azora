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
    'name',
    'greeting',
    'age',
    'gender',
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
  // Name, age and gender are asked before the reading, so the result can say
  // where the number sits for this person rather than showing it bare.
  assertTransition('goalProof', 'onContinue', 'name', 'continue');
  assertTransition('name', 'onBack', 'goalProof', 'back');
  assertTransition('name', 'onContinue', 'greeting', 'continue');
  assertTransition('name', 'onSkip', 'greeting', 'skip');
  assertTransition('age', 'onBack', 'greeting', 'back');
  assertTransition('age', 'onContinue', 'gender', 'continue');
  assertTransition('gender', 'onBack', 'age', 'back');
  assertTransition('gender', 'onContinue', 'baselineIntro', 'continue');
  assertTransition('gender', 'onSkip', 'baselineIntro', 'skip');
  assertTransition('baselineIntro', 'onBack', 'gender', 'back');
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
  assertTransition('consistency', 'onContinue', 'scienceCredibility', 'continue');
  assertTransition('scienceCredibility', 'onBack', 'consistency', 'back');
  assertTransition('scienceCredibility', 'onContinue', 'acquisitionSource', 'continue');
  assertTransition('acquisitionSource', 'onBack', 'scienceCredibility', 'back');
  assertTransition('doctorReferral', 'onContinue', 'planIntro', 'continue');
  assertTransition('doctorReferral', 'onSkip', 'planIntro', 'skip');
  assertTransition('planIntro', 'onBack', 'doctorReferral', 'back');
});

test('Azo greets them by name right after the name is asked', () => {
  const orderSource = flow.slice(
    flow.indexOf('const STEP_ORDER'),
    flow.indexOf('const BASE_STEP_INDEX'),
  );
  const steps = [...orderSource.matchAll(/'([^']+)'/g)].map((m) => m[1]);

  assert.equal(steps.filter((step) => step === 'greeting').length, 1);
  assert.equal(steps[steps.indexOf('greeting') - 1], 'name');
  assert.equal(steps[steps.indexOf('greeting') + 1], 'age');
  // One render site, and it receives the name the user just typed.
  assert.equal(flow.split("if (step === 'greeting')").length - 1, 1);
  assert.match(
    stepBlock('greeting'),
    /<GreetingScreen[\s\S]*?name=\{name\}/,
  );
  assertTransition('greeting', 'onContinue', 'age', 'continue');
  assertTransition('greeting', 'onBack', 'name', 'back');
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

test('early baseline result reads the rate against the person who took it', () => {
  // Age and gender are asked before the reading, so the number lands with a
  // peer range instead of bare.
  assert.match(
    result,
    /describeRestingHeartRate\(\{[\s\S]*?bpm: avgBpm,[\s\S]*?age,[\s\S]*?sex: toSex\(gender\)/,
  );
  assert.match(result, /Typical for \{context\.peerLabel\}/);
  assert.match(result, /\{context\.bandLabel\}/);
  // Both inputs are required props rather than optional decoration, and the
  // flow hands over the answers it already collected.
  assert.match(result, /age: number;/);
  assert.match(result, /gender: GenderOption\['id'\] \| null;/);
  assert.match(
    flow,
    /<BaselineScreen[\s\S]*?age=\{age\}[\s\S]*?gender=\{gender\}/,
  );
  assert.match(result, /Your baseline/);
  assert.match(result, /notice changes over time/);
  // Unspecified answers stay on the gender-averaged range rather than guessing.
  assert.match(
    result,
    /function toSex\(gender: GenderOption\['id'\] \| null\): RestingHeartRateSex[\s\S]*?return 'unspecified'/,
  );
});
