import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const flow = readFileSync(new URL('./OnboardingFlow.tsx', import.meta.url), 'utf8');
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

test('focus and habits follow the greeting', () => {
  const orderSource = flow.slice(
    flow.indexOf('const STEP_ORDER'),
    flow.indexOf('const BASE_STEP_INDEX'),
  );
  const steps = [...orderSource.matchAll(/'([^']+)'/g)].map((match) => match[1]);
  const sequence = [
    'azoFresh',
    'azoTogether',
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
    'dayActivity',
  ];

  assert.deepEqual(
    steps.slice(steps.indexOf('azoFresh'), steps.indexOf('azoFresh') + sequence.length),
    sequence,
  );
});

test('onboarding steps retain coherent navigation', () => {
  assertTransition('azoBusy', 'onContinue', 'azoFresh', 'continue');
  assertTransition('azoFresh', 'onBack', 'azoBusy', 'back');
  assertTransition('azoFresh', 'onContinue', 'azoTogether', 'continue');
  assertTransition('azoTogether', 'onBack', 'azoFresh', 'back');
  assertTransition('azoTogether', 'onContinue', 'personalizeIntro', 'continue');
  assertTransition('personalizeIntro', 'onBack', 'azoTogether', 'back');
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
  assertTransition('goalProof', 'onContinue', 'name', 'continue');
  assertTransition('name', 'onBack', 'goalProof', 'back');
  assertTransition('name', 'onContinue', 'greeting', 'continue');
  assertTransition('name', 'onSkip', 'greeting', 'skip');
  // Focus and habits, then sleep, then the load they carry.
  assertTransition('greeting', 'onContinue', 'dayActivity', 'continue');
  assertTransition('dayActivity', 'onBack', 'greeting', 'back');
  assertTransition('sleepInsight', 'onContinue', 'age', 'continue');
  assertTransition('age', 'onBack', 'sleepInsight', 'back');
  assertTransition('sleepInsight', 'onBack', 'sleepCause', 'back');
  assertTransition('age', 'onContinue', 'gender', 'continue');
  assertTransition('gender', 'onBack', 'age', 'back');
  assertTransition('gender', 'onContinue', 'heartVariability', 'continue');
  assertTransition('gender', 'onSkip', 'heartVariability', 'skip');
  assertTransition('heartVariability', 'onContinue', 'stressSignal', 'continue');
  assertTransition('heartVariability', 'onBack', 'gender', 'back');
  assertTransition('heartVariability', 'onSkip', 'stressSignal', 'skip');
  assertTransition('stressSignal', 'onContinue', 'stress', 'continue');
  assertTransition('stressSignal', 'onBack', 'heartVariability', 'back');
  assertTransition('stress', 'onBack', 'stressSignal', 'back');
  assertTransition('stress', 'onContinue', 'supportSystem', 'continue');
  assertTransition('stress', 'onSkip', 'supportSystem', 'skip');
  assertTransition('supportSystem', 'onBack', 'stress', 'back');
  assertTransition('supportSystem', 'onContinue', 'brainFog', 'continue');
  assertTransition('supportSystem', 'onSkip', 'brainFog', 'skip');
  assertTransition('brainFog', 'onBack', 'supportSystem', 'back');
  assertTransition('mentalHealth', 'onContinue', 'analyzeLoad', 'continue');
  assertTransition('halfway', 'onContinue', 'sleep', 'continue');
  // The sleep module asks why, not just how it goes.
  assertTransition('wakeEase', 'onContinue', 'dayEnergy', 'continue');
  assertTransition('dayEnergy', 'onBack', 'wakeEase', 'back');
  assertTransition('dayEnergy', 'onContinue', 'sleepCause', 'continue');
  assertTransition('dayEnergy', 'onSkip', 'sleepCause', 'skip');
  assertTransition('sleepCause', 'onContinue', 'analyzeSleep', 'continue');
  assertTransition('sleepCause', 'onBack', 'dayEnergy', 'back');
  assertTransition('routineHappiness', 'onContinue', 'beforeAfter', 'continue');
  assertTransition('routineHappiness', 'onSkip', 'beforeAfter', 'skip');
  assertTransition('beforeAfter', 'onBack', 'routineHappiness', 'back');
  assertTransition('beforeAfter', 'onContinue', 'choresOverwhelm', 'continue');
  assertTransition('choresOverwhelm', 'onBack', 'beforeAfter', 'back');
  assertTransition('choresOverwhelm', 'onContinue', 'distraction', 'continue');
  assertTransition('distraction', 'onBack', 'choresOverwhelm', 'back');
  assertTransition('distraction', 'onContinue', 'socialMedia', 'continue');
  assertTransition('socialMedia', 'onBack', 'distraction', 'back');
  assertTransition('socialMedia', 'onContinue', 'procrastinationArea', 'continue');
  assertTransition('procrastinationArea', 'onBack', 'socialMedia', 'back');
  assertTransition('procrastinationReason', 'onContinue', 'analyzeDays', 'continue');
  // Every module closes on its own summary of what was just answered.
  assertTransition('analyzeDays', 'onDone', 'habitsFocusInsight', 'auto');
  assertTransition('habitsFocusInsight', 'onBack', 'procrastinationReason', 'back');
  assertTransition('habitsFocusInsight', 'onContinue', 'habitsFocusScience1', 'continue');
  assertTransition('habitsFocusScience1', 'onBack', 'habitsFocusInsight', 'back');
  assertTransition('habitsFocusScience1', 'onContinue', 'habitsFocusScience2', 'continue');
  assertTransition('habitsFocusScience2', 'onBack', 'habitsFocusScience1', 'back');
  assertTransition('habitsFocusScience2', 'onContinue', 'habitsFocusScience3', 'continue');
  assertTransition('habitsFocusScience3', 'onBack', 'habitsFocusScience2', 'back');
  assertTransition('habitsFocusScience3', 'onContinue', 'consistency', 'continue');
  assertTransition('consistency', 'onBack', 'habitsFocusScience3', 'back');
  assertTransition('consistency', 'onContinue', 'scienceCredibility', 'continue');
  assertTransition('scienceCredibility', 'onBack', 'consistency', 'back');
  assertTransition('scienceCredibility', 'onContinue', 'halfway', 'continue');
  assertTransition('halfway', 'onBack', 'scienceCredibility', 'back');
  assertTransition('analyzeLoad', 'onDone', 'homeFeeling', 'auto');
  assertTransition('homeFeeling', 'onBack', 'mentalHealth', 'back');
  assertTransition('homeFeeling', 'onContinue', 'acquisitionSource', 'continue');
  assertTransition('homeFeeling', 'onSkip', 'acquisitionSource', 'skip');
  assertTransition('acquisitionSource', 'onBack', 'homeFeeling', 'back');
  // The house goal follows the rooms, before the permission asks.
  assertTransition('mochiRooms', 'onContinue', 'mochiHouse', 'continue');
  assertTransition('mochiHouse', 'onBack', 'mochiRooms', 'back');
  assertTransition('mochiHouse', 'onContinue', 'attPriming', 'continue');
  assertTransition('attPriming', 'onBack', 'mochiHouse', 'back');
  assertTransition('doctorReferral', 'onContinue', 'planBoost', 'continue');
  assertTransition('doctorReferral', 'onSkip', 'planBoost', 'skip');
  assertTransition('planBoost', 'onBack', 'doctorReferral', 'back');
  assertTransition('planBoost', 'onContinue', 'planIntro', 'continue');
  assertTransition('planBoost', 'onSkip', 'planIntro', 'skip');
  assertTransition('planIntro', 'onBack', 'planBoost', 'back');
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
    'recommendedHabits',
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

  // The plan page lets someone choose its routine habits before the proof
  // screen, and each step has a symmetric Back path.
  assert.match(
    flow,
    /const continueFromStarterPlan = \(\) => \{\s*goToStep\('recommendedHabits', 'continue'/,
  );
  assertTransition('recommendedHabits', 'onBack', 'recommendedExercise', 'back');
  assertTransition('recommendedHabits', 'onContinue', 'habitCurve', 'continue');
  assertTransition('habitCurve', 'onBack', 'recommendedHabits', 'back');
  assertTransition('habitCurve', 'onContinue', 'mochiPlace', 'continue');
  assertTransition('mochiPlace', 'onBack', 'habitCurve', 'back');
});

test('brain science leads directly into the mental-health questions', () => {
  const orderSource = flow.slice(
    flow.indexOf('const STEP_ORDER'),
    flow.indexOf('const BASE_STEP_INDEX'),
  );
  const steps = [...orderSource.matchAll(/^\s{2}'([^']+)',$/gm)].map(
    (match) => match[1],
  );

  assert.equal(steps[steps.indexOf('brainScience') + 1], 'mentalHealth');
  assertTransition('brainScience', 'onContinue', 'mentalHealth', 'continue');
  assertTransition('mentalHealth', 'onBack', 'brainScience', 'back');
});

test('Azo greets them by name right after the name is asked', () => {
  const orderSource = flow.slice(
    flow.indexOf('const STEP_ORDER'),
    flow.indexOf('const BASE_STEP_INDEX'),
  );
  const steps = [...orderSource.matchAll(/'([^']+)'/g)].map((m) => m[1]);

  assert.equal(steps.filter((step) => step === 'greeting').length, 1);
  assert.equal(steps[steps.indexOf('greeting') - 1], 'name');
  assert.equal(steps[steps.indexOf('greeting') + 1], 'dayActivity');
  // One render site, and it receives the name the user just typed.
  assert.equal(flow.split("if (step === 'greeting')").length - 1, 1);
  assert.match(
    stepBlock('greeting'),
    /<GreetingScreen[\s\S]*?name=\{name\}/,
  );
  assertTransition('greeting', 'onContinue', 'dayActivity', 'continue');
  assertTransition('greeting', 'onBack', 'name', 'back');
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
  assert.match(sleepAnalysis, /echoSingle\(DAY_ENERGY_OPTIONS, dayEnergy\)/);
  assert.match(sleepAnalysis, /echoSingle\(SLEEP_CAUSE_OPTIONS, sleepCause\)/);
  assert.match(sleepAnalysis, /body: sleepAnswerEcho/);
});

test('load analysis quotes the support system answer', () => {
  assert.match(
    stepBlock('analyzeLoad'),
    /echoSingle\(SUPPORT_SYSTEM_OPTIONS, supportSystem\)/,
  );
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
