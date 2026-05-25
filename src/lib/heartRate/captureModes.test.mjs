import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HEART_RATE_CAPTURE_MODES,
  HEART_RATE_CAPTURE_MODE_ORDER,
  DEFAULT_CAPTURE_MODE,
  getCaptureModeConfig,
  isCaptureModeLocked,
} from './captureModes.ts';

test('quick mode is heart-rate only and free; full mode adds HRV and is Pro-only', () => {
  const quick = HEART_RATE_CAPTURE_MODES.quick;
  const full = HEART_RATE_CAPTURE_MODES.full;

  assert.equal(quick.computeHrv, false);
  assert.equal(quick.requiresPro, false);

  assert.equal(full.computeHrv, true);
  assert.equal(full.requiresPro, true);

  // The longer analysis must take longer than the quick one.
  assert.ok(full.durationMs > quick.durationMs);
});

test('the default mode is usable by free users', () => {
  // Critical invariant: a free user must land on a mode they can actually run.
  assert.equal(isCaptureModeLocked(DEFAULT_CAPTURE_MODE, false), false);
});

test('isCaptureModeLocked gates only Pro-required modes for non-Pro users', () => {
  assert.equal(isCaptureModeLocked('quick', false), false);
  assert.equal(isCaptureModeLocked('quick', true), false);

  assert.equal(isCaptureModeLocked('full', false), true);
  assert.equal(isCaptureModeLocked('full', true), false);
});

test('the mode order lists every defined mode exactly once', () => {
  const defined = Object.keys(HEART_RATE_CAPTURE_MODES).sort();
  const ordered = [...HEART_RATE_CAPTURE_MODE_ORDER].sort();
  assert.deepEqual(ordered, defined);
});

test('getCaptureModeConfig returns the config matching the requested id', () => {
  for (const mode of HEART_RATE_CAPTURE_MODE_ORDER) {
    assert.equal(getCaptureModeConfig(mode).id, mode);
  }
});
