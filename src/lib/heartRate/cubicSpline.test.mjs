import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildNaturalCubicSpline,
  evaluateSpline,
  upsampleCubicSpline,
} from './cubicSpline.ts';

test('buildNaturalCubicSpline throws on fewer than 2 points', () => {
  assert.throws(() => buildNaturalCubicSpline([0], [1]), /at least 2 points/);
});

test('buildNaturalCubicSpline throws on non-increasing x', () => {
  assert.throws(() => buildNaturalCubicSpline([0, 1, 1], [1, 2, 3]), /strictly increasing/);
  assert.throws(() => buildNaturalCubicSpline([0, 2, 1], [1, 2, 3]), /strictly increasing/);
});

test('buildNaturalCubicSpline throws on non-finite points', () => {
  assert.throws(() => buildNaturalCubicSpline([0, NaN], [1, 2]), /finite/);
  assert.throws(() => buildNaturalCubicSpline([0, 1], [1, Infinity]), /finite/);
});

test('evaluateSpline returns exact values at knots', () => {
  const x = [0, 1, 2, 3, 4];
  const y = [0, 1, 4, 9, 16]; // y = x²
  const spline = buildNaturalCubicSpline(x, y);

  for (let i = 0; i < x.length; i++) {
    const result = evaluateSpline(spline, x[i]);
    assert.ok(
      Math.abs(result - y[i]) < 1e-10,
      `expected ${y[i]} at x=${x[i]}, got ${result}`,
    );
  }
});

test('evaluateSpline clamps outside the spline domain', () => {
  const x = [0, 1, 2, 3];
  const y = [3, 8, 4, 6];
  const spline = buildNaturalCubicSpline(x, y);

  assert.equal(evaluateSpline(spline, -1), y[0]);
  assert.ok(Math.abs(evaluateSpline(spline, 4) - y[y.length - 1]) < 1e-10);
});

test('upsampleCubicSpline increases sample rate', () => {
  const timestamps = [0, 33.3, 66.7, 100, 133.3, 166.7];
  const values = [0, 1, 0, -1, 0, 1];

  const result = upsampleCubicSpline(values, timestamps, 180);

  assert.equal(result.sampleRate, 180);
  assert.ok(result.values.length > values.length * 4, 'should have many more samples');
  assert.equal(result.values.length, result.timestamps.length);

  // First and last timestamps should match
  assert.ok(Math.abs(result.timestamps[0] - timestamps[0]) < 0.1);
  assert.ok(
    Math.abs(result.timestamps[result.timestamps.length - 1] - timestamps[timestamps.length - 1]) < 10,
    'last timestamp should be near original end',
  );
  assert.ok(
    result.timestamps[result.timestamps.length - 1] <= timestamps[timestamps.length - 1],
    'upsampling should not generate samples outside the input range',
  );
});

test('upsampleCubicSpline rejects invalid input', () => {
  assert.throws(() => upsampleCubicSpline([], [], 180), /at least 2 samples/);
  assert.throws(() => upsampleCubicSpline([1], [0], 180), /at least 2 samples/);
  assert.throws(() => upsampleCubicSpline([1, 2], [0], 180), /same length/);
  assert.throws(() => upsampleCubicSpline([1, 2], [0, 0], 180), /strictly increasing/);
  assert.throws(() => upsampleCubicSpline([1, NaN], [0, 1], 180), /finite/);
  assert.throws(() => upsampleCubicSpline([1, 2], [0, 1], 0), /targetRate/);
});

test('upsampleCubicSpline emits uniform 180Hz timestamps', () => {
  const result = upsampleCubicSpline([0, 1, 0, -1], [100, 133.4, 166.8, 200.2], 180);
  const expectedStep = 1000 / 180;

  for (let i = 1; i < result.timestamps.length; i++) {
    assert.ok(
      Math.abs(result.timestamps[i] - result.timestamps[i - 1] - expectedStep) < 1e-9,
      `timestamp spacing should be ${expectedStep}ms`,
    );
  }
  assert.equal(result.sampleRate, 180);
});

test('upsampleCubicSpline preserves sinusoidal shape', () => {
  // 1 Hz sine wave sampled at 30 Hz for 2 seconds
  const fs = 30;
  const duration = 2;
  const timestamps = [];
  const values = [];
  for (let i = 0; i <= fs * duration; i++) {
    const t = (i / fs) * 1000;
    timestamps.push(t);
    values.push(Math.sin(2 * Math.PI * 1 * (i / fs)));
  }

  const result = upsampleCubicSpline(values, timestamps, 180);

  // Check that peaks are near ±1
  const maxVal = Math.max(...result.values);
  const minVal = Math.min(...result.values);
  assert.ok(maxVal > 0.95, `expected peak near 1, got ${maxVal}`);
  assert.ok(minVal < -0.95, `expected trough near -1, got ${minVal}`);

  // Check zero crossings are preserved
  const originalZeroCrossings = countZeroCrossings(values);
  const upsampledZeroCrossings = countZeroCrossings(result.values);
  assert.ok(
    Math.abs(upsampledZeroCrossings - originalZeroCrossings) <= 2,
    `zero crossings should be preserved: original=${originalZeroCrossings}, upsampled=${upsampledZeroCrossings}`,
  );
});

test('upsampleCubicSpline falls back to linear for < 4 points', () => {
  const timestamps = [0, 50, 100];
  const values = [0, 5, 10];

  const result = upsampleCubicSpline(values, timestamps, 180);

  assert.equal(result.sampleRate, 180);
  assert.ok(result.values.length > values.length);
});

test('upsampleCubicSpline handles PPG-like waveform', () => {
  // Simulate a PPG-like signal: slow drift + pulse
  const timestamps = [];
  const values = [];
  const fs = 30;
  const duration = 3; // 3 seconds

  for (let i = 0; i < fs * duration; i++) {
    const t = i / fs;
    timestamps.push(t * 1000);
    // Slow baseline drift + 1.2 Hz pulse + harmonics
    const pulse =
      Math.sin(2 * Math.PI * 1.2 * t) +
      0.3 * Math.sin(2 * Math.PI * 2.4 * t - 0.5) +
      0.1 * Math.sin(2 * Math.PI * 3.6 * t - 1.0);
    const drift = 0.1 * Math.sin(2 * Math.PI * 0.1 * t);
    values.push(pulse + drift);
  }

  const result = upsampleCubicSpline(values, timestamps, 180);

  // Should have ~6x more samples
  assert.ok(
    result.values.length >= values.length * 5,
    `expected ~6x samples, got ${result.values.length} from ${values.length}`,
  );

  // Peak locations should be preserved (within tolerance)
  const originalPeaks = findPeaks(values, fs);
  const upsampledPeaks = findPeaks(result.values, 180);

  assert.ok(
    Math.abs(upsampledPeaks.length - originalPeaks.length) <= 1,
    `peak count should match: original=${originalPeaks.length}, upsampled=${upsampledPeaks.length}`,
  );
});

// --- Helpers ---

function countZeroCrossings(signal) {
  let count = 0;
  for (let i = 1; i < signal.length; i++) {
    if ((signal[i - 1] < 0 && signal[i] >= 0) || (signal[i - 1] > 0 && signal[i] <= 0)) {
      count++;
    }
  }
  return count;
}

function findPeaks(signal, sampleRate) {
  const peaks = [];
  const minDistanceSamples = Math.floor(sampleRate * 0.4); // 400ms refractory
  let lastPeakIndex = -minDistanceSamples;

  for (let i = 1; i < signal.length - 1; i++) {
    if (
      signal[i] > signal[i - 1] &&
      signal[i] > signal[i + 1] &&
      signal[i] > 0.1 &&
      i - lastPeakIndex >= minDistanceSamples
    ) {
      peaks.push({ index: i, value: signal[i] });
      lastPeakIndex = i;
    }
  }
  return peaks;
}
