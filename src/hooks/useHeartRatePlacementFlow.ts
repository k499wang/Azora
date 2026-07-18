import { useCallback, useEffect, useRef } from 'react';
import { getBreathExercisePlacementStartDelayMs } from '../lib/heartRate/measurementTimer';
import type { FingerPlacementState, SignalStatus } from '../lib/heartRate/types';

interface PlacementFlowControl {
  start: () => boolean;
  isActive: () => boolean;
  cancel: () => void;
}

interface UseHeartRatePlacementFlowOptions {
  flow: PlacementFlowControl;
  accessLoading: boolean;
  accessAllowed: boolean;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  cameraAvailable: boolean;
  placementActive: boolean;
  heartRateEnabled: boolean;
  fingerPlacement: FingerPlacementState;
  signalStatus: SignalStatus;
  bpmLocked: boolean;
  onAccessDenied: () => void;
  onPlacementStarted: () => void;
  onPlacementReady: () => void;
  onHeartRateDisabled: () => void;
  onPermissionDenied: () => void;
  onCameraUnavailable: () => void;
  onUnexpectedError: (error: unknown) => void;
}

export function useHeartRatePlacementFlow({
  flow,
  accessLoading,
  accessAllowed,
  hasPermission,
  requestPermission,
  cameraAvailable,
  placementActive,
  heartRateEnabled,
  fingerPlacement,
  signalStatus,
  bpmLocked,
  onAccessDenied,
  onPlacementStarted,
  onPlacementReady,
  onHeartRateDisabled,
  onPermissionDenied,
  onCameraUnavailable,
  onUnexpectedError,
}: UseHeartRatePlacementFlowOptions) {
  const onPlacementReadyRef = useRef(onPlacementReady);
  onPlacementReadyRef.current = onPlacementReady;

  const startPlacement = useCallback(async () => {
    if (accessLoading) return;
    if (!accessAllowed) {
      onAccessDenied();
      return;
    }
    if (!flow.start()) return;

    try {
      const permissionGranted = hasPermission ? true : await requestPermission();
      if (!flow.isActive()) return;

      if (!permissionGranted) {
        onPermissionDenied();
        onHeartRateDisabled();
        flow.cancel();
        return;
      }

      if (!cameraAvailable) {
        onCameraUnavailable();
        onHeartRateDisabled();
        flow.cancel();
        return;
      }

      onPlacementStarted();
    } catch (error) {
      if (!flow.isActive()) return;
      onUnexpectedError(error);
      onCameraUnavailable();
      onHeartRateDisabled();
      flow.cancel();
    }
  }, [
    accessAllowed,
    accessLoading,
    cameraAvailable,
    flow,
    hasPermission,
    onAccessDenied,
    onCameraUnavailable,
    onHeartRateDisabled,
    onPermissionDenied,
    onPlacementStarted,
    onUnexpectedError,
    requestPermission,
  ]);

  const placementStartDelayMs = getBreathExercisePlacementStartDelayMs({
    fingerPlacement,
    signalStatus,
    bpmLocked,
  });

  useEffect(() => {
    if (!placementActive || !heartRateEnabled || placementStartDelayMs == null) {
      return;
    }

    const timeout = setTimeout(() => {
      if (!flow.isActive()) return;
      onPlacementReadyRef.current();
    }, placementStartDelayMs);

    return () => clearTimeout(timeout);
  }, [flow, heartRateEnabled, placementActive, placementStartDelayMs]);

  return { startPlacement };
}
