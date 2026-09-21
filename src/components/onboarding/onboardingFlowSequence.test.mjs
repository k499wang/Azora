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
const intentFollowUps = readFileSync(
  new URL('./data/intentFollowUps.ts', import.meta.url),
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
    'intentDepth1',
    'intentDepth2',
    'intentDepth3',
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
    'heartWorry',
  ];

  assert.deepEqual(
    steps.slice(steps.indexOf('azoFresh'), steps.indexOf('azoFresh') + sequence.length),
    sequence,
  );
});

test('heart-rate baseline and surrounding steps retain coherent navigation', () => {
  assertTransition('azoFresh', 'onContinue', 'personalizeIntro', 'continue');
  assertTransition('personalizeIntro', 'onBack', 'azoFresh', 'back');
  // What the app costs is said once, before the questions rather than after
  // the plan they produce.
  assertTransition('personalizeIntro', 'onContinue', 'support', 'continue');
  assertTransition('support', 'onBack', 'personalizeIntro', 'back');
  assertTransition('support', 'onContinue', 'intent', 'continue');
  assertTransition('analyzeIntent', 'onDone', 'goalProof', 'auto');
  // The goal is asked about three more times before the flow moves on, so the
  // proof screen steps back into the last of them.
  assertTransition('goalProof', 'onBack', 'intentDepth3', 'back');
  assert.match(
    flow,
    /INTENT_DEPTH_STEPS = \[\s*'intentDepth1',\s*'intentDepth2',\s*'intentDepth3',/,
  );
  assert.match(
    flow,
    /intentFollowUps\[followUpIndex\]/,
    'the depth screens read their question from the chosen intent',
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
  assertTransition('heartVariability', 'onContinue', 'heartWorry', 'continue');
  assertTransition('heartVariability', 'onBack', 'baseline', 'back');
  assertTransition('heartVariability', 'onSkip', 'heartWorry', 'skip');
  // Each subject is asked in one run: the heart module ends on heartWorry, and
  // the load module opens on stress.
  assertTransition('heartWorry', 'onBack', 'heartVariability', 'back');
  assertTransition('heartWorry', 'onContinue', 'stress', 'continue');
  assertTransition('stress', 'onBack', 'heartWorry', 'back');
  assertTransition('mentalHealth', 'onContinue', 'analyzeLoad', 'continue');
  assertTransition('halfway', 'onContinue', 'sleep', 'continue');
  // The sleep module asks why, not just how it goes.
  assertTransition('wakeEase', 'onContinue', 'sleepCause', 'continue');
  assertTransition('sleepCause', 'onContinue', 'analyzeSleep', 'continue');
  assertTransition('sleepCause', 'onBack', 'wakeEase', 'back');
  assertTransition('sleepInsight', 'onContinue', 'dayActivity', 'continue');
  assertTransition('procrastinationReason', 'onContinue', 'analyzeDays', 'continue');
  // Every module closes on its own summary of what was just answered.
  assertTransition('analyzeDays', 'onDone', 'consistency', 'auto');
  assertTransition('consistency', 'onContinue', 'scienceCredibility', 'continue');
  assertTransition('scienceCredibility', 'onBack', 'consistency', 'back');
  assertTransition('scienceCredibility', 'onContinue', 'acquisitionSource', 'continue');
  assertTransition('acquisitionSource', 'onBack', 'scienceCredibility', 'back');
  assertTransition('doctorReferral', 'onContinue', 'planIntro', 'continue');
  assertTransition('doctorReferral', 'onSkip', 'planIntro', 'skip');
  assertTransition('planIntro', 'onBack', 'doctorReferral', 'back');
});

test('the plan is followed by the case for keeping it', () => {
  const orderSource = flow.slice(
    flow.indexOf('const STEP_ORDER'),
    flow.indexOf('const BASE_STEP_INDEX'),
  );
  // Line-anchored, because an apostrophe inside one of the comments in
  // STEP_ORDER flips the parity of a naive quoted-string match.
  const steps = [...orderSource.matchAll(/^\s{2}'([^']+)',$/gm)].map(
    (match) => match[1],
  );
  const run = [
    'recommendedExercise',
    'habitCurve',
    'mochiPlace',
  ];

  assert.deepEqual(
    steps.slice(
      steps.indexOf('recommendedExercise'),
      steps.indexOf('recommendedExercise') + run.length,
    ),
    run,
  );

  // The plan page hands straight into the proof screen, which hands into the
  // room, so stepping back through it never skips a screen.
  assert.match(
    flow,
    /const continueFromStarterPlan = \(\) => \{\s*goToStep\('habitCurve', 'continue'/,
  );
  assertTransition('habitCurve', 'onBack', 'recommendedExercise', 'back');
  assertTransition('habitCurve', 'onContinue', 'mochiPlace', 'continue');
  assertTransition('mochiPlace', 'onBack', 'habitCurve', 'back');
});

test('the reset mechanism is taught on the back of the brain lesson', () => {
  const orderSource = flow.slice(
    flow.indexOf('const STEP_ORDER'),
    flow.indexOf('const BASE_STEP_INDEX'),
  );
  const steps = [...orderSource.matchAll(/^\s{2}'([^']+)',$/gm)].map(
    (match) => match[1],
  );

  assert.equal(steps[steps.indexOf('resetScience') - 1], 'brainScience');
  assert.equal(steps[steps.indexOf('resetScience') + 1], 'mentalHealth');
  assertTransition('brainScience', 'onContinue', 'resetScience', 'continue');
  assertTransition('resetScience', 'onBack', 'brainScience', 'back');
  assertTransition('resetScience', 'onContinue', 'mentalHealth', 'continue');
  assertTransition('mentalHealth', 'onBack', 'resetScience', 'back');
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

test('the breathing lesson states its claim without reading back the measurement', () => {
  // The chart carries the heart rate on its own axis. The copy above it is
  // about what the user feels, so neither line restates the measurement, and
  // the chart is an example, never the BPM they measured two steps back.
  assert.match(heartVariability, /title="Azora helps your body slow down under stress\."/);
  assert.match(heartVariability, /subtitle="Its slow breathing exercises can help lower your heart rate and activate your body’s calming response\."/);
  assert.doesNotMatch(
    heartVariability,
    /(title|subtitle)="[^"]*(BPM|pulse)/i,
  );
  assert.doesNotMatch(heartVariability, /restingBpm/);
  assert.doesNotMatch(stepBlock('heartVariability'), /restingBpm/);
  // The lesson is about heart rate, never HRV.
  assert.doesNotMatch(heartVariability, /HRV|variability in time between/);
  assert.match(heartVariability, /const STRESS_BPM = 84;/);
  assert.match(heartVariability, /const END_BPM = 61;/);
});

test('the assessment answers reach the plan, not just the analyze screens', () => {
  assert.match(
    flow,
    /computeMindMap\(\{[\s\S]*?brainFogLevel: hasAnsweredBrainFog \? brainFogLevel : undefined,[\s\S]*?strains: \[[\s\S]*?\.\.\.mentalHealth,[\s\S]*?\.\.\.procrastinationReasons,/,
  );
});

test('sleep analysis echoes answers the user supplied', () => {
  const sleepAnalysis = stepBlock('analyzeSleep');
  assert.match(
    sleepAnalysis,
    /echoSingle\(SLEEP_DURATION_OPTIONS, sleepDuration\)/,
  );
  assert.match(sleepAnalysis, /echoSingle\(WAKE_EASE_OPTIONS, wakeEase\)/);
  assert.match(sleepAnalysis, /echoSingle\(SLEEP_CAUSE_OPTIONS, sleepCause\)/);
  assert.match(sleepAnalysis, /body: sleepAnswerEcho/);
});

test('every intent follow-up answer carries a picture and a fragment to quote', () => {
  const rows = [...intentFollowUps.matchAll(/^\s+\[(.+)\],$/gm)].map((m) => m[1]);
  assert.ok(rows.length > 20, 'expected the follow-up option tables');
  for (const row of rows) {
    // id, title, echo, icon — an option missing one of them would render as a
    // bare row, or go unquoted on the screen that says the answer back.
    assert.equal(
      row.split("', '").length,
      4,
      `follow-up option is not [id, title, echo, icon]: ${row}`,
    );
  }
});

test('the follow-up answers are kept, not just counted', () => {
  assert.match(flow, /acc\[`intent_\$\{question\.id\}`\] = chosen\.length > 0/);
  assert.match(flow, /\.\.\.intentFollowUpProperties\(\),/);
});

test('every goal has its own three beats, none of them the generic fallback', () => {
  const types = readFileSync(new URL('./types.ts', import.meta.url), 'utf8');
  const union = types.slice(
    types.indexOf('export type OnboardingIntent ='),
    types.indexOf(';', types.indexOf('export type OnboardingIntent =')),
  );
  const goals = [...union.matchAll(/'([a-z_]+)'/g)]
    .map((match) => match[1])
    .filter((id) => id !== 'other');
  assert.ok(goals.length >= 12, 'expected the goal list from types.ts');

  for (const goal of goals) {
    const start = intentFollowUps.indexOf(`\n  ${goal}: {\n`);
    assert.notEqual(start, -1, `${goal} has no follow-up triad of its own`);
    const block = intentFollowUps.slice(start, intentFollowUps.indexOf('\n  },\n', start));
    // where / tried / stakes, in that order — a goal missing one would fall a
    // screen short and leave the analyze screen with nothing to quote.
    for (const beat of ['where: where(', 'tried: tried(', 'stakes: stakes(']) {
      assert.ok(block.includes(beat), `${goal} is missing its ${beat} beat`);
    }
  }
});

test('the beat the analyze screen quotes never restates the goal back at itself', () => {
  // "shaped to help you sleep better, and to give you back your sleep" is the
  // failure this guards: a stakes row that is the goal the user just chose.
  const circular = {
    sleep: /\['sleep',/,
    focus: /\['focus',/,
    heart_health: /\['health',/,
    stress_relief: /\['stress',/,
  };
  for (const [goal, row] of Object.entries(circular)) {
    const start = intentFollowUps.indexOf(`\n  ${goal}: {\n`);
    const block = intentFollowUps.slice(start, intentFollowUps.indexOf('\n  },\n', start));
    const stakesBlock = block.slice(block.indexOf('stakes: stakes('));
    assert.ok(!row.test(stakesBlock), `${goal} offers its own goal as a stake`);
  }
});

test('every stakes beat carries the clause the analyze screen says before it', () => {
  const leads = [...intentFollowUps.matchAll(/stakes: stakes\(\s*'[a-z_]+',\s*'[^']+',\s*([A-Z_]+),/g)];
  assert.ok(leads.length >= 13, 'expected a lead-in on every stakes question');
  for (const [, lead] of leads) {
    assert.ok(['TAKEN_BACK', 'GIVEN'].includes(lead), `unknown lead-in ${lead}`);
  }
  assert.match(flow, /stakesQuestion\.echoLead \?\? 'and to give you back'/);
  assert.match(flow, /\$\{goalPhrase\}, \$\{stakesLead\} \$\{stakesEcho\}/);
});
