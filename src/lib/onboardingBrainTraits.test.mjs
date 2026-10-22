import assert from 'node:assert/strict';
import test from 'node:test';
import { brainTraitsFromAnswers } from './onboardingBrainTraits.ts';

const NO_ANSWERS = {
  struggles: [],
  procrastinationReasons: [],
  stressSignal: null,
  distraction: null,
  scrollInstead: null,
  selfDiscipline: null,
  untappedPotential: null,
};

test('no answers name no traits', () => {
  assert.deepEqual(brainTraitsFromAnswers(NO_ANSWERS), []);
});

test('traits come only from answers already given, in a fixed order', () => {
  const traits = brainTraitsFromAnswers({
    ...NO_ANSWERS,
    struggles: ['perfectionism', 'timeManagement'],
    distraction: 'constant',
    untappedPotential: 'yes',
  });
  assert.deepEqual(traits.map((trait) => trait.id), [
    'timeSense', 'allOrNothingFocus', 'perfectOrNothing', 'giftedKid',
  ]);
});
