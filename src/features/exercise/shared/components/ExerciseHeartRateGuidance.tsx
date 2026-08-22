import type { FingerPlacementState, SignalStatus } from '../../../../lib/heartRate/types';

/**
 * What the reader should change right now, or null when the placement is good
 * enough to leave alone.
 */
export function placementCorrection(
  status: SignalStatus,
  placement: FingerPlacementState,
): string | null {
  switch (status) {
    case 'excessive_motion':
      return 'Too much movement — keep still';
    case 'no_pulse':
      return 'No pulse — adjust your finger';
    case 'partial_coverage':
      return 'Cover the lens fully';
    case 'too_much_pressure':
      return 'Ease up slightly';
    case 'no_finger':
    case 'signal_lost':
      return 'Rest your fingertip on the camera';
    default:
      break;
  }

  switch (placement) {
    case 'partial':
      return 'Cover the lens fully';
    case 'too_much_pressure':
      return 'Ease up slightly';
    case 'no_finger':
    case 'lost':
      return 'Rest your fingertip on the camera';
    default:
      return null;
  }
}

export function signalHint(
  status: SignalStatus,
  placement: FingerPlacementState,
): string {
  return placementCorrection(status, placement) ?? 'Hold still';
}
