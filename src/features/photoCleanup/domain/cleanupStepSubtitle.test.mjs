import assert from 'node:assert/strict';
import test from 'node:test';
import { getCleanupStepSubtitle } from './cleanupStepSubtitle.ts';

test('uses opening copy for the first cleanup step', () => {
  assert.equal(
    getCleanupStepSubtitle(1, 4),
    'Start here—one small group is enough.',
  );
});

test('uses closing copy for the last cleanup step', () => {
  assert.equal(
    getCleanupStepSubtitle(4, 4),
    'Last group—then you’re done.',
  );
});

test('cycles neutral middle copy deterministically by step', () => {
  assert.equal(getCleanupStepSubtitle(2, 6), 'Just this group for now.');
  assert.equal(getCleanupStepSubtitle(3, 6), 'One small win at a time.');
  assert.equal(getCleanupStepSubtitle(4, 6), 'Keep it simple—this group only.');
  assert.equal(getCleanupStepSubtitle(5, 7), 'Just this group for now.');
});

test('treats a one-item plan as the last step', () => {
  assert.equal(getCleanupStepSubtitle(1, 1), 'Last group—then you’re done.');
});
