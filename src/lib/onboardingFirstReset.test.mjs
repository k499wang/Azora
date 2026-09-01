import test from 'node:test';
import assert from 'node:assert/strict';
import {
  firstResetDurationLabel,
  firstResetPaceLabel,
  firstResetRounds,
} from './onboardingFirstReset.ts';

const box = { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 };
const relaxing = { inhale: 4, holdIn: 0, exhale: 6, holdOut: 0 };

test('rounds are trimmed so a long technique still fits the first reset', () => {
  assert.equal(firstResetRounds(box, 8), 3);
});

test('rounds never exceed the technique default', () => {
  assert.equal(firstResetRounds(relaxing, 6), 6);
});

test('a technique slower than the target still runs the minimum rounds', () => {
  assert.equal(firstResetRounds({ inhale: 10, holdIn: 0, exhale: 20, holdOut: 0 }, 6), 3);
});

test('a pattern with no duration falls back to its default rounds', () => {
  assert.equal(firstResetRounds({ inhale: 0, holdIn: 0, exhale: 0, holdOut: 0 }, 5), 5);
});

test('the pace label drops the phases the pattern does not use', () => {
  assert.equal(firstResetPaceLabel(relaxing), 'in for 4, out for 6');
  assert.equal(
    firstResetPaceLabel(box),
    'in for 4, hold for 4, out for 4, hold for 4',
  );
});

test('the duration label rounds a near-minute up to a minute', () => {
  assert.equal(firstResetDurationLabel(relaxing, 6), 'about a minute');
  assert.equal(firstResetDurationLabel(box, 3), 'about 48 seconds');
});
