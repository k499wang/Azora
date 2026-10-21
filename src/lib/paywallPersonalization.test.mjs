import test from 'node:test';
import assert from 'node:assert/strict';

import { planChangeLabel, projectScores } from './paywallPersonalization.ts';

test('the plan label follows the current score bands', () => {
  assert.equal(planChangeLabel(60), 'Building up');
  assert.equal(planChangeLabel(61), 'Strengthening');
  assert.equal(planChangeLabel(80), 'Strengthening');
  assert.equal(planChangeLabel(81), 'Keeping it up');
});

test('every axis grows monotonically within its remaining room and preserves high originals', () => {
  for (const axis of ['calm', 'recovery', 'focus', 'mood', 'vitality']) {
    let previous = 0;
    for (let value = 0; value <= 100; value += 1) {
      const projected = projectScores([{ axis, label: axis, value }])[0].value;
      assert.ok(projected >= previous, `${axis} monotonic at ${value}`);
      assert.ok(projected >= value, `${axis} no decrease at ${value}`);
      if (value <= 94) assert.ok(projected <= 94, `${axis} edge spacing at ${value}`);
      else assert.equal(projected, value);
      previous = projected;
    }
  }
});

test('five projected axes retain variation and metadata without mutating inputs', () => {
  const scores = Object.freeze([
    Object.freeze({ axis: 'focus', label: 'Focus', value: 20 }),
    Object.freeze({ axis: 'vitality', label: 'Vitality', value: 35 }),
    Object.freeze({ axis: 'calm', label: 'Calm', value: 50 }),
    Object.freeze({ axis: 'recovery', label: 'Recovery', value: 65 }),
    Object.freeze({ axis: 'mood', label: 'Mood', value: 80 }),
  ]);
  const projected = projectScores(scores);

  assert.deepEqual(projected.map(({ value }) => value), [81, 88, 92, 83, 90]);
  assert.deepEqual(scores.map(({ value }) => value), [20, 35, 50, 65, 80]);
  assert.notEqual(projected, scores);
  projected.forEach((score, index) => {
    assert.notEqual(score, scores[index]);
    assert.equal(score.axis, scores[index].axis);
    assert.equal(score.label, scores[index].label);
  });
});

test('the lab sample projects to a larger varied after shape', () => {
  const scores = [
    { axis: 'calm', label: 'Calm', value: 34 },
    { axis: 'recovery', label: 'Recovery', value: 52 },
    { axis: 'focus', label: 'Focus', value: 71 },
    { axis: 'mood', label: 'Mood', value: 45 },
    { axis: 'vitality', label: 'Vitality', value: 58 },
  ];

  assert.deepEqual(projectScores(scores).map(({ value }) => value), [91, 78, 90, 80, 90]);
});

test('equal starting scores produce stable varied projections independent of axis order', () => {
  for (const value of [5, 20, 50, 70]) {
    const scores = ['calm', 'recovery', 'focus', 'mood', 'vitality'].map(axis => ({ axis, label: axis, value }));
    const projected = projectScores(scores);
    assert.equal(new Set(projected.map(score => score.value)).size, 5);
    assert.deepEqual(projectScores([...scores].reverse()), [...projected].reverse());
    assert.deepEqual(projectScores(scores), projected);
  }
});


test('equal midrange inputs show large gains and a wide spread without random changes', () => {
  const scores = ['calm', 'recovery', 'focus', 'mood', 'vitality'].map(axis => ({ axis, label: axis, value: 50 }));
  const values = projectScores(scores).map(score => score.value);
  assert.deepEqual(values, [92, 77, 86, 82, 90]);
  assert.ok(values.every(value => value - 50 >= 25));
  assert.ok(Math.max(...values) - Math.min(...values) >= 15);
});

test('lower starting values stay differentiated rather than jumping to a shared high floor', () => {
  const scores = [5, 25, 50, 75].map(value => ({ axis: 'recovery', label: 'Recovery', value }));
  const values = projectScores(scores).map(score => score.value);
  assert.ok(values.every((value, index) => value > scores[index].value));
  assert.ok(values.every((value, index) => index === 0 || value > values[index - 1]));
  const gains = values.map((value, index) => value - scores[index].value);
  assert.ok(gains.every((gain, index) => index === 0 || gain <= gains[index - 1]));
});
