import type { FingerPlacementState, SignalStatus } from './types';
import { getHeartRateCameraProfile } from './cameraProfile';

export function getHeartRateCameraTarget(modelName: string | null): string {
  return getHeartRateCameraProfile(modelName).target;
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
): HeartRatePlacementGuidance {
  const profile = getHeartRateCameraProfile(modelName);
  const cameraTarget = profile.target;
  const isKnownLayout = profile.layout !== 'unknown';

  return {
    title: profile.title,
    instruction: isKnownLayout
      ? `Place the soft pad of your index finger flat over the ${cameraTarget} and cover it completely. Leave the flash uncovered.`
      : 'Place the soft pad of your index finger flat over the lens shown in the live check and cover it completely. Leave the flash uncovered.',
    multiCameraWarning: isKnownLayout
      ? `Use the highlighted ${cameraTarget} — covering another lens will not work.`
      : 'Use the lens shown during the live check — covering another lens will not work.',
    steps: [
      {
        title: isKnownLayout
          ? `Cover the ${cameraTarget} completely`
          : 'Cover the lens shown in the live check',
        detail:
          'Lay the soft pad of your index finger flat over the lens. Keep the flash uncovered.',
      },
      {
        title: 'Use a light touch',
        detail: 'Pressing hard can weaken the signal.',
      },
      {
        title: 'Stay still',
        detail: 'Sit down, rest your hand, and breathe normally.',
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

export function isHeartRatePlacementReady(
  fingerPlacement: FingerPlacementState,
): boolean {
  return fingerPlacement === 'good';
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
  cameraTarget: string = 'camera lens',
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
