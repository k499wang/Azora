import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyStallIssue,
  dominantStallIssue,
  HEART_RATE_STALL_DELAY_MS,
} from './captureStall.ts';

test('the stall delay leaves room for an ordinary fumble', () => {
  assert.equal(HEART_RATE_STALL_DELAY_MS, 20_000);
});

test('placement faults classify ahead of signal faults', () => {
  assert.equal(classifyStallIssue('no_finger', 'warming_up'), 'no_finger');
  assert.equal(classifyStallIssue('lost', 'measuring'), 'no_finger');
  assert.equal(classifyStallIssue('good', 'signal_lost'), 'no_finger');
  assert.equal(classifyStallIssue('partial', 'measuring'), 'partial_coverage');
  assert.equal(classifyStallIssue('good', 'partial_coverage'), 'partial_coverage');
  assert.equal(
    classifyStallIssue('too_much_pressure', 'measuring'),
    'too_much_pressure',
  );
  assert.equal(classifyStallIssue('good', 'excessive_motion'), 'motion');
  assert.equal(classifyStallIssue('good', 'no_pulse'), 'no_pulse');
});

test('clean placement with no fault classifies as nothing to diagnose', () => {
  assert.equal(classifyStallIssue('good', 'warming_up'), null);
  assert.equal(classifyStallIssue('good', 'measuring'), null);
});

test('the longest-held fault wins, not the most recent one', () => {
  const issue = dominantStallIssue(
    [
      { issue: 'no_finger', atMs: 0 },
      { issue: 'partial_coverage', atMs: 12_000 },
      { issue: 'motion', atMs: 16_000 },
    ],
    17_000,
  );

  assert.equal(issue, 'no_finger');
});

test('the same fault accumulates across separate stretches', () => {
  const issue = dominantStallIssue(
    [
      { issue: 'too_much_pressure', atMs: 0 },
      { issue: 'no_finger', atMs: 5_000 },
      { issue: 'too_much_pressure', atMs: 11_000 },
    ],
    17_000,
  );

  assert.equal(issue, 'too_much_pressure');
});

test('unclassified stretches never win the window', () => {
  const issue = dominantStallIssue(
    [
      { issue: null, atMs: 0 },
      { issue: 'motion', atMs: 15_000 },
    ],
    17_000,
  );

  assert.equal(issue, 'motion');
});

test('a window with no fault at all falls back to a faint signal', () => {
  assert.equal(dominantStallIssue([], 17_000), 'no_pulse');
  assert.equal(
    dominantStallIssue([{ issue: null, atMs: 0 }], 17_000),
    'no_pulse',
  );
});

test('a fault recorded at the very end does not outrank a held one', () => {
  const issue = dominantStallIssue(
    [
      { issue: 'partial_coverage', atMs: 0 },
      { issue: 'no_finger', atMs: 17_000 },
    ],
    17_000,
  );

  assert.equal(issue, 'partial_coverage');
});
