import { Platform, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import { isHapticsEnabled } from '../services/preferences/hapticsPreference';

let holdInterval: ReturnType<typeof setInterval> | null = null;

export function startHoldHaptics() {
  if (!isHapticsEnabled()) return;
  stopHoldHaptics();

  const fire = () => {
    if (Platform.OS === 'ios') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Vibration.vibrate(60);
    }
  };

  fire();
  holdInterval = setInterval(fire, 1000);
}

export function stopHoldHaptics() {
  if (holdInterval) {
    clearInterval(holdInterval);
    holdInterval = null;
  }
}
