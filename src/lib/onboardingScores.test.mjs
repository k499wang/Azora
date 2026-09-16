import test from 'node:test';
import assert from 'node:assert/strict';
import { computeMindMap } from './onboardingScores.ts';

test('worst-case responses keep every final mind-map dimension at five or above', () => {
  const result = computeMindMap({
    stressLevel: 10,
    sleepQuality: 1,
    racingLevel: 10,
    agreementResponses: {
      exhausted: 'agree',
      racing: 'agree',
      reactive: 'agree',
    },
  });

  assert.equal(result.scores.find(({ axis }) => axis === 'calm')?.value, 5);
  assert.equal(result.scores.find(({ axis }) => axis === 'focus')?.value, 5);
  assert.ok(result.scores.every(({ value }) => value >= 5));
  assert.ok(result.superpower.value >= 5);
  assert.ok(result.growthArea.value >= 5);
  assert.equal(result.growthArea.axis, 'focus');
});

test('representative scores above the minimum remain unchanged', () => {
  const result = computeMindMap({
    stressLevel: 5,
    sleepQuality: 8,
    racingLevel: 4,
    agreementResponses: {
      exhausted: 'disagree',
      racing: 'disagree',
      reactive: 'disagree',
    },
  });

  assert.deepEqual(
    result.scores.map(({ axis, value }) => ({ axis, value })),
    [
      { axis: 'calm', value: 60 },
      { axis: 'recovery', value: 83 },
      { axis: 'focus', value: 79 },
      { axis: 'mood', value: 79 },
      { axis: 'vitality', value: 66 },
    ],
  );
  assert.equal(result.superpower.axis, 'recovery');
  assert.equal(result.growthArea.axis, 'calm');
});

test('equal-lowest growth areas use the approved priority', () => {
  const result = computeMindMap({
    stressLevel: 10,
    sleepQuality: 1,
    racingLevel: 10,
    agreementResponses: {
      exhausted: 'agree',
      racing: 'agree',
      reactive: 'agree',
    },
  });

  assert.equal(result.scores.find(({ axis }) => axis === 'calm')?.value, 5);
  assert.equal(result.scores.find(({ axis }) => axis === 'focus')?.value, 5);
  assert.equal(result.growthArea.axis, 'focus');
});

test('superpower ties retain the existing score-array order', () => {
  const result = computeMindMap({
    stressLevel: 1,
    sleepQuality: 6,
    agreementResponses: {
      exhausted: 'disagree',
      racing: 'agree',
      reactive: 'agree',
    },
  });

  assert.equal(result.scores.find(({ axis }) => axis === 'calm')?.value, 70);
  assert.equal(result.scores.find(({ axis }) => axis === 'recovery')?.value, 70);
  assert.equal(result.superpower.axis, 'calm');
});

test('named strains only cost the axis they are about', () => {
  const inputs = {
    stressLevel: 4,
    sleepQuality: 7,
    agreementResponses: { exhausted: 'disagree', racing: 'disagree', reactive: 'disagree' },
  };
  const plain = computeMindMap(inputs);
  const withAdhd = computeMindMap({ ...inputs, strains: ['adhd'] });

  const axis = (result, name) =>
    result.scores.find(({ axis: candidate }) => candidate === name).value;

  assert.ok(axis(withAdhd, 'focus') < axis(plain, 'focus'));
  assert.equal(axis(withAdhd, 'recovery'), axis(plain, 'recovery'));
  assert.equal(axis(withAdhd, 'calm'), axis(plain, 'calm'));
});

test('no single answer can take an axis apart, and unknown answers are ignored', () => {
  const inputs = {
    stressLevel: 4,
    sleepQuality: 7,
    agreementResponses: { exhausted: 'disagree', racing: 'disagree', reactive: 'disagree' },
  };
  const axis = (result, name) =>
    result.scores.find(({ axis: candidate }) => candidate === name).value;

  const everyStrain = computeMindMap({
    ...inputs,
    strains: ['anxiety', 'panic', 'ocd', 'overwhelmed', 'worry', 'racingMind'],
  });
  const capped = computeMindMap({ ...inputs, strains: ['anxiety', 'panic'] });
  assert.equal(axis(everyStrain, 'calm'), axis(capped, 'calm'));

  // "None of these" and a neurotype are not strains, so they change nothing.
  const ignored = computeMindMap({ ...inputs, strains: ['none', 'autism', 'boring'] });
  assert.deepEqual(ignored.scores, computeMindMap(inputs).scores);
});

test('an unmoved brain-fog slider is not an answer', () => {
  const inputs = {
    stressLevel: 4,
    sleepQuality: 7,
    agreementResponses: { exhausted: 'disagree', racing: 'disagree', reactive: 'disagree' },
  };
  const axis = (result, name) =>
    result.scores.find(({ axis: candidate }) => candidate === name).value;

  assert.equal(axis(computeMindMap(inputs), 'focus'), axis(computeMindMap({ ...inputs, brainFogLevel: 1 }), 'focus'));
  assert.ok(axis(computeMindMap({ ...inputs, brainFogLevel: 9 }), 'focus') < axis(computeMindMap(inputs), 'focus'));
});
