import test from 'node:test';
import assert from 'node:assert/strict';

import { planChangeLabel, projectScores } from './paywallPersonalization.ts';

test('the plan label follows the same bands as the projected gain', () => {
  const gain = (value) =>
    projectScores([{ axis: 'focus', label: 'Focus', value }])[0].value - value;

  assert.equal(planChangeLabel(60), 'Building up');
  assert.equal(gain(60), 28);
  assert.equal(planChangeLabel(61), 'Strengthening');
  assert.equal(gain(61), 20);
  assert.equal(planChangeLabel(81), 'Keeping it up');
  assert.equal(gain(81), 10);
});
