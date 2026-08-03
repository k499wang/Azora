import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isGraphContaminated,
  smoothLiveSignalGraphSamples,
} from './liveSignalGraphSmoothing.ts';

function samples(values) {
  return values.map((value, index) => ({
    timestamp: index * 33,
    value,
    quality: index / 10,
  }));
}

test('Savitzky-Golay smoothing applies the centered five-point coefficients', () => {
  const input = samples([0, 0, 10, 0, 0]);
  const result = smoothLiveSignalGraphSamples(input);

  assert.equal(result[2].value, 170 / 35);
});

test('graph smoothing preserves edge values, timestamps, and quality', () => {
  const input = samples([1, 2, 9, 4, 5, 6, 7]);
  const result = smoothLiveSignalGraphSamples(input);

  assert.deepEqual(result.slice(0, 2), input.slice(0, 2));
  assert.deepEqual(result.slice(-2), input.slice(-2));
  assert.deepEqual(
    result.map(({ timestamp, quality }) => ({ timestamp, quality })),
    input.map(({ timestamp, quality }) => ({ timestamp, quality })),
  );
  assert.notEqual(result, input);
  assert.notEqual(result[2], input[2]);
});

test('graph smoothing returns detached unchanged samples below five points', () => {
  const input = samples([1, 2, 3, 4]);
  const result = smoothLiveSignalGraphSamples(input);

  assert.deepEqual(result, input);
  assert.notEqual(result, input);
  assert.notEqual(result[0], input[0]);
});

test('graph smoothing attenuates alternating frame-to-frame ripple', () => {
  const input = samples([0, 0, 1, -1, 1, -1, 1, -1, 1, 0, 0]);
  const result = smoothLiveSignalGraphSamples(input);
  const interiorPeak = Math.max(
    ...result.slice(2, -2).map(({ value }) => Math.abs(value)),
  );

  assert.ok(
    interiorPeak < 0.5,
    `expected alternating ripple below half amplitude, got ${interiorPeak}`,
  );
});

test('graph smoothing retains the height and timing of a broad pulse', () => {
  const input = samples([0, 0, 1, 3, 6, 8, 6, 3, 1, 0, 0]);
  const result = smoothLiveSignalGraphSamples(input);
  const peakValue = Math.max(...result.map(({ value }) => value));
  const peakIndex = result.findIndex(({ value }) => value === peakValue);

  assert.ok(peakValue >= 8 * 0.9, `expected broad peak retention, got ${peakValue}`);
  assert.equal(peakIndex, 5, 'broad pulse peak should remain on its original frame');
});

test('graph contamination is limited to motion and no-pulse states', () => {
  assert.equal(isGraphContaminated('excessive_motion'), true);
  assert.equal(isGraphContaminated('no_pulse'), true);
  assert.equal(isGraphContaminated('measuring'), false);
  assert.equal(isGraphContaminated('signal_lost'), false);
  assert.equal(isGraphContaminated(undefined), false);
});
