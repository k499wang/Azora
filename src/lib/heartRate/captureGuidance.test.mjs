import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getCameraCheckMessage,
  getHeartRateCameraTarget,
  getHeartRatePlacementGuidance,
  getHeartRateTroubleshooting,
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

test('troubleshooting leads with the fix for the fault that stalled the check', () => {
  assert.match(
    getHeartRateTroubleshooting('no_finger', 'bottom camera').tips[0].title,
    /bottom camera/,
  );
  assert.match(
    getHeartRateTroubleshooting('partial_coverage', 'bottom camera').tips[0].title,
    /cover the bottom camera completely/i,
  );
  assert.match(
    getHeartRateTroubleshooting('too_much_pressure').tips[0].title,
    /ease off/i,
  );
  assert.match(
    getHeartRateTroubleshooting('motion').tips[0].title,
    /table/i,
  );
});

test('a faint signal leads with warm hands, the usual real cause', () => {
  const troubleshooting = getHeartRateTroubleshooting('no_pulse');

  assert.match(troubleshooting.tips[0].title, /warm your hands/i);
  assert.match(troubleshooting.diagnosis, /too faint/i);
});

test('every fault gets a title, a diagnosis, and distinct tips', () => {
  const issues = [
    'no_finger',
    'partial_coverage',
    'too_much_pressure',
    'motion',
    'no_pulse',
  ];

  for (const issue of issues) {
    const { title, diagnosis, tips } = getHeartRateTroubleshooting(issue);
    assert.equal(title, 'Trouble finding your pulse');
    assert.ok(diagnosis.length > 0, `${issue} has no diagnosis`);
    assert.equal(tips.length, 4, `${issue} has the wrong tip count`);
    assert.equal(
      new Set(tips.map((tip) => tip.title)).size,
      tips.length,
      `${issue} repeats a tip`,
    );
    for (const tip of tips) {
      assert.ok(tip.detail.length > 0, `${issue} has an empty tip detail`);
    }
  }
});
