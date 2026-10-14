import assert from 'node:assert/strict';
import test from 'node:test';

import { intentFollowUpsFor } from '../components/onboarding/data/intentFollowUps';
import { chosenGoalPhrase } from '../components/onboarding/data/intentOptions';
import { DAY_ENERGY_OPTIONS, SLEEP_CAUSE_OPTIONS } from '../components/onboarding/data/routineOptions';
import { echoOption, echoSingle } from './onboardingEcho';
import { describeStressBand } from './onboardingLoad';
import { buildPiecesTogetherSubtitle } from './onboardingPiecesTogether';

const EMPTY_ANSWERS = {
  goalPhrase: null,
  contextEcho: null,
  energyEcho: null,
  sleepEcho: null,
  stressEcho: null,
};
const GENERIC_PROMISE = 'We’ll take it one small step a day.';

function contextEcho(intent, selected) {
  const question = intentFollowUpsFor(intent)[0];
  return echoOption(question.options, selected);
}

test('sleep answers personalize the subtitle with the first fact and selected goal', () => {
  assert.equal(buildPiecesTogetherSubtitle({
    goalPhrase: chosenGoalPhrase('sleep', ['sleep']),
    contextEcho: contextEcho('sleep', ['falling']),
    energyEcho: echoSingle(DAY_ENERGY_OPTIONS, 'drained'),
    sleepEcho: echoSingle(SLEEP_CAUSE_OPTIONS, 'racingMind'),
    stressEcho: describeStressBand(8),
  }), 'Falling asleep feels difficult. We’ll help you sleep better, one small step a day.');
});

test('cleaning answers and multi-goal priority use the selected primary goal', () => {
  assert.equal(buildPiecesTogetherSubtitle({
    ...EMPTY_ANSWERS,
    goalPhrase: chosenGoalPhrase('cleaning', ['sleep', 'cleaning']),
    contextEcho: contextEcho('cleaning', ['laundry']),
    energyEcho: echoSingle(DAY_ENERGY_OPTIONS, 'steady'),
  }), 'Laundry feels hardest to start. We’ll help you get started when your space feels overwhelming, one small step a day.');
});

test('positive sleep and energy answers remain positive', () => {
  assert.equal(buildPiecesTogetherSubtitle({
    ...EMPTY_ANSWERS,
    goalPhrase: 'sleep better',
    energyEcho: echoSingle(DAY_ENERGY_OPTIONS, 'steady'),
    sleepEcho: echoSingle(SLEEP_CAUSE_OPTIONS, 'fine'),
  }), 'Your energy stays steady through the day. We’ll help you sleep better, one small step a day.');
});

test('missing and blank echoes fall through to later answers without empty clauses', () => {
  assert.equal(buildPiecesTogetherSubtitle({
    ...EMPTY_ANSWERS,
    goalPhrase: ' sleep better ',
    contextEcho: '',
    energyEcho: '  ',
    sleepEcho: ' your phone keeps you up ',
    stressEcho: describeStressBand(4),
  }), 'Your phone keeps you up. We’ll help you sleep better, one small step a day.');
});

test('an unanswered assessment only states the selected goal promise', () => {
  assert.equal(buildPiecesTogetherSubtitle({
    ...EMPTY_ANSWERS,
    goalPhrase: 'sleep better',
  }), 'We’ll help you sleep better, one small step a day.');
});

test('all missing or blank answers use the generic promise', () => {
  assert.equal(buildPiecesTogetherSubtitle(EMPTY_ANSWERS), GENERIC_PROMISE);
  assert.equal(buildPiecesTogetherSubtitle({
    goalPhrase: ' ', contextEcho: '', energyEcho: '\t', sleepEcho: '\n', stressEcho: ' ',
  }), GENERIC_PROMISE);
});

test('skipped, unknown, and multiple context selections do not invent facts', () => {
  for (const selected of [[], ['unknown'], ['falling', 'waking']]) {
    assert.equal(buildPiecesTogetherSubtitle({
      ...EMPTY_ANSWERS,
      contextEcho: contextEcho('sleep', selected),
      energyEcho: echoSingle(DAY_ENERGY_OPTIONS, null),
      sleepEcho: echoSingle(SLEEP_CAUSE_OPTIONS, null),
    }), GENERIC_PROMISE);
  }
});
