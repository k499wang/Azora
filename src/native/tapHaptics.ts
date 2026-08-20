import * as Haptics from 'expo-haptics';
import { isHapticsEnabled } from '../services/preferences/hapticsPreference';

// Lightweight selection feedback for card / list-row taps — the app's
// equivalent of Apple's UISelectionFeedbackGenerator. Subtle by design, and
// it respects the in-app Haptics toggle in Settings.
export function triggerTapHaptic() {
  if (!isHapticsEnabled()) return;
  Haptics.selectionAsync().catch(() => {});
}

// The weightier knock a full-width primary action gets, so committing to
// something feels different from picking a row.
export function triggerMediumHaptic() {
  if (!isHapticsEnabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
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

// A single success notification — completions, rewards, and unlocks. Routes
// every "you did it" through one guarded helper so no screen can forget the
// user's Haptics toggle.
export function triggerSuccessHaptic() {
  if (!isHapticsEnabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    () => {},
  );
}

// A light impact for gentle beats — phase changes, arriving on a result
// surface, a soft tick.
export function triggerLightHaptic() {
  if (!isHapticsEnabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

// A heavy impact for milestone beats (streak milestones, jackpot moments).
export function triggerHeavyHaptic() {
  if (!isHapticsEnabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
}

// The full celebration: a success chime paired with a heavy knock, guarded once.
export function triggerCelebrationHaptic() {
  triggerSuccessHaptic();
  triggerHeavyHaptic();
}
