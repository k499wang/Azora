import { Platform, Vibration } from 'react-native';
import { ContinuousHaptics } from './continuousHaptics';
import { isHapticsEnabled } from '../services/preferences/hapticsPreference';

export function startInhaleVibration(durationMs: number) {
  if (!isHapticsEnabled()) return;

  if (Platform.OS === 'ios') {
    if (ContinuousHaptics.isSupported) {
      ContinuousHaptics.start(durationMs, 0.9, 0.05);
    }
    return;
  }

  Vibration.vibrate(durationMs);
}

export function stopInhaleVibration() {
  if (Platform.OS === 'ios') {
    if (ContinuousHaptics.isSupported) {
      ContinuousHaptics.stop();
    }
    return;
  }

  Vibration.cancel();
}
