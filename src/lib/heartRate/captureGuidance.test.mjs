import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getCameraCheckMessage,
  getHeartRateCameraTarget,
  getHeartRatePlacementGuidance,
  getMeasurementCorrectionMessage,
  hasConfirmedPulse,
} from './captureGuidance.ts';

test('camera target matches the supported iPhone camera layout', () => {
  assert.equal(getHeartRateCameraTarget('iPhone 16'), 'bottom camera');
  assert.equal(
    getHeartRateCameraTarget('iPhone 16 Pro'),
    'camera all the way to the right',
  );
  assert.match(
    getHeartRatePlacementGuidance('iPhone 16 Pro Max').instruction,
    /camera all the way to the right/,
  );
});

function checkMessage(overrides = {}) {
  return getCameraCheckMessage({
    fingerPlacement: 'good',
    signalStatus: 'warming_up',
    pulseConfirmed: false,
    ...overrides,
  });
}

test('camera check distinguishes finger coverage from pulse confirmation', () => {
  assert.equal(checkMessage(), 'Finger detected—finding your pulse…');
  assert.equal(
    checkMessage({ signalStatus: 'measuring', pulseConfirmed: true }),
    'Pulse found — hold still.',
  );
});

test('camera check gives a specific correction for each placement problem', () => {
  assert.equal(
    checkMessage({ fingerPlacement: 'no_finger', signalStatus: 'no_finger' }),
    'Completely cover the bottom camera.',
  );
  assert.equal(
    checkMessage({ fingerPlacement: 'partial', signalStatus: 'partial_coverage' }),
    'Lay your finger flatter.',
  );
  assert.equal(
    checkMessage({
      fingerPlacement: 'too_much_pressure',
      signalStatus: 'too_much_pressure',
    }),
    'Press more lightly.',
  );
  assert.equal(
    checkMessage({ signalStatus: 'excessive_motion' }),
    'Rest your hand and hold still.',
  );
  assert.equal(
    checkMessage({ signalStatus: 'no_pulse' }),
    'Center your fingertip pad over the bottom camera.',
  );
  assert.equal(
    checkMessage({
      fingerPlacement: 'no_finger',
      signalStatus: 'no_finger',
      cameraTarget: 'camera all the way to the right',
    }),
    'Completely cover the camera all the way to the right.',
  );
});

test('measurement corrections use the same specific guidance', () => {
  assert.equal(
    getMeasurementCorrectionMessage('signal_lost', 'lost'),
    'Completely cover the bottom camera.',
  );
  assert.equal(
    getMeasurementCorrectionMessage('measuring', 'good'),
    null,
  );
});

test('pulse confirmation requires good placement, measuring status, and a BPM', () => {
  assert.equal(
    hasConfirmedPulse({
      fingerPlacement: 'good',
      signalStatus: 'measuring',
      bpm: 72,
    }),
    true,
  );
  assert.equal(
    hasConfirmedPulse({
      fingerPlacement: 'good',
      signalStatus: 'warming_up',
      bpm: 72,
    }),
    false,
  );
  assert.equal(
    hasConfirmedPulse({
      fingerPlacement: 'partial',
      signalStatus: 'measuring',
      bpm: 72,
    }),
    false,
  );
  assert.equal(
    hasConfirmedPulse({
      fingerPlacement: 'good',
      signalStatus: 'measuring',
      bpm: null,
    }),
    false,
  );
});
