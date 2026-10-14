import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  activeOnboardingContext,
  adjacentOnboardingStep,
  INTENT_DEPTH_STEPS,
  onboardingStepOrder,
} from './onboardingStepOrder.ts';
import { intentFollowUpsFor } from './data/intentFollowUps.ts';
import { INTENT_OPTIONS, intentGoalPhrase } from './data/intentOptions.ts';
import { onboardingPresetFor } from '../../lib/onboardingPreset.ts';
import { buildStarterPlan } from '../../lib/onboardingStarterPlan.ts';

const flow = readFileSync(new URL('./OnboardingFlow.tsx', import.meta.url), 'utf8');
const types = readFileSync(new URL('./types.ts', import.meta.url), 'utf8');
const intentUnion = types.slice(types.indexOf('export type OnboardingIntent ='));
const intents = [...intentUnion.slice(0, intentUnion.indexOf(';')).matchAll(/'([a-z_]+)'/g)]
  .map((match) => match[1]);

function stepsFor(intent, selectedIntentCount = 1) {
  return onboardingStepOrder(intent, selectedIntentCount, intentFollowUpsFor(intent).length);
}

function stepBlock(step) {
  const start = flow.indexOf(`if (step === '${step}')`);
  assert.notEqual(start, -1, `onboarding has no '${step}' step`);
  const end = flow.indexOf('\n  if (step === ', start + 1);
  return flow.slice(start, end === -1 ? undefined : end);
}

const intro = ['azoChatInvite', 'azoChat', 'name', 'greeting', 'intent', 'personalizeIntro'];
const planAndCompletion = [
  'dailyTime', 'wakeTime', 'sleepTime', 'planBoost',
  'diagnosis', 'planOutcome', 'planPersonalization', 'recommendedExercise', 'planDays', 'recommendedHabits',
  'acquisitionSource', 'doctorReferral',
  'attPriming', 'notifications', 'pact', 'paywall',
];
// Asked of every goal once its own context is in, before the plan's settings.
const personalContext = [
  'supportSystem', 'mentalHealth', 'homeFeeling',
];
// The health assessment every goal runs after the habits section: sleep, then
// who they are, then the load they carry, closing on the whole picture.
const assessment = [
  'sleep', 'sleepDuration', 'wakeEase', 'dayEnergy', 'sleepCause', 'sleepInsight',
  'age', 'gender',
  'stress', 'stressSignal', 'stressAwareness', 'piecesTogether',
];
const sharedHabits = [
  'dayActivity', 'routineHappiness', 'fallingBehind', 'choresOverwhelm', 'distraction',
  'scrollInstead', 'socialMedia', 'procrastinationArea', 'procrastinationReason', 'putOffGuilt',
];
// Original STEP_ORDER slice from dayActivity through halfway, before this funnel change.
const originalHabitModule = [
  'dayActivity',
  'routineHappiness',
  'fallingBehind',
  'beforeAfter',
  'choresOverwhelm',
  'distraction',
  'scrollInstead',
  'socialMedia',
  'procrastinationArea',
  'procrastinationReason',
  'habitsFocusInsight',
  'putOffGuilt',
  'habitsFocusScience1',
  'habitsFocusScience2',
  'habitsFocusScience3',
  'routineBrain',
  'halfway',
];
const cleaningReplacedSteps = new Set([
  'choresOverwhelm', 'procrastinationArea', 'procrastinationReason', 'putOffGuilt',
]);
function habitModuleFor(intent) {
  return originalHabitModule.filter((step) => intent !== 'cleaning' || !cleaningReplacedSteps.has(step));
}

test('each goal asks its own follow-ups and relevant context before showing the real plan', () => {
  for (const intent of [...intents, null]) {
    for (const selectedCount of [1, 2]) {
      const questions = intentFollowUpsFor(intent);
      const steps = stepsFor(intent, selectedCount);
      assert.deepEqual(steps, [
        ...intro.slice(0, -1),
        ...(selectedCount >= 2 ? ['intentPriority'] : []),
        'personalizeIntro',
        'communityProof',
        ...INTENT_DEPTH_STEPS.slice(0, questions.length),
        'goalProof',
        ...habitModuleFor(intent),
        ...assessment,
        ...personalContext,
        ...planAndCompletion,
      ], String(intent));
      assert.equal(new Set(steps).size, steps.length, 'each screen appears once');
      assert.equal(steps.filter((step) => INTENT_DEPTH_STEPS.includes(step)).length,
        intent === 'cleaning' ? 6 : 3);
      assert.ok(steps.length <= 70, 'even the longest goal stays bounded');
    }
  }
  assert.equal(stepsFor('cleaning').length, 58);
  assert.equal(stepsFor('sleep').length, 59);
  assert.equal(stepsFor('other').length, 59);
});

test('cleaning reaches the plan without the retired screens or repeated proof screens', () => {
  const steps = stepsFor('cleaning');
  for (const removed of [
    'analyzeIntent', 'analyzeSleep', 'analyzeLoad',
    'childhoodStress', 'lifeEvents',
    'cbtFamiliarity', 'cbtIntro', 'scienceCredibility',
    'expertReview', 'habitCurve',
    'brainFog',
  ]) {
    assert.equal(steps.includes(removed), false, removed);
    assert.equal(flow.includes(`if (step === '${removed}'`), false);
  }
  assert.equal(steps[steps.indexOf('intentDepth6') + 1], 'goalProof');
  assert.equal(steps.indexOf('recommendedExercise'), 49);
});

test('ten complete cycles per goal have coherent forward, skip, and back navigation', () => {
  for (const intent of intents) {
    for (let cycle = 0; cycle < 10; cycle++) {
      const steps = stepsFor(intent, cycle % 2 ? 2 : 1);
      let current = steps[0];
      const visited = [current];
      for (const expected of steps.slice(1)) {
        // Continue and Skip both use the same next neighbor.
        current = adjacentOnboardingStep(steps, current, 'forward');
        assert.equal(current, expected);
        visited.push(current);
      }
      assert.deepEqual(visited, steps);
      assert.equal(adjacentOnboardingStep(steps, current, 'forward'), null);
      const expectedBack = steps.slice(0, -1).filter((step) => step !== 'planLoading' && step !== 'analyzeDays').reverse();
      for (const expected of expectedBack) {
        current = adjacentOnboardingStep(steps, current, 'back');
        assert.equal(current, expected, `${intent}, cycle ${cycle}`);
      }
      assert.equal(current, 'azoChatInvite');
      assert.equal(adjacentOnboardingStep(steps, current, 'back'), null);
      assert.equal(adjacentOnboardingStep(steps, 'planIntro', 'forward'), null);
    }
  }
});

test('changing the primary goal rebuilds questions, context, and indices from one sequence', () => {
  const cleaning = stepsFor('cleaning', 2);
  const focus = stepsFor('focus', 2);
  const sleep = stepsFor('sleep', 2);
  assert.equal(adjacentOnboardingStep(cleaning, 'intentDepth3', 'forward'), 'intentDepth4');
  assert.equal(adjacentOnboardingStep(focus, 'intentDepth3', 'forward'), 'goalProof');
  assert.equal(adjacentOnboardingStep(sleep, 'intentDepth3', 'forward'), 'goalProof');
  for (const steps of [cleaning, focus, sleep]) {
    const indices = Object.fromEntries(steps.map((step, index) => [step, index + 1]));
    assert.equal(indices.paywall, steps.length);
    assert.equal(adjacentOnboardingStep(steps, 'intentDepth1', 'back'), 'communityProof');
    assert.equal(adjacentOnboardingStep(steps, 'diagnosis', 'back'), 'planBoost');
    assert.equal(adjacentOnboardingStep(steps, 'recommendedExercise', 'back'), 'planPersonalization');
  }
  assert.match(flow, /onboardingStepOrder\(primaryIntent, selectedIntents.length, intentFollowUps.length\)/);
  assert.match(flow, /const stepCount = visibleStepOrder.length/);
  assert.match(flow, /adjacentOnboardingStep\(visibleStepOrder, step, 'forward'\)/);
  assert.match(flow, /adjacentOnboardingStep\(visibleStepOrder, step, 'back'\)/);
  assert.match(flow, /if \(previous != null\) goToStep\(previous, 'back'\)/);
});

test('retained render handlers follow the active sequence rather than hard-coded branch targets', () => {
  for (const step of [...intro.filter((step) => step !== 'intent'), 'communityProof', 'goalProof', ...originalHabitModule, ...assessment, ...personalContext, ...planAndCompletion]) {
    if (['paywall', 'pact', 'notifications', 'planDays'].includes(step)) continue;
    const block = stepBlock(step);
    assert.doesNotMatch(block, /goToStep\(/, `${step} must use sequence navigation`);
    assert.match(block, /goNext\(/, `${step} has a forward route`);
  }
  assert.match(flow, /onBack=\{goBack\}/);
  assert.match(flow, /onContinue=\{\(id\) =>\s*goNext\('continue', intentFollowUpProperties/);
  assert.match(flow, /onSkip=\{\(\) => goNext\('skip'\)\}/);
});

test('chat answers survive Back and saved profiles still resume directly at the paywall', () => {
  assert.match(flow, /initialSavedProfile == null \? 'azoChatInvite' : 'paywall'/);
  assert.match(stepBlock('azoChat'), /answers=\{azoChatAnswers\}/);
  assert.match(stepBlock('azoChat'), /onAnswersChange=\{setAzoChatAnswers\}/);
  assert.equal(adjacentOnboardingStep(stepsFor('cleaning'), 'name', 'back'), 'azoChat');
  assert.equal(adjacentOnboardingStep(stepsFor('cleaning'), 'greeting', 'forward'), 'intent');
});

function answerCallbacks() {
  const updateSource = flow.match(/setIntentFollowUpAnswers\(\(current\) => \{([\s\S]*?)\n          \}\)/)[1];
  const analyticsSource = flow.match(/intentFollowUps.reduce<OnboardingAnalyticsProperties>\(([\s\S]*?)\}, \{\}\);/)[0]
    .replace('<OnboardingAnalyticsProperties>', '');
  return {
    update: new Function('question', 'id', 'current', updateSource),
    properties: new Function('intentFollowUps', 'intentFollowUpAnswers', 'answer', `return ${analyticsSource}`),
  };
}

test('follow-up answers replace or toggle without mutation and analytics retain all selected barriers', () => {
  const { update, properties } = answerCallbacks();
  const questions = intentFollowUpsFor('cleaning');
  let answers = {};
  for (const question of questions) {
    const before = structuredClone(answers);
    const previous = answers;
    answers = update(question, question.options[0].id, answers);
    assert.deepEqual(previous, before);
    assert.deepEqual(answers[question.id], [question.options[0].id]);
    answers = update(question, question.options[1].id, answers);
    assert.deepEqual(answers[question.id], question.multiSelect
      ? [question.options[0].id, question.options[1].id]
      : [question.options[1].id]);
  }
  const event = properties(questions, answers);
  assert.equal(event.intent_cleaning_barriers_count, 2);
  assert.equal(event.intent_cleaning_barriers, questions[1].options.slice(0, 2).map(({ id }) => id).join(','));
  assert.equal(event.intent_cleaning_living_situation_count, 1);
  assert.equal(event.intent_cleaning_space_state_count, 1);
  assert.equal(event.intent_cleaning_impact_count, 1);
});

test('every goal preserves unique follow-up questions and readable answer echoes', () => {
  for (const intent of [...intents, null]) {
    const questions = intentFollowUpsFor(intent);
    assert.equal(new Set(questions.map(({ id }) => id)).size, questions.length);
    assert.equal(questions.length, intent === 'cleaning' ? 6 : 3);
    for (const question of questions) {
      assert.equal(new Set(question.options.map(({ id }) => id)).size, question.options.length);
      assert.ok(question.options.every(({ echo, icon }) => echo && icon));
    }
  }
});

test('plan preview and enrollment retain the direct answers that refine the prescribed program', () => {
  assert.equal(onboardingPresetFor('sleep', { sleepCause: 'phone' }).id, 'phone');
  assert.equal(onboardingPresetFor('focus', { followUpAnswers: { when_focus: ['phone'] } }).id, 'phone');
  assert.equal(onboardingPresetFor('energy', { followUpAnswers: { when_energy: ['constant'] } }).id, 'recovery');
  assert.equal((flow.match(/followUpAnswers: intentFollowUpAnswers/g) ?? []).length, 2);
  assert.equal((flow.match(/sleepCause: activeContext.sleepCause === 'phone' \? 'phone' : null/g) ?? []).length, 2);
  assert.match(stepBlock('planDays'), /preset=\{onboardingPreset\}/);
  assert.match(stepBlock('recommendedExercise'), /phase="plan"/);
});

test('unasked baselines are not persisted as measured answers and legacy demographics survive', () => {
  assert.match(flow, /stressLevel: activeContext\.stressLevel \?\? initialSavedProfile\?\.stressLevel \?\? null/);
  assert.match(flow, /sleepQuality: activeContext\.sleepQuality \?\? initialSavedProfile\?\.sleepQuality \?\? null/);
  assert.match(flow, /useState\(initialSavedProfile\?\.stressLevel != null\)/);
  assert.match(flow, /useState\(initialSavedProfile\?\.sleepQuality != null\)/);
  assert.match(flow, /useState\(initialSavedProfile\?\.age \?\? null\)/);
  assert.match(flow, /useState\(\s*toGenderOptionId\(initialSavedProfile\?\.gender\)/);
  assert.match(stepBlock('sleep'), /setHasAnsweredSleep\(false\)/);
});

test('the plan no longer asks for a Reset time and takes the session from the plan', () => {
  assert.doesNotMatch(flow, /if \(step === 'sessionTime'\)/);
  for (const intent of intents) {
    const steps = stepsFor(intent);
    assert.equal(steps.includes('sessionTime'), false, intent);
    assert.equal(adjacentOnboardingStep(steps, 'sleepTime', 'forward'), 'planBoost');
  }
  assert.match(flow, /session: fromPlan\('session'\)/);
});


test('changing goals preserves shared habits and masks only the questions cleaning replaces', () => {
  const answers = {
    stressLevel: 9,
    sleepQuality: 2,
    sleepDuration: 'short',
    wakeEase: 'struggle',
    dayEnergy: 'crash',
    dayActivity: 'home',
    routineHappiness: 'none',
    choresOverwhelm: 'often',
    distraction: 'often',
    sleepCause: 'phone',
    stressSignal: 'racing',
    procrastinationAreas: ['chores'],
    procrastinationReasons: ['overwhelmed'],
  };
  const snapshot = structuredClone(answers);
  for (let cycle = 0; cycle < 10; cycle++) {
    // The assessment is universal, so every goal reads the same sleep, stress,
    // and daily-life answers.
    const sleep = activeOnboardingContext(stepsFor('sleep'), answers);
    assert.equal(sleep.sleepCause, 'phone');
    assert.equal(sleep.stressLevel, 9);
    assert.equal(onboardingPresetFor('sleep', { sleepCause: sleep.sleepCause }).id, 'phone');
    const focus = activeOnboardingContext(stepsFor('focus'), answers);
    assert.equal(focus.sleepCause, 'phone');
    assert.equal(focus.sleepQuality, 2);
    assert.equal(focus.dayActivity, 'home');
    assert.deepEqual(focus.procrastinationReasons, ['overwhelmed']);
    assert.deepEqual(focus.procrastinationAreas, ['chores']);
    const stress = activeOnboardingContext(stepsFor('stress_relief'), answers);
    assert.equal(stress.stressLevel, 9);
    assert.equal(stress.stressSignal, 'racing');
    assert.equal(stress.dayActivity, 'home');
    const cleaning = activeOnboardingContext(stepsFor('cleaning'), answers);
    assert.equal(cleaning.sleepCause, 'phone');
    assert.equal(cleaning.sleepQuality, 2);
    assert.equal(cleaning.stressLevel, 9);
    assert.equal(cleaning.dayActivity, 'home');
    assert.equal(cleaning.choresOverwhelm, null);
    assert.deepEqual(cleaning.procrastinationAreas, []);
    assert.deepEqual(cleaning.procrastinationReasons, []);
    const energy = activeOnboardingContext(stepsFor('energy'), answers);
    assert.equal(energy.wakeEase, 'struggle');
    assert.equal(energy.dayEnergy, 'crash');
    assert.equal(energy.sleepQuality, 2);
    assert.equal(energy.sleepCause, 'phone');
    const returnToSleep = activeOnboardingContext(stepsFor('sleep'), answers);
    assert.deepEqual(returnToSleep, sleep, 'Back restores the relevant answers');
  }
  assert.deepEqual(answers, snapshot, 'masking never mutates retained answers');
  assert.match(flow, /activeOnboardingContext\(visibleStepOrder, \{/);
  assert.match(flow, /wakeEase: activeContext\.wakeEase/);
  assert.match(flow, /procrastinationAreas: activeContext\.procrastinationAreas/);
  assert.match(flow, /sleepEcho: echoSingle\(SLEEP_CAUSE_OPTIONS, activeContext\.sleepCause\)/);
});

test('profile recovery retains legacy baselines while newly answered active questions can update them', () => {
  const body = flow.match(/const buildOnboardingResult = \(\): OnboardingFlowResult \| null => \{([\s\S]*?)\n  \};/)[1];
  const build = new Function(
    'initialSavedProfile', 'activeContext', 'buildOnboardingGoal', 'name',
    'agreementResponses', 'age', 'gender', 'hasAnsweredDailyTime', 'dailyMinutes',
    'primaryIntent', 'techniqueForIntent', body,
  );
  const saved = {
    onboardingGoal: 'Keep my space manageable', stressLevel: 8, sleepQuality: 3,
    age: 47, gender: 'non_binary', defaultTechniqueId: 'extended-exhale',
    agreementResponses: { starting: 'agree' },
  };
  const invoke = (profile, context) => build(
    profile, context, () => '', 'Alex', profile?.agreementResponses ?? {},
    profile?.age ?? null, profile?.gender ?? null, false, 5, null, () => 'unused',
  );
  const resumed = invoke(saved, { stressLevel: null, sleepQuality: null });
  assert.equal(resumed.onboardingGoal, saved.onboardingGoal);
  assert.equal(resumed.stressLevel, 8);
  assert.equal(resumed.sleepQuality, 3);
  assert.equal(resumed.age, 47);
  assert.equal(resumed.gender, 'non_binary');
  assert.deepEqual(resumed.agreementResponses, saved.agreementResponses);
  assert.equal(resumed.defaultTechniqueId, saved.defaultTechniqueId);
  const updated = invoke(saved, { stressLevel: 4, sleepQuality: 7 });
  assert.equal(updated.stressLevel, 4);
  assert.equal(updated.sleepQuality, 7);
  const fresh = build(
    null, { stressLevel: null, sleepQuality: null }, () => 'Cleaning', 'Alex',
    {}, null, null, false, 5, 'cleaning', () => 'extended-exhale',
  );
  assert.equal(fresh.stressLevel, null);
  assert.equal(fresh.sleepQuality, null);
  assert.equal(fresh.age, null);
  assert.equal(fresh.gender, null);
});


test('shared daily-life answers survive goal changes and inform non-cleaning starter tasks', () => {
  const answers = {
    stressLevel: null, sleepQuality: null, sleepDuration: null, wakeEase: null,
    dayEnergy: null, dayActivity: null, routineHappiness: null, choresOverwhelm: 'often',
    distraction: null, sleepCause: null, stressSignal: null,
    procrastinationAreas: [], procrastinationReasons: [],
  };
  for (const intent of intents) {
    const steps = stepsFor(intent);
    for (const shared of sharedHabits) {
      if (intent === 'cleaning' && cleaningReplacedSteps.has(shared)) {
        assert.equal(steps.includes(shared), false);
      } else {
        assert.equal(steps.filter((step) => step === shared).length, 1);
        assert.ok(steps.indexOf(shared) < steps.indexOf('sleepTime'));
      }
    }
    const context = activeOnboardingContext(steps, answers);
    assert.equal(context.choresOverwhelm, intent === 'cleaning' ? null : 'often', intent);
  }
  const context = activeOnboardingContext(stepsFor('daily_habit'), answers);
  const tasks = buildStarterPlan({ intent: 'daily_habit', ...context, mentalHealth: [] });
  assert.ok(tasks.some(({ id }) => id === 'wipeCounter'));
  assert.ok(tasks.some(({ id, because }) => id === 'laundryBasket'
    && because === 'because you said chores often feel overwhelming'));
  assert.match(flow, /choresOverwhelm: activeContext\.choresOverwhelm/);
  for (const shared of sharedHabits) {
    const block = stepBlock(shared);
    assert.match(block, /onBack=\{goBack\}/);
    assert.match(block, /onSkip=\{\(\) => goNext\('skip'\)\}/);
  }
});


test('the original habit section order, copy, and cleaning exclusions remain unchanged', () => {
  for (const intent of intents) {
    const steps = stepsFor(intent);
    const start = steps.indexOf('dayActivity');
    const expected = habitModuleFor(intent);
    assert.deepEqual(steps.slice(start, start + expected.length), expected);
    for (const screen of ['beforeAfter', 'habitsFocusInsight', 'habitsFocusScience1', 'habitsFocusScience2',
      'habitsFocusScience3', 'routineBrain', 'halfway']) {
      assert.equal(steps.filter((step) => step === screen).length, 1);
      const index = steps.indexOf(screen);
      assert.equal(adjacentOnboardingStep(steps, screen, 'back'),
        steps[index - 1] === 'analyzeDays' ? steps[index - 2] : steps[index - 1]);
      assert.equal(adjacentOnboardingStep(steps, screen, 'forward'), steps[index + 1]);
      const render = stepBlock(screen);
      assert.match(render, /onContinue=\{\(\) => goNext\('continue'\)\}/);
      assert.match(render, /onBack=\{goBack\}/);
      assert.match(render, /stepIndex=\{visualStepIndex\}/);
      assert.match(render, /stepCount=\{visualStepCount\}/);
    }
    assert.equal(adjacentOnboardingStep(steps, 'habitsFocusInsight', 'back'),
      intent === 'cleaning' ? 'socialMedia' : 'procrastinationReason');
  }
  assert.match(stepBlock('habitsFocusInsight'), /<HabitsFocusInsightScreen/);
  assert.match(stepBlock('habitsFocusScience1'), /You are not lazy\. Your brain is protecting you\./);
  assert.match(stepBlock('habitsFocusScience2'), /What feels like laziness is often your brain trying to protect you from uncertainty, effort, or emotional risk\./);
  assert.match(stepBlock('habitsFocusScience3'), /Azora uses CBT to help you follow through one step at a time\./);
  assert.match(stepBlock('routineBrain'), /lesson="routineBrain"/);
});


test('the original profile, outcome, personalization, and plan reveal order is preserved for every goal', () => {
  const reveal = ['diagnosis', 'planOutcome', 'planPersonalization',
    'recommendedExercise', 'planDays'];
  for (const intent of intents) {
    const steps = stepsFor(intent);
    const start = steps.indexOf('diagnosis');
    assert.deepEqual(steps.slice(start, start + reveal.length), reveal);
    for (const screen of reveal) assert.equal(steps.filter((step) => step === screen).length, 1);
    assert.equal(adjacentOnboardingStep(steps, 'sleepTime', 'forward'), 'planBoost');
    assert.equal(adjacentOnboardingStep(steps, 'planBoost', 'forward'), 'diagnosis');
    assert.equal(adjacentOnboardingStep(steps, 'diagnosis', 'back'), 'planBoost');
    assert.equal(adjacentOnboardingStep(steps, 'recommendedExercise', 'back'), 'planPersonalization');
  }
  for (const [step, phase] of [['diagnosis', 'diagnosis'], ['recommendedExercise', 'plan']]) {
    const render = stepBlock(step);
    assert.match(render, /return \(\s*<PlanRevealScreen/);
    assert.match(render, new RegExp(`phase="${phase}"`));
    assert.match(render, /\{\.\.\.planRevealProps\(\)\}/);
  }
  assert.match(flow, /scores: planMindMap\.scores/);
  assert.match(flow, /superpower: planMindMap\.superpower/);
  assert.match(flow, /growthArea: planMindMap\.growthArea/);
  assert.doesNotMatch(flow, /targetScores:|projectScores/);
  for (const [step, phase] of [['planOutcome', 'outcome'], ['planPersonalization', 'personalization']]) {
    const render = stepBlock(step);
    assert.match(render, new RegExp(`key="${step}"`));
    assert.match(render, new RegExp(`phase="${phase}"`));
    assert.match(render, /\{\.\.\.planBenefitsProps\}/);
    assert.match(render, /onContinue=\{\(\) => goNext\('continue'\)\}/);
    assert.match(render, /onBack=\{goBack\}/);
  }
});


test('goal selection replaces the previous goal, preserves a repeated tap, and tracks one selected intent', () => {
  const body = flow.match(/const selectIntent = \(intentId: OnboardingIntent\) => \{([\s\S]*?)\n  \};/)[1];
  let selected = ['sleep', 'cleaning'];
  let primary = 'sleep';
  let error = 'Old error';
  const events = [];
  const handler = (submitting) => new Function(
    'isSubmitting', 'setSelectedIntents', 'setPrimaryIntent', 'trackOnboardingIntentUpdated',
    'getStepEventInput', 'setErrorMessage', `return (intentId) => {${body}};`,
  )(
    submitting,
    (value) => { selected = value; },
    (value) => { primary = value; },
    (event) => { events.push(event); },
    () => ({ step: 'intent' }),
    (value) => { error = value; },
  );
  const select = handler(false);
  select('cleaning');
  assert.deepEqual(selected, ['cleaning']);
  assert.equal(primary, 'cleaning');
  select('focus');
  assert.deepEqual(selected, ['focus']);
  assert.equal(primary, 'focus');
  select('focus');
  assert.deepEqual(selected, ['focus']);
  assert.equal(primary, 'focus');
  assert.equal(error, null);
  assert.deepEqual(events.map(({ intentId, selected, selectedIntentCount }) => ({ intentId, selected, selectedIntentCount })), [
    { intentId: 'cleaning', selected: true, selectedIntentCount: 1 },
    { intentId: 'focus', selected: true, selectedIntentCount: 1 },
    { intentId: 'focus', selected: true, selectedIntentCount: 1 },
  ]);
  handler(true)('sleep');
  assert.deepEqual(selected, ['focus']);
  assert.equal(primary, 'focus');
  assert.equal(events.length, 3, 'submission prevents state and analytics changes');
  const freshSteps = onboardingStepOrder(primary, selected.length, intentFollowUpsFor(primary).length);
  assert.equal(freshSteps.includes('intentPriority'), false);
  assert.equal(adjacentOnboardingStep(freshSteps, 'intent', 'forward'), 'personalizeIntro');
});

test('only the goal question changes to single selection while follow-up and habit questions retain their modes', () => {
  const goalScreen = readFileSync(new URL('./screens/IntentQuestionScreen.tsx', import.meta.url), 'utf8');
  assert.match(goalScreen, /title="What would you like to focus on the most\?"/);
  assert.match(goalScreen, /subtitle="Pick what matters most\. We’ll start small\. Your selection won’t limit access to any features\."/);
  assert.match(goalScreen, /multiSelect=\{false\}/);
  assert.match(goalScreen, /const selectedIntent = selectedIntents\[0\] \?\? null/);
  assert.match(goalScreen, /canContinue = selectedIntent != null && !isSubmitting/);
  assert.match(goalScreen, /selectedIds=\{selectedIntent == null \? \[\] : \[selectedIntent\]\}/);
  assert.match(goalScreen, /onSelect=\{onSelect\}/);
  assert.match(flow, /onSelect=\{selectIntent\}/);
  assert.match(stepBlock('procrastinationArea'), /\n        multiSelect\n/);
  assert.match(flow, /multiSelect=\{question\.multiSelect\}/);
  assert.equal(intentFollowUpsFor('cleaning').find(({ id }) => id === 'cleaning_barriers').multiSelect, true);
  assert.match(flow, /useState<OnboardingIntent\[\]>\(savedIntents\)/);
});


test('the intro after the goal names the chosen goal in its headline', () => {
  const screen = readFileSync(
    new URL('./screens/PersonalizeIntroScreen.tsx', import.meta.url),
    'utf8',
  );
  assert.match(screen, /goalPhrase: string/);
  assert.match(screen, /Congrats on taking the first step to \{goalPhrase\}\./);
  assert.match(screen, /You can change your options anytime in the app\./);
  assert.match(stepBlock('personalizeIntro'), /goalPhrase=\{\s*chosenGoalPhrase\(primaryIntent, selectedIntents\) \?\?/);
  for (const option of INTENT_OPTIONS) {
    assert.ok(intentGoalPhrase(option.id), `${option.id} has a goal phrase to name in the sentence`);
  }
});

test('the encouraging intro follows goal selection and Back retains the answer until a new goal replaces it', () => {
  const choiceBody = flow.match(/const continueAfterIntentChoice = [\s\S]*?=> \{([\s\S]*?)\n  \};/)[1];
  const continueBody = flow.match(/const goFromIntent = \(\) => \{([\s\S]*?)\n  \};/)[1];
  const selectBody = flow.match(/const selectIntent = \(intentId: OnboardingIntent\) => \{([\s\S]*?)\n  \};/)[1];
  let current = 'intent';
  let selected = [];
  let primary = null;
  const events = [];
  const order = () => onboardingStepOrder(primary, selected.length, intentFollowUpsFor(primary).length);
  const goToStep = (target, action, properties) => {
    current = target;
    events.push({ target, action, properties });
  };
  const goNext = (action, properties) => goToStep(adjacentOnboardingStep(order(), current, 'forward'), action, properties);
  const afterChoice = new Function('goNext', `return (action, properties) => {${choiceBody}};`)(goNext);
  const select = new Function(
    'isSubmitting', 'setSelectedIntents', 'setPrimaryIntent', 'trackOnboardingIntentUpdated',
    'getStepEventInput', 'setErrorMessage', `return (intentId) => {${selectBody}};`,
  )(false, (value) => { selected = value; }, (value) => { primary = value; },
    () => {}, () => ({}), () => {});
  const continueFromGoal = () => new Function(
    'selectedIntents', 'isSubmitting', 'isOnlyCustomIntent', 'setPrimaryIntent',
    'goToStep', 'continueAfterIntentChoice', continueBody,
  )(selected, false, selected[0] === 'other', (value) => { primary = value; }, goToStep, afterChoice);
  continueFromGoal();
  assert.equal(current, 'intent', 'an unanswered goal cannot advance');
  select('cleaning');
  continueFromGoal();
  assert.equal(current, 'personalizeIntro');
  assert.equal(events.at(-1).properties.primary_intent_id, 'cleaning');
  assert.deepEqual(selected, ['cleaning']);
  current = adjacentOnboardingStep(order(), current, 'back');
  assert.equal(current, 'intent');
  assert.deepEqual(selected, ['cleaning']);
  select('focus');
  continueFromGoal();
  assert.equal(current, 'personalizeIntro');
  assert.deepEqual(selected, ['focus']);
  assert.equal(primary, 'focus');
  goNext('continue');
  assert.equal(current, 'communityProof');
  goNext('continue');
  assert.equal(current, 'intentDepth1');
  current = adjacentOnboardingStep(order(), current, 'back');
  assert.equal(current, 'communityProof');
  current = adjacentOnboardingStep(order(), current, 'back');
  assert.equal(current, 'personalizeIntro');
  current = adjacentOnboardingStep(order(), current, 'back');
  assert.equal(current, 'intent');
  current = adjacentOnboardingStep(order(), current, 'back');
  assert.equal(current, 'greeting');
  const legacy = onboardingStepOrder('sleep', 2, 3);
  assert.equal(adjacentOnboardingStep(legacy, 'intent', 'forward'), 'intentPriority');
  assert.equal(adjacentOnboardingStep(legacy, 'intentPriority', 'forward'), 'personalizeIntro');
  assert.equal(adjacentOnboardingStep(legacy, 'personalizeIntro', 'back'), 'intentPriority');
  assert.match(stepBlock('personalizeIntro'), /onContinue=\{\(\) => goNext\('continue'\)\}/);
  assert.match(stepBlock('personalizeIntro'), /onBack=\{goBack\}/);
});


test('goal proof follows the final personalized question for every goal and Back keeps the follow-up chain intact', () => {
  for (const intent of intents) {
    const steps = stepsFor(intent);
    const finalDepth = INTENT_DEPTH_STEPS[intentFollowUpsFor(intent).length - 1];
    assert.equal(steps.filter((step) => step === 'goalProof').length, 1);
    assert.equal(steps.indexOf('goalProof'), steps.indexOf(finalDepth) + 1);
    assert.equal(adjacentOnboardingStep(steps, finalDepth, 'forward'), 'goalProof');
    assert.equal(adjacentOnboardingStep(steps, 'goalProof', 'back'), finalDepth);
    assert.equal(adjacentOnboardingStep(steps, 'goalProof', 'forward'), 'dayActivity');
    assert.equal(adjacentOnboardingStep(steps, 'dayActivity', 'back'), 'goalProof');
    if (intent === 'cleaning') {
      assert.equal(finalDepth, 'intentDepth6');
      assert.equal(adjacentOnboardingStep(steps, 'intentDepth3', 'forward'), 'intentDepth4');
    }
  }
  const render = stepBlock('goalProof');
  assert.match(render, /<GoalProofScreen/);
  assert.match(render, /intent=\{primaryIntent \?\? 'other'\}/);
  assert.match(render, /stepIndex=\{visualStepIndex\}/);
  assert.match(render, /stepCount=\{visualStepCount\}/);
  assert.match(render, /onContinue=\{\(\) => goNext\('continue'\)\}/);
  assert.match(render, /onBack=\{goBack\}/);
});


test('the habit-science screens keep their highlighted phrases', () => {
  assert.match(stepBlock('habitsFocusScience1'), /highlights=\{\['not lazy', 'protecting you'\]\}/);
  assert.match(stepBlock('habitsFocusScience2'), /highlights=\{\['laziness', 'uncertainty, effort, or emotional risk'\]\}/);
  assert.match(stepBlock('habitsFocusScience3'), /highlights=\{\['CBT', 'follow through'\]\}/);
});

test('the restored social proof and personal context steps sit in the flow for every goal', () => {
  for (const intent of intents) {
    const steps = stepsFor(intent);
    assert.equal(adjacentOnboardingStep(steps, 'personalizeIntro', 'forward'), 'communityProof');
    assert.equal(adjacentOnboardingStep(steps, 'communityProof', 'forward'), 'intentDepth1');
    assert.equal(adjacentOnboardingStep(steps, 'halfway', 'forward'), 'sleep');
    assert.equal(adjacentOnboardingStep(steps, 'sleepInsight', 'forward'), 'age');
    assert.equal(adjacentOnboardingStep(steps, 'gender', 'forward'), 'stress');
    assert.equal(adjacentOnboardingStep(steps, 'stressAwareness', 'forward'), 'piecesTogether');
    assert.equal(adjacentOnboardingStep(steps, 'piecesTogether', 'forward'), 'supportSystem');
    assert.equal(adjacentOnboardingStep(steps, 'supportSystem', 'forward'), 'mentalHealth');
    assert.equal(adjacentOnboardingStep(steps, 'mentalHealth', 'forward'), 'homeFeeling');
    assert.equal(adjacentOnboardingStep(steps, 'homeFeeling', 'forward'), 'dailyTime');
    assert.equal(adjacentOnboardingStep(steps, 'sleepTime', 'forward'), 'planBoost');
    assert.equal(adjacentOnboardingStep(steps, 'planBoost', 'forward'), 'diagnosis');
    assert.equal(adjacentOnboardingStep(steps, 'acquisitionSource', 'forward'), 'doctorReferral');
    assert.equal(adjacentOnboardingStep(steps, 'doctorReferral', 'forward'), 'attPriming');
    for (const step of [...assessment, ...personalContext, 'doctorReferral', 'communityProof', 'planBoost']) {
      assert.equal(steps.filter((entry) => entry === step).length, 1, `${intent} ${step}`);
    }
  }
});

test('the restored question screens keep their copy and selection modes', () => {
  assert.match(stepBlock('communityProof'), /<CommunityProofScreen/);
  assert.match(stepBlock('sleepInsight'), /<SleepInsightScreen/);
  assert.match(stepBlock('piecesTogether'), /<PiecesTogetherScreen/);
  assert.match(stepBlock('stressAwareness'), /question="How well do you understand how your body reacts to stress\?"/);
  assert.match(stepBlock('stressAwareness'), /options=\{STRESS_AWARENESS_OPTIONS\}/);
  assert.match(stepBlock('age'), /<AgeScreen/);
  assert.match(stepBlock('gender'), /<GenderScreen/);
  assert.match(stepBlock('supportSystem'), /question="How strong is your support system\?"/);
  assert.match(stepBlock('supportSystem'), /options=\{SUPPORT_SYSTEM_OPTIONS\}/);
  assert.match(stepBlock('mentalHealth'), /question="Have you been diagnosed with any of these\?"/);
  assert.match(stepBlock('mentalHealth'), /options=\{MENTAL_HEALTH_OPTIONS\}/);
  assert.match(stepBlock('mentalHealth'), /toggleExclusiveNone/);
  assert.match(stepBlock('mentalHealth'), /\n        multiSelect\n/);
  assert.match(stepBlock('homeFeeling'), /question="How do you envision yourself living a better life\?"/);
  assert.match(stepBlock('homeFeeling'), /options=\{HOME_FEELING_OPTIONS\}/);
  assert.match(stepBlock('homeFeeling'), /\n        multiSelect\n/);
  assert.match(stepBlock('doctorReferral'), /<DoctorReferralScreen/);
  assert.match(stepBlock('planBoost'), /question="What would make your plan more fun and helpful\?"/);
  assert.match(stepBlock('planBoost'), /options=\{PLAN_BOOST_OPTIONS\}/);
  assert.match(stepBlock('planBoost'), /\n        multiSelect\n/);
});
