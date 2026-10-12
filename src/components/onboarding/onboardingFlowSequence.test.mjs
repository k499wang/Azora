import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { intentFollowUpsFor } from './data/intentFollowUps.ts';

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

function transitionFromBlock(block, prop, primaryIntent) {
  const call = block.match(new RegExp(`${prop}=\\{[\\s\\S]*?goToStep\\(([^,]+),\\s*'([^']+)'`));
  assert.ok(call, `missing ${prop} transition`);
  return {
    target: new Function('primaryIntent', `return ${call[1]};`)(primaryIntent),
    action: call[2],
  };
}

function assertTransition(step, prop, target, action, cleaningTarget = target) {
  for (const [intent, expected] of [['focus', target], ['cleaning', cleaningTarget]]) {
    assert.deepEqual(transitionFromBlock(stepBlock(step), prop, intent), { target: expected, action },
      `${step}.${prop} should go to ${expected} as ${action} for ${intent}`);
  }
}

const allSteps = [...flow.match(/const STEP_ORDER: OnboardingStep\[\] = \[([\s\S]*?)\n\];/)[1]
  .matchAll(/^  '([^']+)',/gm)].map((match) => match[1]);
const depthSteps = [...flow.match(/const INTENT_DEPTH_STEPS = \[([\s\S]*?)\] as const;/)[1]
  .matchAll(/'([^']+)'/g)].map((match) => match[1]);
const cleaningReplacedSteps = new Set([...flow.match(/const CLEANING_REPLACED_STEPS = new Set<OnboardingStep>\(\[([\s\S]*?)\]\);/)[1]
  .matchAll(/'([^']+)'/g)].map((match) => match[1]));
const visibleFilterSource = flow.match(/STEP_ORDER.filter\(\(candidate\) => \{([\s\S]*?)\n      \}\),/)[1]
  .replaceAll(' as IntentDepthStep', '');
const visible = new Function('candidate', 'INTENT_DEPTH_STEPS', 'intentFollowUps', 'INTENT_REFLECTION_ENABLED', 'selectedIntents', 'primaryIntent', 'CLEANING_REPLACED_STEPS', visibleFilterSource);
function visibleSteps(intent, selectedIntents = [intent]) {
  return allSteps.filter((candidate) => visible(candidate, depthSteps, intentFollowUpsFor(intent), false, selectedIntents, intent, cleaningReplacedSteps));
}

test('new users enter the Azo chat while saved profiles still resume at the paywall', () => {
  assert.match(
    flow,
    /initialSavedProfile == null \? 'azoChatInvite' : 'paywall'/,
  );
  assert.doesNotMatch(flow, /AzoStoryScreen|AZO_STORY/);
});

test('the flow preserves chat answers when personalization returns to the chat', () => {
  assert.match(flow, /const \[azoChatAnswers, setAzoChatAnswers\] = useState<string\[\]>\(\[\]\)/);
  assert.match(stepBlock('azoChat'), /answers=\{azoChatAnswers\}/);
  assert.match(stepBlock('azoChat'), /onAnswersChange=\{setAzoChatAnswers\}/);
  assertTransition('name', 'onBack', 'azoChat', 'back');
});

test('the name follows the chat and the method follows the goal', () => {
  const orderSource = flow.slice(
    flow.indexOf('const STEP_ORDER'),
    flow.indexOf('const BASE_STEP_INDEX'),
  );
  const steps = [...orderSource.matchAll(/'([^']+)'/g)].map((match) => match[1]);
  const sequence = [
    'azoChatInvite',
    'azoChat',
    'name',
    'greeting',
    'personalizeIntro',
    'intent',
    'intentPriority',
    'intentReflection',
    'intentDepth1',
    'intentDepth2',
    'intentDepth3',
    'intentDepth4',
    'intentDepth5',
    'intentDepth6',
    'piecesTogether',
    'analyzeIntent',
    'scienceCredibility',
    'cbtFamiliarity',
    'cbtIntro',
    'goalProof',
    'dayActivity',
  ];

  assert.deepEqual(
    steps.slice(0, sequence.length),
    sequence,
  );
});

test('onboarding steps retain coherent navigation', () => {
  assertTransition('azoChatInvite', 'onContinue', 'azoChat', 'continue');
  assertTransition('azoChat', 'onBack', 'azoChatInvite', 'back');
  assertTransition('azoChat', 'onContinue', 'name', 'continue');
  assertTransition('name', 'onBack', 'azoChat', 'back');
  assertTransition('name', 'onContinue', 'greeting', 'continue');
  assertTransition('name', 'onSkip', 'greeting', 'skip');
  assertTransition('greeting', 'onBack', 'name', 'back');
  assertTransition('greeting', 'onContinue', 'personalizeIntro', 'continue');
  assertTransition('personalizeIntro', 'onBack', 'greeting', 'back');
  assertTransition('personalizeIntro', 'onContinue', 'intent', 'continue');
  assert.match(
    flow,
    /<IntentQuestionScreen[\s\S]*?onBack=\{\(\) => goToStep\('personalizeIntro', 'back'\)\}/,
  );
  assert.match(
    stepBlock('piecesTogether'),
    /onBack=\{\(\) => goToStep\(activeIntentDepthSteps\[activeIntentDepthSteps.length - 1\], 'back'\)\}/,
  );
  assertTransition('piecesTogether', 'onContinue', 'analyzeIntent', 'continue');
  assertTransition('analyzeIntent', 'onDone', 'scienceCredibility', 'auto');
  // The goal follow-ups appear before the flow moves on, so the
  // first screen after the analysis steps back into the last of them.
  assertTransition('scienceCredibility', 'onBack', 'piecesTogether', 'back');
  assertTransition('scienceCredibility', 'onContinue', 'cbtFamiliarity', 'continue');
  assertTransition('cbtFamiliarity', 'onBack', 'scienceCredibility', 'back');
  assertTransition('cbtFamiliarity', 'onContinue', 'cbtIntro', 'continue');
  assertTransition('cbtFamiliarity', 'onSkip', 'cbtIntro', 'skip');
  assertTransition('cbtIntro', 'onBack', 'cbtFamiliarity', 'back');
  assertTransition('cbtIntro', 'onContinue', 'goalProof', 'continue');
  assertTransition('goalProof', 'onBack', 'cbtIntro', 'back');
  assert.match(
    flow,
    /INTENT_DEPTH_STEPS = \[\s*'intentDepth1',\s*'intentDepth2',\s*'intentDepth3',/,
  );
  assert.match(
    flow,
    /intentFollowUps\[followUpIndex\]/,
    'the depth screens read their question from the chosen intent',
  );
  // Focus and habits, then sleep, then the load they carry.
  assertTransition('goalProof', 'onContinue', 'dayActivity', 'continue');
  assertTransition('dayActivity', 'onBack', 'goalProof', 'back');
  assertTransition('sleepInsight', 'onContinue', 'age', 'continue');
  assertTransition('age', 'onBack', 'sleepInsight', 'back');
  assertTransition('sleepInsight', 'onBack', 'sleepCause', 'back');
  assertTransition('age', 'onContinue', 'gender', 'continue');
  assertTransition('gender', 'onBack', 'age', 'back');
  assertTransition('gender', 'onContinue', 'stress', 'continue');
  assertTransition('gender', 'onSkip', 'stress', 'skip');
  assertTransition('stress', 'onBack', 'gender', 'back');
  assertTransition('stress', 'onContinue', 'stressSignal', 'continue');
  assertTransition('stress', 'onSkip', 'stressSignal', 'skip');
  assertTransition('stressSignal', 'onBack', 'stress', 'back');
  assertTransition('stressSignal', 'onContinue', 'stressAwareness', 'continue');
  assertTransition('stressAwareness', 'onBack', 'stressSignal', 'back');
  assertTransition('stressAwareness', 'onContinue', 'breathingFamiliarity', 'continue');
  assertTransition('stressAwareness', 'onSkip', 'breathingFamiliarity', 'skip');
  assertTransition('breathingFamiliarity', 'onBack', 'stressAwareness', 'back');
  assertTransition('breathingFamiliarity', 'onContinue', 'heartVariability', 'continue');
  assertTransition('breathingFamiliarity', 'onSkip', 'heartVariability', 'skip');
  assertTransition('heartVariability', 'onContinue', 'overwhelmResponse', 'continue');
  assertTransition('heartVariability', 'onBack', 'breathingFamiliarity', 'back');
  assertTransition('heartVariability', 'onSkip', 'overwhelmResponse', 'skip');
  assertTransition('overwhelmResponse', 'onBack', 'heartVariability', 'back');
  assertTransition('overwhelmResponse', 'onContinue', 'brainFog', 'continue');
  assertTransition('overwhelmResponse', 'onSkip', 'brainFog', 'skip');
  assertTransition('brainFog', 'onBack', 'overwhelmResponse', 'back');
  assertTransition('brainFog', 'onContinue', 'hiddenDrain', 'continue');
  assertTransition('brainFog', 'onSkip', 'hiddenDrain', 'skip');
  assertTransition('hiddenDrain', 'onBack', 'brainFog', 'back');
  assertTransition('hiddenDrain', 'onContinue', 'childhoodStress', 'continue');
  assertTransition('childhoodStress', 'onBack', 'hiddenDrain', 'back');
  assertTransition('childhoodStress', 'onContinue', 'lifeEvents', 'continue');
  assertTransition('childhoodStress', 'onSkip', 'lifeEvents', 'skip');
  assertTransition('lifeEvents', 'onBack', 'childhoodStress', 'back');
  assertTransition('lifeEvents', 'onContinue', 'supportSystem', 'continue');
  assertTransition('lifeEvents', 'onSkip', 'supportSystem', 'skip');
  assertTransition('supportSystem', 'onBack', 'lifeEvents', 'back');
  assertTransition('supportSystem', 'onContinue', 'mentalHealth', 'continue');
  assertTransition('supportSystem', 'onSkip', 'mentalHealth', 'skip');
  assertTransition('mentalHealth', 'onBack', 'supportSystem', 'back');
  assertTransition('mentalHealth', 'onContinue', 'analyzeLoad', 'continue');
  assertTransition('halfway', 'onContinue', 'sleep', 'continue');
  // The sleep module asks why, not just how it goes.
  assertTransition('wakeEase', 'onContinue', 'dayEnergy', 'continue');
  assertTransition('dayEnergy', 'onBack', 'wakeEase', 'back');
  assertTransition('dayEnergy', 'onContinue', 'sleepCause', 'continue');
  assertTransition('dayEnergy', 'onSkip', 'sleepCause', 'skip');
  assertTransition('sleepCause', 'onContinue', 'analyzeSleep', 'continue');
  assertTransition('sleepCause', 'onBack', 'dayEnergy', 'back');
  assertTransition('routineHappiness', 'onContinue', 'fallingBehind', 'continue');
  assertTransition('routineHappiness', 'onSkip', 'fallingBehind', 'skip');
  assertTransition('fallingBehind', 'onBack', 'routineHappiness', 'back');
  assertTransition('fallingBehind', 'onContinue', 'beforeAfter', 'continue');
  assertTransition('fallingBehind', 'onSkip', 'beforeAfter', 'skip');
  assertTransition('beforeAfter', 'onBack', 'fallingBehind', 'back');
  assertTransition('beforeAfter', 'onContinue', 'choresOverwhelm', 'continue', 'distraction');
  assertTransition('choresOverwhelm', 'onBack', 'beforeAfter', 'back');
  assertTransition('choresOverwhelm', 'onContinue', 'distraction', 'continue');
  assertTransition('distraction', 'onBack', 'choresOverwhelm', 'back', 'beforeAfter');
  assertTransition('distraction', 'onContinue', 'scrollInstead', 'continue');
  assertTransition('scrollInstead', 'onBack', 'distraction', 'back');
  assertTransition('scrollInstead', 'onContinue', 'socialMedia', 'continue');
  assertTransition('scrollInstead', 'onSkip', 'socialMedia', 'skip');
  assertTransition('socialMedia', 'onBack', 'scrollInstead', 'back');
  assertTransition('socialMedia', 'onContinue', 'procrastinationArea', 'continue', 'analyzeDays');
  assertTransition('socialMedia', 'onSkip', 'procrastinationArea', 'skip', 'analyzeDays');
  assertTransition('procrastinationArea', 'onBack', 'socialMedia', 'back');
  assertTransition('procrastinationReason', 'onContinue', 'analyzeDays', 'continue');
  // Every module closes on its own summary of what was just answered.
  assertTransition('analyzeDays', 'onDone', 'habitsFocusInsight', 'auto');
  assertTransition('habitsFocusInsight', 'onBack', 'procrastinationReason', 'back', 'socialMedia');
  assertTransition('habitsFocusInsight', 'onContinue', 'putOffGuilt', 'continue', 'habitsFocusScience1');
  assertTransition('putOffGuilt', 'onBack', 'habitsFocusInsight', 'back');
  assertTransition('putOffGuilt', 'onContinue', 'habitsFocusScience1', 'continue');
  assertTransition('habitsFocusScience1', 'onBack', 'putOffGuilt', 'back', 'habitsFocusInsight');
  assertTransition('habitsFocusScience1', 'onContinue', 'habitsFocusScience2', 'continue');
  assertTransition('habitsFocusScience2', 'onBack', 'habitsFocusScience1', 'back');
  assertTransition('habitsFocusScience2', 'onContinue', 'habitsFocusScience3', 'continue');
  assertTransition('habitsFocusScience3', 'onBack', 'habitsFocusScience2', 'back');
  assertTransition('habitsFocusScience3', 'onContinue', 'routineBrain', 'continue');
  assertTransition('routineBrain', 'onBack', 'habitsFocusScience3', 'back');
  assertTransition('routineBrain', 'onContinue', 'halfway', 'continue');
  assertTransition('halfway', 'onBack', 'routineBrain', 'back');
  assertTransition('analyzeLoad', 'onDone', 'homeFeeling', 'auto');
  assertTransition('homeFeeling', 'onBack', 'mentalHealth', 'back');
  assertTransition('homeFeeling', 'onContinue', 'acquisitionSource', 'continue');
  assertTransition('homeFeeling', 'onSkip', 'acquisitionSource', 'skip');
  assertTransition('acquisitionSource', 'onBack', 'homeFeeling', 'back');
  assertTransition('acquisitionSource', 'onContinue', 'doctorReferral', 'continue');
  assertTransition('acquisitionSource', 'onSkip', 'doctorReferral', 'skip');
  assertTransition('doctorReferral', 'onBack', 'acquisitionSource', 'back');
  assertTransition('doctorReferral', 'onContinue', 'expertReview', 'continue');
  assertTransition('doctorReferral', 'onSkip', 'expertReview', 'skip');
  assertTransition('expertReview', 'onBack', 'doctorReferral', 'back');
  assertTransition('expertReview', 'onContinue', 'communityProof', 'continue');
  assertTransition('communityProof', 'onBack', 'expertReview', 'back');
  assertTransition('communityProof', 'onContinue', 'dailyTime', 'continue');
  assertTransition('dailyTime', 'onBack', 'communityProof', 'back');
  // The house goal follows the rooms, before the permission asks.
  assertTransition('mochiRooms', 'onContinue', 'mochiHouse', 'continue');
  assertTransition('mochiHouse', 'onBack', 'mochiRooms', 'back');
  assertTransition('mochiHouse', 'onContinue', 'attPriming', 'continue');
  assertTransition('attPriming', 'onBack', 'mochiHouse', 'back');
  assertTransition('sleepTime', 'onContinue', 'planBoost', 'continue');
  assertTransition('planBoost', 'onBack', 'sleepTime', 'back');
  assertTransition('planBoost', 'onContinue', 'planIntro', 'continue');
  assertTransition('planBoost', 'onSkip', 'planIntro', 'skip');
  assertTransition('planIntro', 'onBack', 'planBoost', 'back');
});

test('the cleaning preview replaces the shared introduction only for the primary cleaning goal', () => {
  const block = stepBlock('piecesTogether');
  const selector = block.match(/const PreviewScreen = (.*);/)[1];
  const chooseScreen = new Function('primaryIntent', 'selectedIntents', 'CleaningPreviewScreen', 'PiecesTogetherScreen', `return ${selector};`);
  assert.equal(chooseScreen('cleaning', ['cleaning', 'focus'], 'cleanup', 'general'), 'cleanup');
  for (const intent of ['focus', 'sleep', 'other', null]) {
    assert.equal(chooseScreen(intent, ['cleaning', intent], 'cleanup', 'general'), 'general');
  }
  assert.match(block, /<PreviewScreen\b/);
  assertTransition('piecesTogether', 'onContinue', 'analyzeIntent', 'continue');
  assert.match(block, /onBack=\{\(\) => goToStep\(activeIntentDepthSteps\[activeIntentDepthSteps.length - 1\], 'back'\)\}/);
});

test('cleaning asks about home context and life impact without repeating its barriers', () => {
  const questions = intentFollowUpsFor('cleaning');
  assert.deepEqual(questions.map(({ id, question, multiSelect }) => [id, question, !!multiSelect]), [
    ['when_cleaning', 'Which area feels most stressful to start?', false],
    ['cleaning_barriers', 'What makes it hard for you to clean?', true],
    ['cleaning_impact', 'How is cleaning overwhelm affecting your life?', false],
    ['cleaning_living_situation', 'What is your current living situation?', false],
    ['cleaning_space_state', 'How clean is your space right now?', false],
    ['tidying_challenge', "What's the toughest part about keeping your home tidy?", false],
  ]);
  assert.equal(questions[2].echoLead, 'and to give you back');
  assert.deepEqual(questions[1].options.map(({ title }) => title), [
    'I feel too tired', 'I get overwhelmed', "I don't have time", "I don't enjoy it",
  ]);
  assert.deepEqual(questions[3].options.map(({ id }) => id), [
    'alone', 'partner', 'kids', 'family', 'roommates', 'other',
  ]);
  assert.deepEqual(questions[4].options.map(({ id }) => id), [
    'mostly_clean', 'cluttered', 'messy', 'overwhelming', 'varies',
  ]);
  assert.deepEqual(questions[5].options.map(({ title }) => title), [
    'Sticking to routines', 'Dealing with clutter', 'Managing messes from others',
    'Balancing work and chores', "Keeping up with kids' stuff",
  ]);
  for (const removed of ['tried_cleaning', 'stakes_cleaning']) {
    assert.equal(questions.some(({ id }) => id === removed), false);
  }
});

test('only cleaning adds follow-ups and all question and option ids stay unique', () => {
  const goals = [...intentFollowUps.matchAll(/^  ([a-z_]+): \{$/gm)].map((match) => match[1]);
  for (const intent of [null, 'other', ...goals]) {
    const questions = intentFollowUpsFor(intent);
    assert.equal(questions.length, intent === 'cleaning' ? 6 : 3, intent);
    assert.equal(new Set(questions.map(({ id }) => id)).size, questions.length);
    assert.ok(questions[2].echoLead, 'the stakes question stays at index 2');
    for (const question of questions) {
      assert.equal(new Set(question.options.map(({ id }) => id)).size, question.options.length);
      assert.ok(question.options.every(({ echo, icon }) => echo && icon));
    }
  }
});

test('Continue, Skip, Back and visible progress use the active follow-up chain', () => {
  const activeStepsSource = flow.match(/const activeIntentDepthSteps = (.*);/)[1];
  const navigationSource = flow.slice(flow.indexOf('    const previous ='), flow.indexOf('\n\n    return (', flow.indexOf('    const previous =')));
  const resolveNavigation = new Function('activeIntentDepthSteps', 'followUpIndex', 'INTENT_REFLECTION_ENABLED', 'isOnlyCustomIntent', 'selectedIntents', `${navigationSource}\nreturn { previous, next };`);
  for (const intent of ['cleaning', 'focus', null]) {
    const questions = intentFollowUpsFor(intent);
    const active = new Function('INTENT_DEPTH_STEPS', 'intentFollowUps', `return ${activeStepsSource};`)(depthSteps, questions);
    assert.equal(active.length, intent === 'cleaning' ? 6 : 3);
    assert.deepEqual(visibleSteps(intent).filter((candidate) => depthSteps.includes(candidate)), active);
    assert.equal(visibleSteps(intent).length, intent === 'cleaning' ? 78 : 79);
    assert.equal(visibleSteps(intent, ['cleaning', 'focus']).length, intent === 'cleaning' ? 79 : 80);
    for (let index = 0; index < active.length; index += 1) {
      const { previous, next } = resolveNavigation(active, index, false, false, ['cleaning']);
      assert.equal(previous, index === 0 ? 'intent' : active[index - 1]);
      assert.equal(next, active[index + 1] ?? 'piecesTogether');
    }
    assert.equal(resolveNavigation(active, 0, false, false, ['cleaning', 'focus']).previous, 'intentPriority');
    assert.equal(resolveNavigation(active, 0, true, false, ['cleaning']).previous, 'intentReflection');
  }
  assert.match(flow, /onContinue=\{\(id\) =>\s*goToStep\(next, 'continue'/);
  assert.match(flow, /onSkip=\{\(\) => goToStep\(next, 'skip'\)\}/);
  assert.match(flow, /onBack=\{\(\) => goToStep\(previous, 'back'\)\}/);
  assert.match(flow, /\[isOnlyCustomIntent, selectedIntents.length, intentFollowUps.length, primaryIntent\]/);
  assert.match(stepBlock('analyzeIntent'), /const stakesQuestion = intentFollowUps\[2\]/);
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

test('new answers toggle or replace without changing original answers and analytics retain every selected barrier', () => {
  const { update, properties } = answerCallbacks();
  const questions = intentFollowUpsFor('cleaning');
  const original = { when_cleaning: ['laundry'], cleaning_impact: ['relax'], when_focus: ['phone'] };
  let answers = update(questions[1], 'energy', original);
  answers = update(questions[1], 'freeze', answers);
  answers = update(questions[1], 'time', answers);
  assert.deepEqual(answers.cleaning_barriers, ['energy', 'freeze', 'time']);
  const event = properties(questions, answers);
  assert.equal(event.intent_cleaning_barriers, 'energy,freeze,time');
  assert.equal(event.intent_cleaning_barriers_count, 3);
  answers = update(questions[1], 'freeze', answers);
  assert.deepEqual(answers.cleaning_barriers, ['energy', 'time']);
  answers = update(questions[5], 'clutter', answers);
  answers = update(questions[5], 'routines', answers);
  assert.deepEqual(answers.tidying_challenge, ['routines']);
  assert.equal(properties(questions, answers, { questionId: questions[5].id, id: 'kids' }).intent_tidying_challenge, 'kids', 'single-choice advance records its just-tapped answer before a rerender');
  for (const [id, chosen] of Object.entries(original)) assert.deepEqual(answers[id], chosen);
  assert.equal(original.cleaning_barriers, undefined, 'updates never mutate earlier state');
  answers = update(questions[1], 'energy', answers);
  answers = update(questions[1], 'time', answers);
  assert.deepEqual(answers.cleaning_barriers, []);
  assert.equal(properties(questions, answers).intent_cleaning_barriers, null);
  assert.equal(properties(questions, answers).intent_cleaning_barriers_count, 0);
});

test('living situation, cleanliness and impact persist with their own analytics keys', () => {
  const { update, properties } = answerCallbacks();
  const questions = intentFollowUpsFor('cleaning');
  let answers = { cleaning_barriers: ['energy', 'time'] };
  for (const id of ['cleaning_living_situation', 'cleaning_space_state', 'cleaning_impact']) {
    const question = questions.find((question) => question.id === id);
    answers = update(question, question.options[0].id, answers);
    answers = update(question, question.options[1].id, answers);
    assert.deepEqual(answers[id], [question.options[1].id], 'a new single choice replaces the earlier answer');
    const event = properties(questions, answers);
    assert.equal(event[`intent_${id}`], question.options[1].id);
    assert.equal(event[`intent_${id}_count`], 1);
    assert.equal(properties(questions, answers, { questionId: id, id: question.options[2].id })[`intent_${id}`], question.options[2].id);
  }
  assert.deepEqual(answers.cleaning_barriers, ['energy', 'time']);
});

test('ten repeated chains preserve answers and adjust Back, Skip and analytics when the primary goal changes', () => {
  const { update, properties } = answerCallbacks();
  const depthSteps = [...flow.match(/const INTENT_DEPTH_STEPS = \[([\s\S]*?)\] as const;/)[1]
    .matchAll(/'([^']+)'/g)].map((match) => match[1]);
  const activeSource = flow.match(/const activeIntentDepthSteps = (.*);/)[1];
  const activeFor = new Function('INTENT_DEPTH_STEPS', 'intentFollowUps', `return ${activeSource};`);
  const navigationSource = flow.slice(flow.indexOf('    const previous ='), flow.indexOf('\n\n    return (', flow.indexOf('    const previous =')));
  const navigation = new Function('activeIntentDepthSteps', 'followUpIndex', 'INTENT_REFLECTION_ENABLED', 'isOnlyCustomIntent', 'selectedIntents', `${navigationSource}\nreturn { previous, next };`);
  const transitionBody = flow.match(/const goToStep = \([\s\S]*?\n  \) => \{([\s\S]*?)\n  \};/)[1];
  let step, lastEvent;
  const record = event => { lastEvent = event; };
  const goToStep = new Function('MOCHI_ANIMATION_STEPS', 'ensureMochiReplayPaused', 'getStepEventInput', 'trackOnboardingBackPressed', 'trackOnboardingStepSkipped', 'trackOnboardingStepCompleted', 'setStep', `return (nextStep, action, properties) => {${transitionBody}};`)(
    new Set(), () => {}, () => ({ step }), record, record, record, next => { step = next; },
  );
  const piecesBackSource = stepBlock('piecesTogether').match(/onBack=\{\(\) => goToStep\((.*), 'back'\)\}/)[1];
  const piecesBack = new Function('activeIntentDepthSteps', `return ${piecesBackSource};`);
  let answers = {};
  for (let cycle = 0; cycle < 10; cycle++) {
    const intent = cycle % 2 === 0 ? 'cleaning' : 'focus';
    const questions = intentFollowUpsFor(intent);
    const active = activeFor(depthSteps, questions);
    step = 'intentDepth1';
    for (let index = 0; index < questions.length; index++) {
      assert.equal(step, active[index]);
      const question = questions[index];
      answers = update(question, question.options[0].id, answers);
      const route = navigation(active, index, false, false, [intent]);
      if (index === 3) {
        const snapshot = structuredClone(answers);
        goToStep(route.previous, 'back');
        assert.equal(step, 'intentDepth3');
        goToStep(navigation(active, 2, false, false, [intent]).next, 'skip');
        assert.equal(step, 'intentDepth4');
        assert.deepEqual(answers, snapshot, 'Back and Skip preserve answers');
      }
      goToStep(route.next, cycle % 3 === 0 ? 'skip' : 'continue', properties(questions, answers));
      assert.equal(lastEvent.nextStep, route.next);
      assert.equal(lastEvent.action, cycle % 3 === 0 ? 'skip' : 'continue');
    }
    assert.equal(step, 'piecesTogether');
    assert.ok(Object.keys(answers).length <= 9, 'revisiting two goals cannot create extra answer keys');
    for (const ids of Object.values(answers)) assert.equal(new Set(ids).size, ids.length);
    const event = properties(questions, answers);
    assert.equal(Object.hasOwn(event, 'intent_cleaning_barriers'), intent === 'cleaning', 'analytics only describe the current primary goal');
    goToStep(piecesBack(active), 'back');
    for (let index = active.length - 1; index >= 0; index--) {
      assert.equal(step, active[index]);
      goToStep(navigation(active, index, false, false, [intent]).previous, 'back');
    }
    assert.equal(step, 'intent');
    if (intent === 'focus') assert.equal(active.includes('intentDepth4'), false);
  }
});

test('the plan is followed by the case for keeping it', () => {
  const run = [
    'recommendedExercise',
    'planDays',
    'recommendedHabits',
    'habitCurve',
    'mochiPlace',
  ];

  for (const intent of ['cleaning', 'focus']) {
    const steps = visibleSteps(intent);
    assert.deepEqual(steps.slice(steps.indexOf('recommendedExercise'), steps.indexOf('recommendedExercise') + run.length), run);
  }
  for (const removed of ['cleaningChallenge', 'cleaningFirstStep', 'cleaningPlanFit', 'cleaningOutlook']) {
    assert.equal(allSteps.includes(removed), false, `${removed} must remain outside onboarding`);
    assert.doesNotMatch(flow, new RegExp(`['\"]${removed}['\"]`));
  }

  // The plan page lets someone choose its routine habits before the proof
  // screen, and each step has a symmetric Back path.
  assert.match(
    flow,
    /const continueFromStarterPlan = \(\) => \{\s*goToStep\('recommendedHabits', 'continue'/,
  );
  assertTransition('recommendedExercise', 'onContinue', 'planDays', 'continue');
  assertTransition('planDays', 'onBack', 'recommendedExercise', 'back');
  assert.match(stepBlock('planDays'), /onContinue=\{continueFromStarterPlan\}/);
  assertTransition('recommendedHabits', 'onBack', 'planDays', 'back');
  assertTransition('recommendedHabits', 'onContinue', 'habitCurve', 'continue');
  assertTransition('habitCurve', 'onBack', 'recommendedHabits', 'back');
  assertTransition('habitCurve', 'onContinue', 'mochiPlace', 'continue');
  assertTransition('mochiPlace', 'onBack', 'habitCurve', 'back');
});

test('ten cleaning cycles keep the shorter flow bounded and never revisit removed questions', () => {
  const starterContinue = flow.match(/const continueFromStarterPlan = \(\) => \{\s*goToStep\('([^']+)', '([^']+)'/);
  assert.ok(starterContinue);
  const expectedPlan = [
    'recommendedExercise', 'planDays', 'recommendedHabits',
    'habitCurve', 'mochiPlace',
  ];
  const routineForward = [
    'beforeAfter', 'distraction', 'scrollInstead', 'socialMedia',
    'analyzeDays', 'habitsFocusInsight', 'habitsFocusScience1',
  ];
  const routineBack = [
    'habitsFocusScience1', 'habitsFocusInsight', 'socialMedia',
    'scrollInstead', 'distraction', 'beforeAfter',
  ];
  for (let cycle = 0; cycle < 10; cycle++) {
    const steps = visibleSteps('cleaning', cycle % 2 ? ['cleaning', 'focus'] : ['cleaning']);
    assert.equal(steps.length, cycle % 2 ? 79 : 78);
    assert.equal(new Set(steps).size, steps.length, 'repeated onboarding cannot add duplicate steps');
    for (const omitted of cleaningReplacedSteps) assert.equal(steps.includes(omitted), false);
    const advance = (step, prop) => {
      const result = step === 'planDays' && prop === 'onContinue'
        ? { target: starterContinue[1], action: starterContinue[2] }
        : transitionFromBlock(stepBlock(step), prop, 'cleaning');
      assert.ok(steps.includes(result.target), `${step}.${prop} must remain in the visible flow`);
      assert.equal(cleaningReplacedSteps.has(result.target), false);
      assert.equal(result.action, prop === 'onBack' ? 'back' : prop === 'onSkip' ? 'skip' : prop === 'onDone' ? 'auto' : 'continue');
      return result.target;
    };
    for (let index = 0; index < routineForward.length - 1; index++) {
      const step = routineForward[index];
      const prop = step === 'analyzeDays' ? 'onDone' : step === 'socialMedia' && cycle % 2 ? 'onSkip' : 'onContinue';
      assert.equal(advance(step, prop), routineForward[index + 1]);
    }
    for (let index = 0; index < routineBack.length - 1; index++) {
      assert.equal(advance(routineBack[index], 'onBack'), routineBack[index + 1]);
    }
    // Skipping the two remaining routine questions also stays on the shorter path.
    assert.equal(advance('distraction', 'onSkip'), 'scrollInstead');
    assert.equal(advance('scrollInstead', 'onSkip'), 'socialMedia');
    const start = steps.indexOf('recommendedExercise');
    assert.deepEqual(steps.slice(start, start + expectedPlan.length), expectedPlan);
    let step = expectedPlan[0];
    const visited = [step];
    for (const expected of expectedPlan.slice(1)) {
      step = advance(step, 'onContinue');
      visited.push(step);
      assert.equal(step, expected);
    }
    assert.deepEqual(visited, expectedPlan, 'each plan screen appears exactly once per forward pass');
    for (const expected of expectedPlan.slice(0, -1).reverse()) {
      step = advance(step, 'onBack');
      assert.equal(step, expected);
    }
    assert.equal(step, 'recommendedExercise');
    assert.equal(advance(step, 'onBack'), 'diagnosis');
  }
});

test('the routine chalkboard closes the habits module before halfway', () => {
  const orderSource = flow.slice(
    flow.indexOf('const STEP_ORDER'),
    flow.indexOf('const BASE_STEP_INDEX'),
  );
  const steps = [...orderSource.matchAll(/^\s{2}'([^']+)',$/gm)].map(
    (match) => match[1],
  );

  assert.equal(steps[steps.indexOf('routineBrain') - 1], 'habitsFocusScience3');
  assert.equal(steps[steps.indexOf('routineBrain') + 1], 'halfway');
});

test('Azo greets them by name right after the name is asked', () => {
  const orderSource = flow.slice(
    flow.indexOf('const STEP_ORDER'),
    flow.indexOf('const BASE_STEP_INDEX'),
  );
  const steps = [...orderSource.matchAll(/'([^']+)'/g)].map((m) => m[1]);

  assert.equal(steps.filter((step) => step === 'greeting').length, 1);
  assert.equal(steps[steps.indexOf('greeting') - 1], 'name');
  assert.equal(steps[steps.indexOf('greeting') + 1], 'personalizeIntro');
  // One render site, and it receives the name the user just typed.
  assert.equal(flow.split("if (step === 'greeting')").length - 1, 1);
  assert.match(
    stepBlock('greeting'),
    /<GreetingScreen[\s\S]*?name=\{name\}/,
  );
  assertTransition('greeting', 'onContinue', 'personalizeIntro', 'continue');
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

test('the plan reveal keeps one mounted screen across its two steps', () => {
  // A key or a wrapper on either return would remount the screen and the
  // pentagon would blink out between diagnosis and plan.
  for (const step of ['diagnosis', 'recommendedExercise']) {
    const block = stepBlock(step);
    assert.match(block, /return \(\s*<PlanRevealScreen\b/, `${step} must return the screen bare`);
    assert.doesNotMatch(block, /<PlanRevealScreen[^>]*\bkey=/, `${step} must not key the screen`);
  }
});

test('each chalkboard lesson mounts fresh, so the entrance plays forward and back', () => {
  const chalkboard = readFileSync(
    new URL('./screens/ChalkboardScreen.tsx', import.meta.url),
    'utf8',
  );
  assert.match(chalkboard, /<OnboardingScreenLayout\s+key=\{lesson\}/);
});
