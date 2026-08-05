import * as Haptics from 'expo-haptics';
import { isHapticsEnabled } from '../services/preferences/hapticsPreference';

// Lightweight selection feedback for card / list-row taps — the app's
// equivalent of Apple's UISelectionFeedbackGenerator. Subtle by design, and
// it respects the in-app Haptics toggle in Settings.
export function triggerTapHaptic() {
  if (!isHapticsEnabled()) return;
  Haptics.selectionAsync().catch(() => {});
}
