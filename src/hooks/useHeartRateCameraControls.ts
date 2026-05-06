import { useEffect, useRef } from 'react';
import type { CameraDevice } from 'react-native-vision-camera';
import type { FingerPlacementState } from '../lib/heartRate/types';
import { HeartRateCameraControls } from '../native/heartRateCameraControls';

const STABLE_GOOD_DURATION_MS = 500;

interface UseHeartRateCameraControlsOptions {
  device?: CameraDevice;
  isActive: boolean;
  torchMode: 'on' | 'off';
  fingerPlacement?: FingerPlacementState;
}

export function useHeartRateCameraControls({
  device,
  isActive,
  torchMode,
  fingerPlacement,
}: UseHeartRateCameraControlsOptions): void {
  const deviceId = device?.id;
  const lockedRef = useRef(false);
  const stableTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const eligible =
      deviceId != null &&
      isActive &&
      torchMode === 'on' &&
      HeartRateCameraControls.isSupported;

    if (!eligible || deviceId == null) {
      if (stableTimerRef.current != null) {
        clearTimeout(stableTimerRef.current);
        stableTimerRef.current = null;
      }
      if (lockedRef.current && deviceId != null) {
        HeartRateCameraControls.unlock(deviceId);
        lockedRef.current = false;
      }
      return;
    }

    if (fingerPlacement === 'good') {
      if (lockedRef.current || stableTimerRef.current != null) return;

      stableTimerRef.current = setTimeout(() => {
        stableTimerRef.current = null;
        HeartRateCameraControls.lock(deviceId);
        lockedRef.current = true;
      }, STABLE_GOOD_DURATION_MS);
      return;
    }

    if (stableTimerRef.current != null) {
      clearTimeout(stableTimerRef.current);
      stableTimerRef.current = null;
    }
    if (lockedRef.current) {
      HeartRateCameraControls.unlock(deviceId);
      lockedRef.current = false;
    }
  }, [deviceId, isActive, torchMode, fingerPlacement]);

  useEffect(() => {
    return () => {
      if (stableTimerRef.current != null) {
        clearTimeout(stableTimerRef.current);
        stableTimerRef.current = null;
      }
      if (lockedRef.current && deviceId != null) {
        HeartRateCameraControls.unlock(deviceId);
        lockedRef.current = false;
      }
    };
  }, [deviceId]);
}
