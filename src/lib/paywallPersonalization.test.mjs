import test from 'node:test';
import assert from 'node:assert/strict';

import { planChangeLabel, projectScores } from './paywallPersonalization.ts';

test('the plan label follows the same bands as the projected gain', () => {
  const gain = (value) =>
    projectScores([{ axis: 'focus', label: 'Focus', value }])[0].value - value;

  assert.equal(planChangeLabel(60), 'Building up');
  assert.equal(gain(60), 35);
  assert.equal(planChangeLabel(61), 'Strengthening');
  assert.equal(gain(61), 25);
  assert.equal(planChangeLabel(81), 'Keeping it up');
  assert.equal(gain(81), 15);
});

test('the projected shape stops short of the radar edge', () => {
  const project = (value) => projectScores([{ axis: 'focus', label: 'Focus', value }])[0].value;
  assert.equal(project(90), 96);
  assert.equal(project(97), 97);
  assert.equal(project(100), 100);
});
