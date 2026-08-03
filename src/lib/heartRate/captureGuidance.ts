import type { FingerPlacementState, SignalStatus } from './types';
import type { HeartRateStallIssue } from './captureStall';
import { getHeartRateCameraProfile } from './cameraProfile';

export function getHeartRateCameraTarget(
  modelName: string | null,
  modelId?: string | null,
): string {
  return getHeartRateCameraProfile(modelName, modelId).target;
}

export interface HeartRatePlacementStep {
  readonly title: string;
  readonly detail: string;
}

export interface HeartRatePlacementGuidance {
  readonly title: string;
  readonly instruction: string;
  readonly multiCameraWarning: string;
  readonly steps: readonly HeartRatePlacementStep[];
}

export function getHeartRatePlacementGuidance(
  modelName: string | null,
  modelId?: string | null,
): HeartRatePlacementGuidance {
  const profile = getHeartRateCameraProfile(modelName, modelId);
  const cameraTarget = profile.target;
  const isKnownLayout = profile.layout !== 'unknown';

  return {
    title: profile.title,
    instruction: isKnownLayout
      ? `Press the soft pad of your index finger against the ${cameraTarget} so it is completely covered, with your skin touching the glass. Leave the flash uncovered.`
      : 'Press the soft pad of your index finger against the lens shown in the live check so it is completely covered, with your skin touching the glass. Leave the flash uncovered.',
    multiCameraWarning: isKnownLayout
      ? `Use the highlighted ${cameraTarget} — covering another lens will not work.`
      : 'Use the lens shown during the live check — covering another lens will not work.',
    steps: [
      {
        title: isKnownLayout
          ? `Press against the ${cameraTarget}`
          : 'Press against the lens shown in the live check',
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
    ],
  };
}

export const HEART_RATE_PLACEMENT_GUIDANCE =
  getHeartRatePlacementGuidance(null);

export interface HeartRateTroubleshooting {
  readonly title: string;
  readonly diagnosis: string;
  readonly tips: readonly HeartRatePlacementStep[];
}

const TROUBLESHOOTING_TIPS: Record<string, HeartRatePlacementStep> = {
  warmHands: {
    title: 'Warm your hands first',
    detail:
      'Cold fingers pull blood away from the surface, which is the most common reason the camera can’t see a pulse. Run them under warm water or rub them together for about 30 seconds.',
  },
  removeCase: {
    title: 'Take your case off',
    detail:
      'A case that sits over the lens or tints the flash blocks the light the reading depends on.',
  },
  restOnTable: {
    title: 'Rest the phone on a table',
    detail:
      'Set the phone down and let your hand rest on it. Holding it up adds small movements that break the signal.',
  },
  indexPad: {
    title: 'Use your index fingertip',
    detail:
      'The soft pad of your index finger reads best — thumbs and the sides of fingers have thicker skin. If one hand won’t read, try the other.',
  },
  cleanLens: {
    title: 'Wipe the lens and dim the light',
    detail:
      'A smudged lens, or bright light leaking past the edge of your finger, both wash out the pulse.',
  },
  easePressure: {
    title: 'Ease off the pressure',
    detail:
      'Let your finger rest its own weight on the lens without pushing. Hard pressure squeezes out the blood flow the camera reads.',
  },
  holdStill: {
    title: 'Stay still and quiet',
    detail:
      'Stop adjusting your grip and don’t talk. Breathe normally and give your hand a few seconds to settle.',
  },
};

export function getHeartRateTroubleshooting(
  issue: HeartRateStallIssue,
  cameraTarget: string = 'camera lens',
): HeartRateTroubleshooting {
  const {
    warmHands,
    removeCase,
    restOnTable,
    indexPad,
    cleanLens,
    easePressure,
    holdStill,
  } = TROUBLESHOOTING_TIPS;

  switch (issue) {
    case 'no_finger':
      return {
        title: 'Trouble finding your pulse',
        diagnosis: `We’re not seeing your finger on the ${cameraTarget} yet.`,
        tips: [
          {
            title: `Press flat against the ${cameraTarget}`,
            detail: `Your skin has to touch the glass of the ${cameraTarget} itself. Resting near it or hovering over it reads nothing, and covering another lens won’t work.`,
          },
          removeCase,
          restOnTable,
          indexPad,
        ],
      };
    case 'partial_coverage':
      return {
        title: 'Trouble finding your pulse',
        diagnosis:
          'Your finger is on the lens, but it isn’t covering all of it.',
        tips: [
          {
            title: `Cover the ${cameraTarget} completely`,
            detail:
              'Lay the pad flat so no light slips past the edges. A fingertip resting on one side of the lens leaves a gap the camera can’t read through.',
          },
          indexPad,
          removeCase,
          warmHands,
        ],
      };
    case 'too_much_pressure':
      return {
        title: 'Trouble finding your pulse',
        diagnosis: 'You’re pressing hard enough to squeeze the blood out.',
        tips: [easePressure, restOnTable, indexPad, warmHands],
      };
    case 'motion':
      return {
        title: 'Trouble finding your pulse',
        diagnosis:
          'There’s too much movement for the camera to lock onto a pulse.',
        tips: [restOnTable, holdStill, indexPad, warmHands],
      };
    case 'no_pulse':
      return {
        title: 'Trouble finding your pulse',
        diagnosis:
          'Your placement looks right, but the signal is too faint to read a pulse from.',
        tips: [warmHands, removeCase, indexPad, cleanLens],
      };
  }
}

interface CameraCheckMessageOptions {
  fingerPlacement: FingerPlacementState;
  signalStatus: SignalStatus;
  pulseConfirmed: boolean;
  cameraTarget?: string;
}

interface PulseConfirmationOptions {
  fingerPlacement: FingerPlacementState;
  signalStatus: SignalStatus;
  bpm: number | null;
}

export function hasConfirmedPulse({
  fingerPlacement,
  signalStatus,
  bpm,
}: PulseConfirmationOptions): boolean {
  return (
    fingerPlacement === 'good' &&
    signalStatus === 'measuring' &&
    bpm != null &&
    Number.isFinite(bpm) &&
    bpm > 0
  );
}

export function getCameraCheckMessage({
  fingerPlacement,
  signalStatus,
  pulseConfirmed,
  cameraTarget = 'camera lens',
}: CameraCheckMessageOptions): string {
  if (fingerPlacement === 'no_finger' || fingerPlacement === 'lost') {
    return `Press your finger flat against the ${cameraTarget}.`;
  }
  if (fingerPlacement === 'partial' || signalStatus === 'partial_coverage') {
    return 'Lay your finger flatter against the lens.';
  }
  if (
    fingerPlacement === 'too_much_pressure' ||
    signalStatus === 'too_much_pressure'
  ) {
    return 'Press more lightly.';
  }
  if (signalStatus === 'excessive_motion') {
    return 'Rest your hand and hold still.';
  }
  if (signalStatus === 'no_pulse') {
    return `Center your fingertip pad over the ${cameraTarget}.`;
  }
  if (pulseConfirmed) {
    return 'Pulse found — hold still.';
  }
  return 'Finding your pulse…';
}

export function getMeasurementCorrectionMessage(
  signalStatus: SignalStatus,
  fingerPlacement: FingerPlacementState,
  cameraTarget: string = 'camera lens',
): string | null {
  if (
    signalStatus === 'no_finger' ||
    signalStatus === 'signal_lost' ||
    fingerPlacement === 'no_finger' ||
    fingerPlacement === 'lost'
  ) {
    return `Press your finger flat against the ${cameraTarget}.`;
  }
  if (signalStatus === 'partial_coverage' || fingerPlacement === 'partial') {
    return 'Lay your finger flatter against the lens.';
  }
  if (
    signalStatus === 'too_much_pressure' ||
    fingerPlacement === 'too_much_pressure'
  ) {
    return 'Press more lightly.';
  }
  if (signalStatus === 'excessive_motion') {
    return 'Rest your hand and hold still.';
  }
  if (signalStatus === 'no_pulse') {
    return `Center your fingertip pad over the ${cameraTarget}.`;
  }
  return null;
}
