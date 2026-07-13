import { useMemo } from 'react';
import * as Device from 'expo-device';
import {
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
} from 'react-native-vision-camera';
import type { CameraPosition } from 'react-native-vision-camera';

const TELEPHOTO_CAMERA_MODEL_NAMES = new Set([
  'iPhone 17 Pro',
  'iPhone 17 Pro Max',
]);

function shouldUseTelephotoCameraForHeartRate(modelName: string | null): boolean {
  return modelName != null && TELEPHOTO_CAMERA_MODEL_NAMES.has(modelName);
}

export function useHeartRateCamera(preferredFps: 30 | 60 = 30) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const physicalDevices = useMemo(
    () => shouldUseTelephotoCameraForHeartRate(Device.modelName)
      ? ['telephoto-camera' as const]
      : ['wide-angle-camera' as const],
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
