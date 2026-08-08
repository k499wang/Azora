import * as Haptics from 'expo-haptics';
import { isHapticsEnabled } from '../services/preferences/hapticsPreference';

// Lightweight selection feedback for card / list-row taps — the app's
// equivalent of Apple's UISelectionFeedbackGenerator. Subtle by design, and
// it respects the in-app Haptics toggle in Settings.
export function triggerTapHaptic() {
  if (!isHapticsEnabled()) return;
  Haptics.selectionAsync().catch(() => {});
}

// Two soft bumps timed to the room blob's two hops, so the poke is felt as a
// boing rather than a click. The delay matches `CHEER_HOP_GAP_MS` in RoomBlob.
export function triggerBounceHaptic() {
  if (!isHapticsEnabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  setTimeout(() => {
    if (!isHapticsEnabled()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
  }, 340);
}
