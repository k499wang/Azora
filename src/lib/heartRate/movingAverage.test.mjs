import test from 'node:test';
import assert from 'node:assert/strict';
import { makeOddWindow, movingAverage } from './movingAverage.ts';

// Original O(n × window) implementation, kept here as the reference oracle the
// optimized version must match exactly (modulo floating-point rounding).
function naiveMovingAverage(values, windowSize) {
  const window = makeOddWindow(windowSize);
  const half = Math.floor(window / 2);
  const result = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - half);
    const end = Math.min(values.length, i + half + 1);
    let sum = 0;
    for (let j = start; j < end; j++) sum += values[j];
    result.push(sum / (end - start));
  }
  return result;
}

function assertClose(actual, expected, label) {
  assert.equal(actual.length, expected.length, `${label}: length`);
  for (let i = 0; i < expected.length; i++) {
    assert.ok(
      Math.abs(actual[i] - expected[i]) < 1e-9,
      `${label}: index ${i} expected ${expected[i]}, got ${actual[i]}`,
    );
  }
}

test('makeOddWindow rounds up to the nearest positive odd integer', () => {
  assert.equal(makeOddWindow(1), 1);
  assert.equal(makeOddWindow(2), 3);
  assert.equal(makeOddWindow(4), 5);
  assert.equal(makeOddWindow(5), 5);
  assert.equal(makeOddWindow(2.4), 3); // rounds to 2, then up to odd
  assert.equal(makeOddWindow(0), 1);
  assert.equal(makeOddWindow(-3), 1);
});

test('matches the naive centered average across window sizes', () => {
  const signal = Array.from({ length: 200 }, (_, i) =>
    Math.sin(i / 5) + 0.3 * Math.sin(i / 1.7) + (i % 13) * 0.01,
  );
  for (const window of [1, 3, 5, 11, 22, 41, 199, 400]) {
    assertClose(
      movingAverage(signal, window),
      naiveMovingAverage(signal, window),
      `window ${window}`,
    );
  }
});

test('window of 1 is the identity', () => {
  const signal = [3, -1, 4, 1, 5, 9, 2, 6];
  assertClose(movingAverage(signal, 1), signal, 'identity');
});

test('shrinks the window symmetrically at the edges', () => {
  const signal = [0, 1, 2, 3, 4];
  // window 3: edges average 2 samples, interior averages 3.
  assertClose(
    movingAverage(signal, 3),
    [(0 + 1) / 2, 1, 2, 3, (3 + 4) / 2],
    'edge shrink',
  );
});

test('window larger than the signal averages everything everywhere', () => {
  const signal = [2, 4, 6, 8];
  const mean = (2 + 4 + 6 + 8) / 4;
  assertClose(movingAverage(signal, 99), [mean, mean, mean, mean], 'full window');
});

test('handles an empty signal', () => {
  assert.deepEqual(movingAverage([], 5), []);
});

test('stays centered — symmetric input yields symmetric output', () => {
  const signal = [1, 2, 3, 4, 3, 2, 1];
  const smoothed = movingAverage(signal, 3);
  for (let i = 0; i < signal.length; i++) {
    const mirror = signal.length - 1 - i;
    assert.ok(
      Math.abs(smoothed[i] - smoothed[mirror]) < 1e-9,
      `expected symmetry at ${i}/${mirror}`,
    );
  }
});
