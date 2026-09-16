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
const heartVariability = readFileSync(
  new URL('./screens/HeartVariabilityScreen.tsx', import.meta.url),
  'utf8',
);
const planLoading = readFileSync(
  new URL('./screens/PlanLoadingScreen.tsx', import.meta.url),
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

test('early baseline result shows compact age-based heart numbers', () => {
  assert.doesNotMatch(result, /context\.bandLabel|Within typical range/);
  assert.match(result, /age: number;/);
  assert.match(
    flow,
    /<BaselineScreen[\s\S]*?age=\{age\}/,
  );
  assert.match(result, /Heart Rate Measurement/);
  assert.match(
    result,
    /title="At rest"[\s\S]*?title="When you move"[\s\S]*?title="At this pace"/,
  );
  assert.doesNotMatch(result, /label="Right now"/);
  assert.match(
    result,
    /label="Asleep"[\s\S]*?~\$\{sleepingRange\.low\}–\$\{sleepingRange\.high\}/,
  );
  // Every number on the report says what it means, not just how big it is.
  assert.equal(result.match(/\n\s+note=/g)?.length, 4);
  assert.match(
    result,
    /label="Moderate effort"[\s\S]*?label="Vigorous effort"[\s\S]*?label="Estimated maximum"/,
  );
  assert.match(
    result,
    /beatsPerHour\.toLocaleString\(\)[\s\S]*?beats per hour[\s\S]*?beatsPerDay\.toLocaleString\(\)[\s\S]*?beats per day/,
  );
  assert.match(result, /Sleep and activity ranges are estimates, not personal limits\./);
});

test('the reset lesson explains the measured BPM without changing its example chart', () => {
  assert.match(
    stepBlock('heartVariability'),
    /<HeartVariabilityScreen[\s\S]*?restingBpm=\{baseline\?\.avgBpm \?\? null\}/,
  );
  assert.match(heartVariability, /restingBpm: number \| null;/);
  assert.match(
    heartVariability,
    /Your check was \$\{restingBpm\} BPM\. Two minutes of a Guided Reset pulls that number down/,
  );
  // The lesson is about the BPM the user just measured, never HRV.
  assert.doesNotMatch(heartVariability, /HRV|variability in time between/);
  assert.match(heartVariability, /const STRESS_BPM = 84;/);
  assert.match(heartVariability, /const END_BPM = 61;/);
});

test('sleep analysis echoes answers the user supplied', () => {
  const sleepAnalysis = stepBlock('analyzeSleep');
  assert.match(
    sleepAnalysis,
    /echoSingle\(SLEEP_DURATION_OPTIONS, sleepDuration\)/,
  );
  assert.match(sleepAnalysis, /echoSingle\(WAKE_EASE_OPTIONS, wakeEase\)/);
  assert.match(sleepAnalysis, /body: sleepAnswerEcho/);
});
