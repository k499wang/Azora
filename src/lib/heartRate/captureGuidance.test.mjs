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

test('guidance never names a lens by direction on any layout', () => {
  const models = [
    ['iPhone', 'iPhone14,6'],
    ['iPhone SE (2nd generation)'],
    ['iPhone 16'],
    ['iPhone 16 Pro'],
    ['iPhone 16 Pro Max'],
    ['iPhone 15'],
    [null],
  ];

  for (const [modelName, modelId] of models) {
    assert.equal(getHeartRateCameraTarget(modelName, modelId), 'camera lens');

    const guidance = getHeartRatePlacementGuidance(modelName, modelId);
    const spoken = [
      guidance.title,
      guidance.instruction,
      guidance.multiCameraWarning,
      ...guidance.steps.flatMap((step) => [step.title, step.detail]),
    ].join(' ');
    assert.doesNotMatch(spoken, /bottom camera|rightmost|leftmost|top camera/i, String(modelName));
  }

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
    getHeartRatePlacementGuidance(null).steps[1].title,
    /bottom|rightmost/,
  );
});

test('placement steps prepare the hand, then explain coverage, pressure, and a steady posture', () => {
  const guidance = getHeartRatePlacementGuidance('iPhone 16');

  assert.deepEqual(guidance.steps, [
    {
      title: 'Case off, hands warm',
      detail:
        'A case sitting over the lens or tinting the flash blocks the light the reading needs. Cold fingers are the other common blocker \u2014 rub your hands together for about 30 seconds first.',
    },
    {
      title: 'Press against the lens shown in the live check',
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
        'Keep your body, hand, phone, and finger completely still. Don’t talk or adjust your grip. Breathe normally. If you can, rest your elbows on a table or your knees so your hands are braced.',
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
    getHeartRateTroubleshooting('no_finger', 'camera lens').tips[0].title,
    /camera lens/,
  );
  assert.match(
    getHeartRateTroubleshooting('partial_coverage', 'camera lens').tips[0].title,
    /cover the camera lens completely/i,
  );
  assert.match(
    getHeartRateTroubleshooting('too_much_pressure').tips[0].title,
    /ease off/i,
  );
  assert.match(
    getHeartRateTroubleshooting('motion').tips[0].title,
    /brace your arms/i,
  );
});

test('steadying advice never asks for the phone to be put down on its lens', () => {
  const issues = [
    'no_finger',
    'partial_coverage',
    'too_much_pressure',
    'motion',
    'no_pulse',
  ];

  for (const issue of issues) {
    const spoken = getHeartRateTroubleshooting(issue)
      .tips.flatMap((tip) => [tip.title, tip.detail])
      .join(' ');
    assert.doesNotMatch(spoken, /set the phone down|rest the phone on/i, issue);
  }

  assert.doesNotMatch(
    getHeartRatePlacementGuidance('iPhone 16')
      .steps.map((step) => step.detail)
      .join(' '),
    /support your phone .* on a stable surface/i,
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
