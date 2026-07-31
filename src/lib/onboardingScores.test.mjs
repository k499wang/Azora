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
      { axis: 'resilience', value: 79 },
      { axis: 'breathEase', value: 66 },
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
