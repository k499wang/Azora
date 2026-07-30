import { useMemo } from 'react';
import * as Device from 'expo-device';
import {
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
} from 'react-native-vision-camera';
import type { CameraPosition } from 'react-native-vision-camera';
import { getHeartRatePhysicalCamera } from '../lib/heartRate/cameraProfile';

export function useHeartRateCamera(preferredFps: 30 | 60 = 30) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const physicalDevices = useMemo(
    () => [getHeartRatePhysicalCamera(Device.modelName)],
    [],
  );
  const position: CameraPosition = useMemo(
    () => 'back',
    [],
  );
  const device = useCameraDevice(
    position,
    { physicalDevices },
  );
  const format = useCameraFormat(device, [
    { fps: preferredFps },
    { videoResolution: { width: 320, height: 240 } },
    { videoHdr: false },
    { photoHdr: false },
    { videoStabilizationMode: 'off' },
  ]);

  return {
    device,
    format,
    hasPermission,
    requestPermission,
  };
}
