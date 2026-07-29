import test from 'node:test';
import assert from 'node:assert/strict';
import { calibrationDurationMs } from './gaugeCalibration.ts';

test('sweep speed is constant across the middle of the range', () => {
  const short = calibrationDurationMs(0, 40);
  const long = calibrationDurationMs(0, 80);
  assert.equal(long, short * 2);
});

test('a tiny sweep still lasts long enough to read as motion', () => {
  assert.ok(calibrationDurationMs(0, 1) >= 800);
});

test('a full sweep stays under the patience limit', () => {
  assert.ok(calibrationDurationMs(0, 100) <= 2400);
});

test('direction does not change the duration', () => {
  assert.equal(calibrationDurationMs(70, 20), calibrationDurationMs(20, 70));
});
