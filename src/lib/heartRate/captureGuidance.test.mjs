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
  assert.equal(getHeartRateCameraTarget('iPhone', 'iPhone14,6'), 'camera lens');
  assert.equal(getHeartRateCameraTarget('iPhone SE (2nd generation)'), 'camera lens');
  assert.equal(getHeartRateCameraTarget('iPhone 16'), 'bottom camera');
  assert.equal(
    getHeartRateCameraTarget('iPhone 16 Pro'),
    'rightmost camera',
  );
  assert.match(
    getHeartRatePlacementGuidance('iPhone 16 Pro Max').instruction,
    /rightmost camera/,
  );
  assert.match(
    getHeartRatePlacementGuidance('iPhone 16').instruction,
    /leave the flash uncovered/i,
  );
});

test('unknown devices get generic guidance without a false camera claim', () => {
  assert.equal(getHeartRateCameraTarget('iPhone 15'), 'camera lens');
  assert.equal(getHeartRateCameraTarget(null), 'camera lens');
  assert.equal(
    getHeartRatePlacementGuidance(null).title,
    'Cover the camera lens',
  );
  assert.doesNotMatch(
    getHeartRatePlacementGuidance(null).instruction,
    /bottom|rightmost/,
  );
  assert.doesNotMatch(
    getHeartRatePlacementGuidance(null).steps[0].title,
    /bottom|rightmost/,
  );
});

test('placement steps explain coverage, pressure, and a steady posture', () => {
  const guidance = getHeartRatePlacementGuidance('iPhone 16');

  assert.deepEqual(guidance.steps, [
    {
      title: 'Press against the bottom camera',
      detail:
        'Lay the soft pad of your index finger flat on the lens and keep it pressed there. Resting it near the lens or hovering over it will not read your pulse. Keep the flash uncovered.',
    },
    {
      title: 'Firm contact, not a hard squeeze',
      detail:
        'Stay in constant contact with the glass without pushing hard. Heavy pressure squeezes out the blood flow the camera needs to read.',
    },
    {
      title: 'Keep completely still',
      detail:
        'Keep your body, hand, phone, and finger completely still. Don’t talk or adjust your grip. Breathe normally. If possible, support your phone and hand on a stable surface.',
    },
  ]);
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
  assert.equal(checkMessage(), 'Finding your pulse…');
  assert.equal(
    checkMessage({ signalStatus: 'measuring', pulseConfirmed: true }),
    'Pulse found — hold still.',
  );
});

test('camera check gives a specific correction for each placement problem', () => {
  assert.equal(
    checkMessage({ fingerPlacement: 'no_finger', signalStatus: 'no_finger' }),
    'Press your finger flat against the camera lens.',
  );
  assert.equal(
    checkMessage({ fingerPlacement: 'partial', signalStatus: 'partial_coverage' }),
    'Lay your finger flatter against the lens.',
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
    'Center your fingertip pad over the camera lens.',
  );
  assert.equal(
    checkMessage({
      fingerPlacement: 'no_finger',
      signalStatus: 'no_finger',
      cameraTarget: 'rightmost camera',
    }),
    'Press your finger flat against the rightmost camera.',
  );
});

test('measurement corrections use the same specific guidance', () => {
  assert.equal(
    getMeasurementCorrectionMessage('signal_lost', 'lost'),
    'Press your finger flat against the camera lens.',
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
