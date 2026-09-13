import assert from 'node:assert/strict';
import test from 'node:test';

import { analyzeDurationMs, countAnswered } from './onboardingAnalyze';

test('a block with more answers takes visibly longer to analyze', () => {
  const intentBlock = analyzeDurationMs(2);
  const sleepBlock = analyzeDurationMs(3);

  assert.ok(
    sleepBlock - intentBlock >= 400,
    `${sleepBlock}ms is not visibly longer than ${intentBlock}ms`,
  );
});

test('the wait is capped so a full block never stalls the flow', () => {
  assert.equal(analyzeDurationMs(20), analyzeDurationMs(100));
  assert.ok(analyzeDurationMs(100) <= 5000);
});

test('an empty block still analyzes for long enough to read', () => {
  assert.ok(analyzeDurationMs(0) >= 1800);
  assert.equal(analyzeDurationMs(-5), analyzeDurationMs(0));
});

test('skips and blanks are not counted as answers', () => {
  assert.equal(countAnswered([null, undefined, '', '   ', []]), 0);
  assert.equal(countAnswered([5, 'snooze', ['anxiety'], 0, false]), 5);
});
