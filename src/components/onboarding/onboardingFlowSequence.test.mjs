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
import { SLEEP_CAUSE_OPTIONS } from './data/routineOptions.ts';
import { onboardingPresetFor } from '../../lib/onboardingPreset.ts';
import { buildStarterPlan } from '../../lib/onboardingStarterPlan.ts';
import { PLAN_EVENING_MIN, PLAN_MORNING_MIN } from '../../lib/onboardingPlan.ts';
import { planNounForIntent } from '../../lib/paywallPlanHighlights.ts';
import { OPTION_ICON_PATHS } from '../common/icons/optionIconPaths.ts';

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

const intro = ['azoChatInvite', 'azoChat', 'name', 'greeting', 'intent', 'usageStyle', 'personalizeIntro'];
const planAndCompletion = [
  'dailyTime', 'wakeTime', 'sleepTime', 'planBoost',
  'planIntro', 'planLoading',
  'diagnosis', 'planOutcome', 'planPersonalization', 'recommendedExercise', 'planDays', 'recommendedHabits',
  'habitPicks', 'habitCurve',
  'acquisitionSource', 'doctorReferral',
  'attPriming', 'notifications', 'pact', 'paywall',
];
// Asked of every goal once its own context is in, before the plan's settings.
const personalContext = [
  'supportSystem', 'mentalHealth', 'struggles', 'homeAtmosphere',
];
// Other goals retain this assessment after habits.
const sleepAssessment = [
  'sleep', 'sleepDuration', 'wakeEase', 'dayEnergy', 'sleepCause', 'sleepInsight',
];
const sleepIntentModule = [
  'intentDepth1', 'sleepDuration', 'sleepTime', 'wakeTime', 'sleep', 'wakeEase',
  'sleepCause', 'intentDepth2', 'dayEnergy', 'intentDepth3', 'sleepInsight',
];
const assessment = [
  'age', 'gender',
  'stress', 'stressSignal', 'stressAwareness', 'piecesTogether',
];
const sharedHabits = [
  'routineHappiness', 'fallingBehind', 'choresOverwhelm', 'distraction',
  'scrollInstead', 'socialMedia', 'procrastinationArea', 'procrastinationReason', 'putOffGuilt',
];
// Original STEP_ORDER slice from routineHappiness through halfway. `habitsFocusInsight`
// moved after `putOffGuilt` so it opens the brain-science block rather than interrupting
// the two procrastination questions.
const originalHabitModule = [
  'routineHappiness',
  'fallingBehind',
  'skipSelfCare',
  'drainedFrequency',
  'homeFeeling',
  'beforeAfter',
  'lifestyleHappiness',
  'habitMotivation',
  'greatDaysChart',
  'choresOverwhelm',
  'scrollInstead',
  'socialMedia',
  'procrastinationArea',
  'procrastinationReason',
  'putOffGuilt',
  'distraction',
  'habitsFocusInsight',
  'habitsFocusScience1',
  'habitsFocusScience2',
  'habitsFocusScience3',
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
        ...intro.slice(0, -2),
        ...(selectedCount >= 2 ? ['intentPriority'] : []),
        'usageStyle',
        'personalizeIntro',
        'communityProof',
        ...(intent === 'sleep' ? sleepIntentModule : INTENT_DEPTH_STEPS.slice(0, questions.length)),
        'goalProof',
        ...habitModuleFor(intent),
        ...(intent !== 'sleep' ? sleepAssessment : []),
        ...assessment,
        ...personalContext,
        'habitsToBreak',
        'cbtFamiliarity',
        'cbtIntro',
        'routineBrain',
        ...planAndCompletion.filter((step) => intent !== 'sleep' || !['sleepTime', 'wakeTime'].includes(step)),
      ], String(intent));
      assert.equal(new Set(steps).size, steps.length, 'each screen appears once');
      assert.equal(steps.filter((step) => INTENT_DEPTH_STEPS.includes(step)).length,
        intent === 'cleaning' ? 6 : 3);
      assert.ok(steps.length <= 72, 'even the longest goal stays bounded');
    }
  }
  assert.equal(stepsFor('cleaning').length, 70);
  assert.equal(stepsFor('sleep').length, 71);
  assert.equal(stepsFor('other').length, 71);
});

test('sleep primary integrates its questions once while preserving other paths and shared habits', () => {
  for (const selectedCount of [1, 2, 3]) {
    for (const intent of ['sleep', 'focus', null]) {
      const steps = stepsFor(intent, selectedCount);
      const module = intent === 'sleep' ? sleepIntentModule : sleepAssessment;
      const beforeSleep = intent === 'sleep' ? 'communityProof' : 'halfway';
      const afterSleep = intent === 'sleep' ? 'goalProof' : 'age';
      const moduleIndex = steps.indexOf(module[0]);
      assert.deepEqual(steps.slice(moduleIndex, moduleIndex + module.length), module);
      assert.equal(adjacentOnboardingStep(steps, beforeSleep, 'forward'), module[0]);
      assert.equal(adjacentOnboardingStep(steps, module[0], 'back'), beforeSleep);
      assert.equal(adjacentOnboardingStep(steps, 'sleepInsight', 'forward'), afterSleep);
      assert.equal(adjacentOnboardingStep(steps, afterSleep, 'back'), 'sleepInsight');
      for (const step of sleepIntentModule) {
        assert.equal(steps.filter((entry) => entry === step).length, 1);
      }
      assert.equal(adjacentOnboardingStep(steps, 'dailyTime', 'forward'), intent === 'sleep' ? 'planBoost' : 'wakeTime');
      assert.equal(adjacentOnboardingStep(steps, 'sleepTime', 'forward'), intent === 'sleep' ? 'wakeTime' : 'planBoost');
      assert.equal(adjacentOnboardingStep(steps, 'homeAtmosphere', 'forward'), 'habitsToBreak');
      assert.equal(adjacentOnboardingStep(steps, 'habitsToBreak', 'forward'), 'cbtFamiliarity');
      assert.equal(steps.includes('intentPriority'), selectedCount >= 2);
      assert.equal(steps.length, selectedCount >= 2 ? 72 : 71);
    }
    const withoutSleep = (steps) => steps.filter((step) => !sleepIntentModule.includes(step));
    assert.deepEqual(withoutSleep(stepsFor('sleep', selectedCount)), withoutSleep(stepsFor('focus', selectedCount)),
      'changing the primary goal preserves every remaining shared step and its order');
  }
});

test('cleaning reaches the plan without the retired screens or repeated proof screens', () => {
  const steps = stepsFor('cleaning');
  for (const removed of [
    'analyzeIntent', 'analyzeSleep', 'analyzeLoad',
    'childhoodStress', 'lifeEvents',
    'scienceCredibility',
    'expertReview',
    'brainFog',
  ]) {
    assert.equal(steps.includes(removed), false, removed);
    assert.equal(flow.includes(`if (step === '${removed}'`), false);
  }
  assert.equal(steps[steps.indexOf('intentDepth6') + 1], 'goalProof');
  assert.equal(steps.indexOf('recommendedExercise'), 59);
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
    }
  }
});

test('changing the primary goal rebuilds questions, context, and indices from one sequence', () => {
  const cleaning = stepsFor('cleaning', 2);
  const focus = stepsFor('focus', 2);
  const sleep = stepsFor('sleep', 2);
  assert.equal(adjacentOnboardingStep(cleaning, 'intentDepth3', 'forward'), 'intentDepth4');
  assert.equal(adjacentOnboardingStep(focus, 'intentDepth3', 'forward'), 'goalProof');
  assert.equal(adjacentOnboardingStep(sleep, 'intentDepth1', 'forward'), 'sleepDuration');
  assert.equal(adjacentOnboardingStep(sleep, 'sleepCause', 'forward'), 'intentDepth2');
  assert.equal(adjacentOnboardingStep(sleep, 'intentDepth2', 'forward'), 'dayEnergy');
  assert.equal(adjacentOnboardingStep(sleep, 'dayEnergy', 'forward'), 'intentDepth3');
  assert.equal(adjacentOnboardingStep(sleep, 'intentDepth3', 'forward'), 'sleepInsight');
  assert.equal(adjacentOnboardingStep(sleep, 'sleepInsight', 'forward'), 'goalProof');
  assert.equal(adjacentOnboardingStep(sleep, 'halfway', 'forward'), 'age');
  assert.equal(adjacentOnboardingStep(focus, 'halfway', 'forward'), 'sleep');
  assert.equal(adjacentOnboardingStep(focus, 'sleepInsight', 'forward'), 'age');
  assert.deepEqual(stepsFor('sleep', 2), sleep, 'switching back restores the sleep sequence');
  for (const steps of [cleaning, focus, sleep]) {
    const indices = Object.fromEntries(steps.map((step, index) => [step, index + 1]));
    assert.equal(indices.paywall, steps.length);
    assert.equal(adjacentOnboardingStep(steps, 'intentDepth1', 'back'), 'communityProof');
    assert.equal(adjacentOnboardingStep(steps, 'diagnosis', 'back'), 'planIntro');
    assert.equal(adjacentOnboardingStep(steps, 'recommendedExercise', 'back'), 'planPersonalization');
  }
  assert.match(flow, /onboardingStepOrder\(\s*primaryIntent,\s*selectedIntents.length,\s*intentFollowUps.length,\s*mentalHealth.includes\('adhd'\),\s*\)/);
  assert.match(flow, /const stepCount = visibleStepOrder.length/);
  assert.match(flow, /adjacentOnboardingStep\(visibleStepOrder, step, 'forward'\)/);
  assert.match(flow, /adjacentOnboardingStep\(visibleStepOrder, step, 'back'\)/);
  assert.match(flow, /if \(previous != null\) goToStep\(previous, 'back'\)/);
});

test('retained render handlers follow the active sequence rather than hard-coded branch targets', () => {
  for (const step of [...intro.filter((step) => step !== 'intent'), 'communityProof', 'goalProof', 'habitsToBreak', 'cbtFamiliarity', 'cbtIntro', 'routineBrain', ...originalHabitModule, ...sleepAssessment, ...assessment, ...personalContext, ...planAndCompletion]) {
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

test('sleep symptoms describe the problem separately from its cause', () => {
  const [symptom, tried, impact] = intentFollowUpsFor('sleep');
  assert.equal(symptom.question, 'Which part of sleep is hardest for you?');
  assert.deepEqual(symptom.options.map(({ id, title }) => [id, title]), [
    ['falling', 'Falling asleep'],
    ['waking', 'Staying asleep'],
    ['tooEarly', 'Waking too early'],
    ['unrested', 'Waking up unrested'],
    ['all', 'Several of these'],
  ]);
  assert.equal(tried.question, 'What have you already tried to improve your sleep?');
  assert.equal(impact.question, 'What would better sleep help you with most?');
  for (const { id, echo } of symptom.options) {
    assert.equal(SLEEP_CAUSE_OPTIONS.some((cause) => cause.echo === echo), false,
      'the symptom does not ask for the same authored cause again');
    assert.equal(onboardingPresetFor('sleep', { followUpAnswers: { when_sleep: [id] } }).id, 'night');
    assert.equal(onboardingPresetFor('sleep', {
      followUpAnswers: { when_sleep: [id] }, sleepCause: 'phone',
    }).id, 'phone', 'the canonical phone cause still chooses the phone plan');
  }
  assert.equal(onboardingPresetFor('sleep', {
    followUpAnswers: { when_sleep: ['phone'] },
  }).id, 'phone', 'legacy phone answers remain readable');
});

test('sleep-primary questions clarify quantity, getting up, and barriers without changing other goals', () => {
  for (const [step, sleepCopy, otherCopy] of [
    ['sleepDuration', 'How many hours do you usually sleep?', 'How has sleep been lately?'],
    ['wakeEase', 'How easy is it to get out of bed?', 'How do mornings usually start?'],
    ['sleepCause', 'What makes it hard to settle at night?', 'What makes it hardest to switch off at night?'],
  ]) {
    const expression = stepBlock(step).match(/question=\{([^}]+)\}/)[1];
    const questionFor = new Function('primaryIntent', `return (${expression})`);
    assert.equal(questionFor('sleep'), sleepCopy);
    for (const intent of [...intents, null].filter((intent) => intent !== 'sleep')) {
      assert.equal(questionFor(intent), otherCopy);
    }
  }
  assert.match(stepBlock('habitsToBreak'), /question="What habits would you like to break\?"/);
  assert.match(stepBlock('habitsToBreak'), /options=\{habitsToBreakFor\(primaryIntent \?\? 'other'\)\}/);
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
    assert.equal(adjacentOnboardingStep(steps, 'sleepTime', 'forward'), intent === 'sleep' ? 'wakeTime' : 'planBoost');
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
    assert.deepEqual(focus.procrastinationReasons, ['overwhelmed']);
    assert.deepEqual(focus.procrastinationAreas, ['chores']);
    const stress = activeOnboardingContext(stepsFor('stress_relief'), answers);
    assert.equal(stress.stressLevel, 9);
    assert.equal(stress.stressSignal, 'racing');
    const cleaning = activeOnboardingContext(stepsFor('cleaning'), answers);
    assert.equal(cleaning.sleepCause, 'phone');
    assert.equal(cleaning.sleepQuality, 2);
    assert.equal(cleaning.stressLevel, 9);
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
    dayEnergy: null, routineHappiness: null, choresOverwhelm: 'often',
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
        assert.ok(steps.indexOf(shared) < steps.indexOf('dailyTime'));
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
    const start = steps.indexOf('routineHappiness');
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
    // The distraction question leads straight into the brain-science block.
    assert.equal(adjacentOnboardingStep(steps, 'habitsFocusInsight', 'back'), 'distraction');
    assert.equal(adjacentOnboardingStep(steps, 'habitsFocusInsight', 'forward'),
      'habitsFocusScience1');
  }
  assert.match(stepBlock('habitsFocusInsight'), /<HabitsFocusInsightScreen/);
  assert.match(stepBlock('habitsFocusScience1'), /You are not lazy\. Your brain is protecting you\./);
  assert.match(stepBlock('habitsFocusScience2'), /What feels like laziness is often your brain trying to protect you from uncertainty, effort, or emotional risk\./);
  assert.match(stepBlock('habitsFocusScience3'), /Azora uses brain-based techniques to help you follow through one step at a time\./);
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
    assert.equal(adjacentOnboardingStep(steps, 'sleepTime', 'forward'), intent === 'sleep' ? 'wakeTime' : 'planBoost');
    assert.equal(adjacentOnboardingStep(steps, 'planBoost', 'forward'), 'planIntro');
    assert.equal(adjacentOnboardingStep(steps, 'diagnosis', 'back'), 'planIntro');
    assert.equal(adjacentOnboardingStep(steps, 'recommendedExercise', 'back'), 'planPersonalization');
  }
  for (const [step, phase] of [['diagnosis', 'diagnosis'], ['recommendedExercise', 'plan']]) {
    const render = stepBlock(step);
    assert.match(render, /return \(\s*<PlanRevealScreen/);
    assert.match(render, new RegExp(`phase="${phase}"`));
    assert.match(render, /\{\.\.\.planRevealProps\(\)\}/);
  }
  assert.match(flow, /scores: planMindMap\.scores/);
  // The report is where the user's shape is shown growing toward the plan's aim,
  // so both reports are handed the projected scores and the phase decides.
  assert.match(flow, /targetScores: projectScores\(planMindMap\.scores\)/);
  assert.match(flow, /import \{ projectScores \} from '\.\.\/\.\.\/lib\/paywallPersonalization'/);
  // The coloured cards under the pentagon are gone from both reports.
  const revealScreen = readFileSync(
    new URL('./screens/PlanRevealScreen.tsx', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(revealScreen, /ReportTiles/);
  assert.doesNotMatch(revealScreen, /'Plan length'|'Your pace'|'Your superpower'|'Needs care'/);
  assert.doesNotMatch(revealScreen, /superpower|growthArea/);
  assert.match(revealScreen, /<MindMapRadar/, 'the pentagon itself stays');
  assert.match(revealScreen, /showTarget=\{phase === 'plan'\}/, 'the aim grows on the report only');
  // Faint rings stay below the opaque shapes and only show outside them.
  const radar = readFileSync(
    new URL('./MindMapRadar.tsx', import.meta.url),
    'utf8',
  );
  assert.ok(
    radar.indexOf('RING_SHARES.map') < radar.indexOf('<GoalSlice'),
    'the ring outlines are drawn beneath the colored shapes',
  );
  assert.doesNotMatch(radar, /TARGET_FILL_OPACITY/);
  assert.match(revealScreen, /<View style=\{styles\.divider\} \/>/, 'the report still separates its sections');
  // The Harvard proof strip closes both reports, the plan one included, so it
  // stays unconditional: gating it on the phase drops it from the plan report.
  assert.match(
    revealScreen,
    /<View style=\{styles\.divider\} \/>\s*<OnboardingProofStrip \/>/,
    'the proof strip closes the report in both phases',
  );
  // The report promises the outcome; the profile keeps its own title.
  assert.match(revealScreen, /plan: 'Here’s where you’ll be after your plan'/);
  assert.match(revealScreen, /diagnosis: 'Your Azora personality profile'/);
  assert.doesNotMatch(revealScreen, /Here’s your personalized plan/);
  // The report names who the user becomes; the plan's own name stays on the
  // screens that are about the plan itself (plan days, insights).
  assert.match(revealScreen, /eyebrow: 'Who you’re becoming'/);
  assert.match(revealScreen, /name: archetype\.futureName/);
  assert.doesNotMatch(revealScreen, /archetype\.planName/);
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
  assert.equal(adjacentOnboardingStep(freshSteps, 'intent', 'forward'), 'usageStyle');
});

test('only the goal question changes to single selection while follow-up and habit questions retain their modes', () => {
  const goalScreen = readFileSync(new URL('./screens/IntentQuestionScreen.tsx', import.meta.url), 'utf8');
  assert.match(goalScreen, /title="What would you like to focus on right now\?"/);
  assert.match(goalScreen, /subtitle="Pick whichever feels most important — we’ll start small, and you can change this anytime\."/);
  assert.match(goalScreen, /multiSelect=\{false\}/);
  assert.match(goalScreen, /const selectedIntent = selectedIntents\[0\] \?\? null/);
  assert.match(goalScreen, /canContinue = selectedIntent != null && !isSubmitting/);
  assert.match(goalScreen, /selectedIds=\{selectedIntent == null \? \[\] : \[selectedIntent\]\}/);
  assert.match(goalScreen, /onSelect=\{onSelect\}/);
  // The one single-select list that waits for Continue holds its pick visibly.
  assert.match(goalScreen, /\n        showSelectionMark\n/);
  assert.match(flow, /onSelect=\{selectIntent\}/);
  assert.match(stepBlock('procrastinationArea'), /\n        multiSelect\n/);
  assert.match(flow, /multiSelect=\{question\.multiSelect\}/);
  assert.equal(intentFollowUpsFor('cleaning').find(({ id }) => id === 'cleaning_barriers').multiSelect, true);
  assert.match(flow, /useState<OnboardingIntent\[\]>\(savedIntents\)/);
});


test('the plan build stops to ask its two questions and the answers reach the plan', () => {
  const loader = readFileSync(
    new URL('./screens/PlanLoadingScreen.tsx', import.meta.url),
    'utf8',
  );
  assert.match(loader, /export type PlanLoadingInterruptId = 'sessionTime' \| 'followThrough'/);
  assert.match(loader, /question: 'When do the hard moments usually hit\?'/);
  assert.match(loader, /question: 'Do you usually finish what you start\?'/);
  assert.match(loader, /interrupts: INTERRUPT_POINTS/, 'the run pauses at the question points');
  assert.match(loader, /<InterruptPrompt/, 'the question is asked over the running build');
  assert.match(loader, /onAnswerInterrupt\(interrupt\.id, answer\)/);
  assert.match(loader, /resume\(\)/, 'answering resumes the build');

  const body = flow.match(
    /const handlePlanLoadingAnswer = \(\n    id: PlanLoadingInterruptId,\n    answer: string,\n  \) => \{([\s\S]*?)\n  \};/,
  )[1];
  let overrides = {};
  const events = [];
  const handle = new Function(
    'setPlanTimeOverrides', 'trackOnboardingStepCompleted', 'getStepEventInput',
    'PLAN_MORNING_MIN', 'PLAN_EVENING_MIN',
    `return (id, answer) => {${body}};`,
  )(
    (update) => { overrides = update(overrides); },
    (event) => { events.push(event); },
    () => ({ step: 'planLoading', stepIndex: 1, stepCount: 1 }),
    PLAN_MORNING_MIN,
    PLAN_EVENING_MIN,
  );

  handle('sessionTime', 'morning');
  assert.equal(overrides.session, PLAN_MORNING_MIN);
  handle('sessionTime', 'evening');
  assert.equal(overrides.session, PLAN_EVENING_MIN);
  handle('followThrough', 'not_really');
  assert.equal(overrides.session, PLAN_EVENING_MIN, 'followThrough moves no plan time');
  assert.deepEqual(
    events.map(({ step, action, properties }) => [
      step,
      action,
      properties.plan_loading_interrupt,
      properties.plan_loading_answer,
    ]),
    [
      ['planLoading', 'continue', 'sessionTime', 'morning'],
      ['planLoading', 'continue', 'sessionTime', 'evening'],
      ['planLoading', 'continue', 'followThrough', 'not_really'],
    ],
  );
});


test('the plan build names its four steps and puts the goal in the second one', () => {
  const loader = readFileSync(
    new URL('./screens/PlanLoadingScreen.tsx', import.meta.url),
    'utf8',
  );
  // The step list as the screen builds it, with its type annotations off.
  const [source] = loader.match(
    /function buildSteps\(goalNoun: string\): BuildStep\[\] \{[\s\S]*?\n\}/,
  );
  const buildSteps = new Function(
    `return (${source.replace('(goalNoun: string): BuildStep[]', '(goalNoun)')});`,
  )();

  const steps = buildSteps(planNounForIntent('sleep'));
  assert.deepEqual(
    steps.map(({ label }) => label),
    [
      'Defining your goals',
      'Making your sleep plan',
      'Analyzing your habits',
      'Building your daily routine',
      'Personalizing your first step',
    ],
  );
  for (const { label, icon } of steps) {
    // The drawn set the question lists use. A Material name would render as a
    // line glyph beside them, which is what this card must not drift into.
    assert.ok(
      Object.hasOwn(OPTION_ICON_PATHS, icon),
      `${label}: “${icon}” is not one of the app's own option icons`,
    );
  }
  assert.equal(
    new Set(steps.map(({ label }) => label)).size,
    steps.length,
    'the rows are keyed by their label, so no two may repeat',
  );

  // The second row names whichever goal was chosen; the neutral noun is the fallback.
  assert.equal(buildSteps(planNounForIntent('cleaning'))[1].label, 'Making your home reset plan');
  assert.equal(buildSteps(planNounForIntent(undefined))[1].label, 'Making your calm plan');

  // The status line is the running row, so the two can never drift apart.
  assert.match(loader, /`\$\{steps\[statusIndex\]\.label\}\.\.\.`/);
  assert.match(loader, /<Text style=\{styles\.cardTitle\}>We&apos;re setting your transformation<\/Text>/);
  assert.doesNotMatch(loader, /Making it fit your life|Fitting it into your day|Your first step/);
});

test('the intro after the goal keeps its plain headline', () => {
  const screen = readFileSync(
    new URL('./screens/PersonalizeIntroScreen.tsx', import.meta.url),
    'utf8',
  );
  assert.match(screen, /Congrats on taking the first step to change!/);
  assert.match(screen, /You can change your answer anytime in Settings\./);
  assert.doesNotMatch(screen, /goalPhrase/);
  assert.doesNotMatch(stepBlock('personalizeIntro'), /goalPhrase/);
});

test('the plan build opens on the intro, waits, then reveals and closes on the habit curve', () => {
  for (const intent of intents) {
    const steps = stepsFor(intent);
    assert.equal(steps.filter((step) => step === 'planLoading').length, 1, intent);
    assert.equal(adjacentOnboardingStep(steps, 'planBoost', 'forward'), 'planIntro');
    assert.equal(adjacentOnboardingStep(steps, 'planIntro', 'forward'), 'planLoading');
    assert.equal(adjacentOnboardingStep(steps, 'planLoading', 'forward'), 'diagnosis');
    assert.equal(adjacentOnboardingStep(steps, 'planIntro', 'back'), 'planBoost');
    assert.equal(adjacentOnboardingStep(steps, 'planLoading', 'back'), 'planIntro');
    assert.equal(adjacentOnboardingStep(steps, 'diagnosis', 'back'), 'planIntro',
      'Back returns to the last real question, not the wait');
    assert.equal(adjacentOnboardingStep(steps, 'recommendedHabits', 'forward'), 'habitPicks');
    assert.equal(adjacentOnboardingStep(steps, 'habitPicks', 'forward'), 'habitCurve');
    assert.equal(adjacentOnboardingStep(steps, 'habitCurve', 'forward'), 'acquisitionSource');
  }
  const intro = stepBlock('planIntro');
  assert.match(intro, /<PlanIntroScreen/);
  assert.match(intro, /name=\{name\.trim\(\) \|\| null\}/);
  assert.match(intro, /onContinue=\{\(\) => goNext\('continue'\)\}/);
  assert.match(intro, /onBack=\{goBack\}/);
  const wait = stepBlock('planLoading');
  assert.match(wait, /<PlanLoadingScreen/);
  assert.match(wait, /intent=\{primaryIntent \?\? 'other'\}/);
  assert.match(wait, /onDone=\{\(\) => goNext\('auto'\)\}/);
  assert.match(wait, /onAnswerInterrupt=\{handlePlanLoadingAnswer\}/);
  const curve = stepBlock('habitCurve');
  assert.match(curve, /<HabitCurveScreen/);
  assert.match(curve, /intent=\{\s*primaryIntent \?\?/);
  assert.match(curve, /onContinue=\{\(\) => goNext\('continue'\)\}/);
  assert.match(curve, /onBack=\{goBack\}/);
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
  assert.equal(current, 'usageStyle');
  assert.equal(events.at(-1).properties.primary_intent_id, 'cleaning');
  assert.deepEqual(selected, ['cleaning']);
  current = adjacentOnboardingStep(order(), current, 'back');
  assert.equal(current, 'intent');
  assert.deepEqual(selected, ['cleaning']);
  select('focus');
  continueFromGoal();
  assert.equal(current, 'usageStyle');
  assert.deepEqual(selected, ['focus']);
  assert.equal(primary, 'focus');
  goNext('continue');
  assert.equal(current, 'personalizeIntro');
  goNext('continue');
  assert.equal(current, 'communityProof');
  goNext('continue');
  assert.equal(current, 'intentDepth1');
  current = adjacentOnboardingStep(order(), current, 'back');
  assert.equal(current, 'communityProof');
  current = adjacentOnboardingStep(order(), current, 'back');
  assert.equal(current, 'personalizeIntro');
  current = adjacentOnboardingStep(order(), current, 'back');
  assert.equal(current, 'usageStyle');
  current = adjacentOnboardingStep(order(), current, 'back');
  assert.equal(current, 'intent');
  current = adjacentOnboardingStep(order(), current, 'back');
  assert.equal(current, 'greeting');
  const legacy = onboardingStepOrder('sleep', 2, 3);
  assert.equal(adjacentOnboardingStep(legacy, 'intent', 'forward'), 'intentPriority');
  assert.equal(adjacentOnboardingStep(legacy, 'intentPriority', 'forward'), 'usageStyle');
  assert.equal(adjacentOnboardingStep(legacy, 'personalizeIntro', 'back'), 'usageStyle');
  assert.match(stepBlock('personalizeIntro'), /onContinue=\{\(\) => goNext\('continue'\)\}/);
  assert.match(stepBlock('personalizeIntro'), /onBack=\{goBack\}/);
});


test('goal proof follows personalized questions and the early sleep assessment when sleep is primary', () => {
  for (const intent of intents) {
    const steps = stepsFor(intent);
    const finalDepth = INTENT_DEPTH_STEPS[intentFollowUpsFor(intent).length - 1];
    const beforeProof = intent === 'sleep' ? 'sleepInsight' : finalDepth;
    assert.equal(steps.filter((step) => step === 'goalProof').length, 1);
    assert.equal(steps.indexOf('goalProof'), steps.indexOf(beforeProof) + 1);
    assert.equal(adjacentOnboardingStep(steps, beforeProof, 'forward'), 'goalProof');
    assert.equal(adjacentOnboardingStep(steps, 'goalProof', 'back'), beforeProof);
    // The proof hands straight to the daily-life section; the habit question
    // waits for the last personal answer, right before the plan's settings.
    assert.equal(adjacentOnboardingStep(steps, 'goalProof', 'forward'), 'routineHappiness');
    assert.equal(adjacentOnboardingStep(steps, 'routineHappiness', 'back'), 'goalProof');
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
  assert.match(stepBlock('habitsFocusScience3'), /highlights=\{\['brain-based techniques', 'follow through'\]\}/);
});

test('the restored social proof and personal context steps sit in the flow for every goal', () => {
  for (const intent of intents) {
    const steps = stepsFor(intent);
    assert.equal(adjacentOnboardingStep(steps, 'personalizeIntro', 'forward'), 'communityProof');
    assert.equal(adjacentOnboardingStep(steps, 'communityProof', 'forward'), 'intentDepth1');
    assert.equal(adjacentOnboardingStep(steps, 'halfway', 'forward'), intent === 'sleep' ? 'age' : 'sleep');
    assert.equal(adjacentOnboardingStep(steps, 'sleepInsight', 'forward'), intent === 'sleep' ? 'goalProof' : 'age');
    assert.equal(adjacentOnboardingStep(steps, 'gender', 'forward'), 'stress');
    assert.equal(adjacentOnboardingStep(steps, 'stressAwareness', 'forward'), 'piecesTogether');
    assert.equal(adjacentOnboardingStep(steps, 'piecesTogether', 'forward'), 'supportSystem');
    assert.equal(adjacentOnboardingStep(steps, 'supportSystem', 'forward'), 'mentalHealth');
    assert.equal(adjacentOnboardingStep(steps, 'mentalHealth', 'forward'), 'struggles');
    assert.equal(adjacentOnboardingStep(steps, 'struggles', 'forward'), 'homeAtmosphere');
    assert.equal(adjacentOnboardingStep(steps, 'homeFeeling', 'forward'), 'beforeAfter');
    assert.equal(adjacentOnboardingStep(steps, 'homeAtmosphere', 'forward'), 'habitsToBreak');
    assert.equal(adjacentOnboardingStep(steps, 'habitsToBreak', 'forward'), 'cbtFamiliarity');
    assert.equal(adjacentOnboardingStep(steps, 'habitsToBreak', 'back'), 'homeAtmosphere');
    // The three teaching screens close the question phase as one run, right
    // before the plan's own settings.
    assert.equal(adjacentOnboardingStep(steps, 'cbtFamiliarity', 'forward'), 'cbtIntro');
    assert.equal(adjacentOnboardingStep(steps, 'cbtIntro', 'forward'), 'routineBrain');
    assert.equal(adjacentOnboardingStep(steps, 'routineBrain', 'forward'), 'dailyTime');
    assert.equal(adjacentOnboardingStep(steps, 'routineBrain', 'back'), 'cbtIntro');
    assert.equal(adjacentOnboardingStep(steps, 'cbtFamiliarity', 'back'), 'habitsToBreak');
    assert.equal(adjacentOnboardingStep(steps, 'sleepTime', 'forward'), intent === 'sleep' ? 'wakeTime' : 'planBoost');
    assert.equal(adjacentOnboardingStep(steps, 'planBoost', 'forward'), 'planIntro');
    assert.equal(adjacentOnboardingStep(steps, 'acquisitionSource', 'forward'), 'doctorReferral');
    assert.equal(adjacentOnboardingStep(steps, 'doctorReferral', 'forward'), 'attPriming');
    for (const step of [...sleepAssessment, ...assessment, ...personalContext, 'doctorReferral', 'communityProof', 'planBoost', 'planIntro', 'planLoading', 'habitCurve']) {
      assert.equal(steps.filter((entry) => entry === step).length, 1, `${intent} ${step}`);
    }
  }
});

test('pieces together builds its subtitle from selected answers and live assessment context', () => {
  const render = stepBlock('piecesTogether');
  assert.match(render, /const contextQuestion = intentFollowUps\[0\]/);
  assert.match(render, /const subtitle = buildPiecesTogetherSubtitle\(\{/);
  assert.match(render, /goalPhrase: chosenGoalPhrase\(primaryIntent, selectedIntents\)/);
  assert.match(render, /contextEcho: echoOption\(\s*contextQuestion.options,\s*intentFollowUpAnswers\[contextQuestion.id\] \?\? \[\]/);
  assert.match(render, /energyEcho: echoSingle\(DAY_ENERGY_OPTIONS, activeContext.dayEnergy\)/);
  assert.match(render, /sleepEcho: echoSingle\(SLEEP_CAUSE_OPTIONS, activeContext.sleepCause\)/);
  assert.match(render, /stressEcho: activeContext.stressLevel == null \? null : describeStressBand\(activeContext.stressLevel\)/);
  assert.match(render, /subtitle=\{subtitle\}/);
});

test('the restored question screens keep their copy and selection modes', () => {
  assert.match(stepBlock('communityProof'), /<CommunityProofScreen/);
  assert.match(stepBlock('sleepInsight'), /<SleepInsightScreen/);
  assert.match(stepBlock('piecesTogether'), /<PiecesTogetherScreen/);
  const sleepInsight = readFileSync(
    new URL('./screens/SleepInsightScreen.tsx', import.meta.url),
    'utf8',
  );
  assert.match(sleepInsight, /Sleep is often\{' '\}/);
  assert.match(sleepInsight, /<Text style=\{styles\.emphasis\}>the first thing to slip<\/Text>/);
  assert.doesNotMatch(sleepInsight, /58%/, 'the unsourced statistic stays out');
  const piecesTogether = readFileSync(
    new URL('./screens/PiecesTogetherScreen.tsx', import.meta.url),
    'utf8',
  );
  assert.match(piecesTogether, /Azora puts <Text style=\{styles\.emphasis\}>all the pieces<\/Text>/);
  assert.match(piecesTogether, /subtitle: string/);
  assert.match(piecesTogether, /subtitle=\{subtitle\}/);
  assert.match(piecesTogether, /image="azoPuzzle"/);
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
  assert.match(stepBlock('homeAtmosphere'), /question="How do you want to feel a few weeks from now\?"/);
  assert.doesNotMatch(stepBlock('homeAtmosphere'), /note=/);
  // No question carries a "choose all that apply" hint: multi-select questions
  // all take the same shape.
  assert.doesNotMatch(flow, /Choose all that apply/);
  assert.match(stepBlock('homeAtmosphere'), /options=\{HOME_ATMOSPHERE_OPTIONS\}/);
  assert.match(stepBlock('homeAtmosphere'), /\n        multiSelect\n/);
  assert.match(stepBlock('habitsToBreak'), /question="What habits would you like to break\?"/);
  // No hint line either: it is one of the plain multi-select questions.
  assert.doesNotMatch(stepBlock('habitsToBreak'), /note=/);
  // The rows come from the goal, so a cleaning run reads about dishes and laundry.
  assert.match(stepBlock('habitsToBreak'), /options=\{habitsToBreakFor\(primaryIntent \?\? 'other'\)\}/);
  assert.match(stepBlock('habitsToBreak'), /\n        multiSelect\n/);
  // The method screen keeps its explainer line and single selection: it is the
  // only question that teaches a term the user may not know.
  assert.match(stepBlock('cbtFamiliarity'), /question="How familiar are you with CBT\?"/);
  assert.match(stepBlock('cbtFamiliarity'), /note="CBT stands for cognitive behavioral therapy/);
  assert.match(stepBlock('cbtFamiliarity'), /options=\{CBT_FAMILIARITY_OPTIONS\}/);
  assert.doesNotMatch(stepBlock('cbtFamiliarity'), /\n        multiSelect\n/);
  // The chalkboard lesson, not the routine one, and it hands to the proof.
  assert.match(stepBlock('cbtIntro'), /<ChalkboardScreen/);
  assert.match(stepBlock('cbtIntro'), /lesson="cbtIntro"/);
  assert.match(stepBlock('doctorReferral'), /<DoctorReferralScreen/);
  const dailyTime = readFileSync(
    new URL('./screens/DailyTimeScreen.tsx', import.meta.url),
    'utf8',
  );
  assert.match(dailyTime, /question="How much time can you give every day\?"/);
  assert.match(dailyTime, /options=\{DAILY_TIME_BANDS\}/);
  assert.match(stepBlock('planBoost'), /question="What would make your plan more fun and helpful\?"/);
  assert.match(stepBlock('planBoost'), /options=\{PLAN_BOOST_OPTIONS\}/);
  assert.match(stepBlock('planBoost'), /\n        multiSelect\n/);
});
