import { NativeModules, Platform } from 'react-native';

interface HeartRateCameraControlsNative {
  lockForHeartRate(deviceId: string): void;
  unlockForHeartRate(deviceId: string): void;
}

const native: HeartRateCameraControlsNative | undefined =
  Platform.OS === 'ios' ? NativeModules.HeartRateCameraControls : undefined;

export const HeartRateCameraControls = {
  lock(deviceId: string) {
    native?.lockForHeartRate(deviceId);
  },
  unlock(deviceId: string) {
    native?.unlockForHeartRate(deviceId);
  },
  isSupported: native != null,
};
