import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { onboardingSectionLabel, onboardingSections, onboardingStepOrder } from './onboardingStepOrder.ts';
import { intentFollowUpsFor } from './data/intentFollowUps.ts';
import { ARCHETYPE_FOR_PLAN, cleaningArchetype } from '../../lib/onboardingArchetype.ts';
import { ONBOARDING_ILLUSTRATION_CATALOG } from '../common/icons/onboardingIllustrationCatalog.ts';

const flow = readFileSync(new URL('./OnboardingFlow.tsx', import.meta.url), 'utf8');
const cleaningSteps = (adhdStatus = null) =>
  onboardingStepOrder('cleaning', 1, intentFollowUpsFor('cleaning').length, adhdStatus, 'cleaning_mode');

test('cleaning mode asks how to help with cleaning right after the greeting, never the goal picker', () => {
  const steps = cleaningSteps();
  assert.deepEqual(steps.slice(0, 7), [
    'azoChatInvite',
    'azoChat',
    'name',
    'greeting',
    'cleaningHelp',
    'personalizeIntro',
    'communityProof',
  ]);
  assert.equal(steps.includes('usageStyle'), false);
  assert.equal(steps.includes('intent'), false);
  assert.equal(steps.includes('intentPriority'), false);
});

test('cleaning mode asks the toughest tidying part, then living situation, right after the 2x proof', () => {
  const steps = cleaningSteps();
  const proof = steps.indexOf('goalProof');
  assert.deepEqual(steps.slice(proof, proof + 3), ['goalProof', 'intentDepth6', 'intentDepth4']);
  assert.equal(intentFollowUpsFor('cleaning')[3].id, 'cleaning_living_situation');
  assert.equal(steps[steps.indexOf('intentDepth3') + 1], 'intentDepth2');
  assert.equal(intentFollowUpsFor('cleaning')[5].id, 'tidying_challenge');
  for (const depth of ['intentDepth3', 'intentDepth4', 'intentDepth5', 'intentDepth7']) {
    assert.ok(steps.includes(depth), depth);
  }
});

test('cleaning mode keeps the ADHD follow-up and ends on the usual plan section', () => {
  const steps = cleaningSteps('suspected');
  assert.equal(steps[steps.indexOf('adhdStatus') + 1], 'adhdSupport');
  assert.deepEqual(steps.slice(-2), ['pact', 'paywall']);
  assert.deepEqual(steps.slice(steps.indexOf('dailyTime'), steps.indexOf('planIntro') + 1), ['dailyTime', 'feelAtHome', 'planIntro']);
});

test('every cleaning mode step renders', () => {
  for (const step of new Set(cleaningSteps('suspected'))) {
    if (step.startsWith('intentDepth') || step.startsWith('statement') || step === 'paywall') continue;
    assert.ok(flow.includes(`step === '${step}'`), `no render for '${step}'`);
  }
});

test('the personality intro leads straight into the six agree-or-disagree statements', () => {
  const steps = cleaningSteps();
  const intro = steps.indexOf('cleaningPersonalityIntro');
  assert.deepEqual(steps.slice(intro - 1, intro + 9), [
    'habitsFocusInsight',
    'cleaningPersonalityIntro',
    'statementShutDown',
    'statementDoomPile',
    'statementGaveUp',
    'statementAvoidGuests',
    'statementAvoidCleaning',
    'statementSelfBlame',
    'intentDepth7',
    'habitsFocusScience1',
  ]);
  assert.match(flow, /if \(isCleaningStatementStep\(step\)\)/);
});

test('cleaning mode drops the steps that do not fit a cleaning plan', () => {
  const steps = cleaningSteps();
  for (const step of [
    'untappedPotential',
    'sacrificeForOthers',
    'intent',
    'supportSystem',
    'sleepCause',
    'habitMotivation',
    'selfDiscipline',
    'homeAtmosphere',
  ]) {
    assert.equal(steps.includes(step), false, step);
  }
  assert.equal(steps[steps.indexOf('doingItFor') + 1], 'scienceCredibility');
  assert.deepEqual(
    steps.slice(steps.indexOf('lifestyleHappiness'), steps.indexOf('lifestyleHappiness') + 5),
    ['lifestyleHappiness', 'loseMotivation', 'habitsToBreak', 'habitAttempts', 'greatDaysChart'],
  );
});

test('standard order is unchanged by default', () => {
  assert.deepEqual(
    onboardingStepOrder('cleaning', 1, 7),
    onboardingStepOrder('cleaning', 1, 7, null, 'standard'),
  );
  assert.ok(onboardingStepOrder('cleaning', 1, 7).includes('intent'));
});

test('cleaning mode names every section around cleaning', () => {
  const labels = onboardingSections('cleaning', 1, 7, null, 'cleaning_mode')
    .map(({ section }) => onboardingSectionLabel(section, 'cleaning', 'Kevin', 'cleaning_mode'));
  assert.deepEqual(labels, [
    'About you',
    'Your home right now',
    'Your cleaning personality',
    'Your sleep and energy',
    'Your cleaning habits',
    'What makes it harder',
    'How Azora helps you clean',
    "Kevin's cleaning plan",
  ]);
  assert.equal(onboardingSectionLabel('plan', 'cleaning', '', 'cleaning_mode'), 'Your cleaning plan');
});

test('cleaning mode asks which areas stress them out, with sticker icons; standard keeps its question', () => {
  const [areas] = intentFollowUpsFor('cleaning', 'cleaning_mode');
  assert.equal(areas.question, 'Which areas stress you out most?');
  assert.equal(areas.multiSelect, true);
  assert.deepEqual(areas.options.map((option) => option.title), [
    'Bedroom', 'Kitchen', 'Bathroom', 'Living room', 'Workspace',
    'Laundry', 'Dishes', 'General clutter', 'Honestly, all of it',
  ]);
  for (const option of areas.options) assert.ok(option.icon in ONBOARDING_ILLUSTRATION_CATALOG, option.icon);
  assert.equal(intentFollowUpsFor('cleaning')[0].id, 'when_cleaning');
});

test('cleaning mode hears more mess thoughts under the same answer id; standard keeps its four', () => {
  const thought = intentFollowUpsFor('cleaning', 'cleaning_mode')[6];
  assert.equal(thought.id, 'cleaning_mess_thought');
  assert.equal(thought.options.length, 6);
  assert.ok(['where_start', 'tomorrow', 'why_bother', 'not_bad'].every((id) => thought.options.some((option) => option.id === id)));
  for (const option of thought.options) assert.ok(option.icon in ONBOARDING_ILLUSTRATION_CATALOG, option.icon);
  assert.equal(intentFollowUpsFor('cleaning')[6].options.length, 4);
});

test('cleaning mode asks what a tidy home would change, just before the before/after screen', () => {
  const steps = cleaningSteps();
  assert.equal(steps[steps.indexOf('homeFeeling') + 1], 'beforeAfter');
  assert.match(flow, /'What would a tidy home change for you\?'/);
});

test('cleaning mode names the profile after their mess thought, keeping the home plan underneath', () => {
  const thought = intentFollowUpsFor('cleaning', 'cleaning_mode')[6];
  for (const option of thought.options) {
    const archetype = cleaningArchetype([option.id]);
    assert.notEqual(archetype.name, ARCHETYPE_FOR_PLAN.home.name, option.id);
    assert.equal(archetype.planName, ARCHETYPE_FOR_PLAN.home.planName);
  }
  assert.equal(cleaningArchetype(['where_start']).name, 'The Deer in Headlights');
  assert.equal(cleaningArchetype(undefined), ARCHETYPE_FOR_PLAN.home);
  assert.match(flow, /cleaningArchetype\(intentFollowUpAnswers\.cleaning_mess_thought\)/);
});

test('the cleaning profile adds mess stress, main difficulty and energy from existing answers', () => {
  assert.match(flow, /messStressEcho\(intentFollowUpAnswers\.cleaning_space_state, cleaningStatements\)/);
  assert.match(flow, /difficultyEcho: mode === 'cleaning_mode' \? cleaningAnswerEcho\('tidying_challenge'\)/);
  assert.match(flow, /echoSingle\(DRAINED_FREQUENCY_OPTIONS, drainedFrequency\)/);
});
