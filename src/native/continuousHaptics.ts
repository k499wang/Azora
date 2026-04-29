import { NativeModules, Platform } from 'react-native';

interface ContinuousHapticsNative {
  start(intensity: number, sharpness: number, durationSeconds: number): void;
  stop(): void;
}

const native: ContinuousHapticsNative | undefined =
  Platform.OS === 'ios' ? NativeModules.ContinuousHaptics : undefined;

export const ContinuousHaptics = {
  start(durationMs: number, intensity = 0.6, sharpness = 0.5) {
    if (!native) return;
    const seconds = Math.min(30, Math.max(0.05, durationMs / 1000));
    native.start(intensity, sharpness, seconds);
  },
  stop() {
    native?.stop();
  },
  isSupported: native != null,
};
