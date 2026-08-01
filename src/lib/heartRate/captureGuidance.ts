import type { FingerPlacementState, SignalStatus } from './types';
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
