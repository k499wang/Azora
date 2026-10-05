import assert from 'node:assert/strict';
import test from 'node:test';
import { getCleanupMilestone } from './cleanupMilestone.ts';

test('shows each milestone in the four-item preview', () => {
  assert.deepEqual(
    [0, 1, 2, 3, 4].map((completedCount) => getCleanupMilestone(completedCount, 4)),
    [
      null,
      'One less thing to think about.',
      'Look at that—you’re halfway there.',
      'One more small win to go.',
      null,
    ],
  );
});

test('does not show milestones for an empty or single-item list', () => {
  assert.equal(getCleanupMilestone(0, 0), null);
  assert.equal(getCleanupMilestone(0, 1), null);
  assert.equal(getCleanupMilestone(1, 1), null);
});

test('shows only the first completion milestone for a two-item list', () => {
  assert.equal(getCleanupMilestone(1, 2), 'One less thing to think about.');
  assert.equal(getCleanupMilestone(2, 2), null);
});

test('prioritizes the final milestone when it overlaps halfway', () => {
  assert.equal(getCleanupMilestone(1, 3), 'One less thing to think about.');
  assert.equal(getCleanupMilestone(2, 3), 'One more small win to go.');
});

test('shows milestones only at their exact completion counts', () => {
  assert.equal(getCleanupMilestone(2, 7), null);
  assert.equal(getCleanupMilestone(4, 7), 'Look at that—you’re halfway there.');
  assert.equal(getCleanupMilestone(5, 7), null);
  assert.equal(getCleanupMilestone(6, 7), 'One more small win to go.');
  assert.equal(getCleanupMilestone(7, 7), null);
  assert.equal(getCleanupMilestone(8, 7), null);
  assert.equal(getCleanupMilestone(-1, 7), null);
});
