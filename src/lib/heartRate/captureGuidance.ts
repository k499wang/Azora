import type { FingerPlacementState, SignalStatus } from './types';

const RIGHT_CAMERA_IPHONE_MODELS = new Set([
  'iPhone 16 Pro',
  'iPhone 16 Pro Max',
]);

export function getHeartRateCameraTarget(modelName: string | null): string {
  return modelName != null && RIGHT_CAMERA_IPHONE_MODELS.has(modelName)
    ? 'camera all the way to the right'
    : 'bottom camera';
}

export function getHeartRatePlacementGuidance(modelName: string | null) {
  const cameraTarget = getHeartRateCameraTarget(modelName);

  return {
    title: 'Place your finger correctly',
    instruction: `Put the soft center of your index fingertip over the ${cameraTarget}. Lay it flat so the camera lens is completely covered.`,
    multiCameraWarning: `Use the highlighted ${cameraTarget} — covering another lens will not work.`,
    cues: [
      `Completely cover the ${cameraTarget}`,
      'Touch gently — don’t press hard',
      'Rest your hand and hold completely still',
    ],
  } as const;
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
  cameraTarget = 'bottom camera',
}: CameraCheckMessageOptions): string {
  if (fingerPlacement === 'no_finger' || fingerPlacement === 'lost') {
    return `Completely cover the ${cameraTarget}.`;
  }
  if (fingerPlacement === 'partial' || signalStatus === 'partial_coverage') {
    return 'Lay your finger flatter.';
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
  return 'Finger detected—finding your pulse…';
}

export function getMeasurementCorrectionMessage(
  signalStatus: SignalStatus,
  fingerPlacement: FingerPlacementState,
  cameraTarget: string = 'bottom camera',
): string | null {
  if (
    signalStatus === 'no_finger' ||
    signalStatus === 'signal_lost' ||
    fingerPlacement === 'no_finger' ||
    fingerPlacement === 'lost'
  ) {
    return `Completely cover the ${cameraTarget}.`;
  }
  if (signalStatus === 'partial_coverage' || fingerPlacement === 'partial') {
    return 'Lay your finger flatter.';
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
