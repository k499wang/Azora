import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getBreathingSessionDurationSeconds,
  getBreathingSessionProgress,
  getBreathingSessionTargetSeconds,
} from './breathingSessionTiming.ts';

test('target duration includes every breathing phase for every round', () => {
  assert.equal(
    getBreathingSessionTargetSeconds(
      { inhale: 4, holdIn: 7, exhale: 8, holdOut: 2 },
      4,
    ),
    84,
  );
});

test('target duration supports techniques with zero-duration holds', () => {
  assert.equal(
    getBreathingSessionTargetSeconds(
      { inhale: 5, holdIn: 0, exhale: 5, holdOut: 0 },
      10,
    ),
    100,
  );
});

test('session progress uses elapsed breathing time and caps at completion', () => {
  assert.equal(getBreathingSessionProgress(30, 60, false), 0.5);
  assert.equal(getBreathingSessionProgress(90, 60, false), 1);
});

test('completed sessions report full progress even without elapsed time', () => {
  assert.equal(getBreathingSessionProgress(0, 60, true), 1);
});

test('session progress guards a zero target duration', () => {
  assert.equal(getBreathingSessionProgress(0, 0, false), 0);
});

test('completed duration uses rounded wall-clock time when the session started', () => {
  assert.equal(getBreathingSessionDurationSeconds(1_000, 6_499, 3), 5);
  assert.equal(getBreathingSessionDurationSeconds(1_000, 6_500, 3), 6);
});

test('completed duration falls back to elapsed time without a start timestamp', () => {
  assert.equal(getBreathingSessionDurationSeconds(0, 6_500, 3), 3);
});
