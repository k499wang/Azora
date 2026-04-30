import { NativeModules, Platform } from 'react-native';

interface CameraSettingsLockNative {
  lockSettings(): Promise<{
    focusLocked: boolean;
    exposureLocked: boolean;
    whiteBalanceLocked: boolean;
  }>;
  unlockSettings(): Promise<void>;
}

const native: CameraSettingsLockNative | undefined =
  Platform.OS === 'ios' ? NativeModules.CameraSettingsLock : undefined;

export const CameraSettingsLock = {
  isSupported: native != null,
  async lock() {
    if (!native) return null;
    try {
      return await native.lockSettings();
    } catch {
      return null;
    }
  },
  async unlock() {
    if (!native) return;
    try {
      await native.unlockSettings();
    } catch {
      // best-effort
    }
  },
};
