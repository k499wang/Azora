import * as Haptics from 'expo-haptics';
import { isHapticsEnabled } from '../services/preferences/hapticsPreference';
import { ContinuousHaptics } from './continuousHaptics';

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

export function triggerSoftHaptic() {
  if (!isHapticsEnabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
}

export function triggerTodoCompleteHaptic() {
  triggerSoftHaptic();
}

export function triggerActivityCompleteHaptic() {
  if (!isHapticsEnabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function triggerBreathingCompleteHaptic() {
  triggerSoftHaptic();
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

// The phone-in-your-pocket double buzz a text message makes: two full-strength
// rumbles with a short gap, start to start.
const NOTIFICATION_RUMBLE_MS = 300;
const NOTIFICATION_RUMBLE_GAP_MS = 450;
const NOTIFICATION_RUMBLE_INTENSITY = 1;
const NOTIFICATION_RUMBLE_SHARPNESS = 0.35;

// Where there is no continuous motor to drive, the system's own banner tap
// followed by one heavier impact, on the 100–150 ms beat iOS uses.
const NOTIFICATION_TAP_GAP_MS = 140;

// The buzz of a message arriving, for the one place in the app that imitates a
// real notification — a real vibration rather than taps, so it lands like one.
export function triggerNotificationHaptic() {
  if (!isHapticsEnabled()) return;
  if (ContinuousHaptics.isSupported) {
    const rumble = () =>
      ContinuousHaptics.start(
        NOTIFICATION_RUMBLE_MS,
        NOTIFICATION_RUMBLE_INTENSITY,
        NOTIFICATION_RUMBLE_SHARPNESS,
      );
    rumble();
    setTimeout(() => {
      if (!isHapticsEnabled()) return;
      rumble();
    }, NOTIFICATION_RUMBLE_GAP_MS);
    return;
  }
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  setTimeout(() => {
    if (!isHapticsEnabled()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  }, NOTIFICATION_TAP_GAP_MS);
}

// The gap between the two halves of a message buzz, a touch tighter than a
// system banner's so a run of arriving messages does not smear together.
const MESSAGE_BUZZ_GAP_MS = 90;

// The buzz of a text message arriving in the conversation: the notification's
// shape at conversation volume. A single light impact reads as a click, which
// is why an arriving line gets two — it should feel like a message landing.
// The screen-level notification keeps its own, heavier pattern.
export function triggerMessageHaptic() {
  if (!isHapticsEnabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
  setTimeout(() => {
    if (!isHapticsEnabled()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, MESSAGE_BUZZ_GAP_MS);
}

// Success notification for flows that intentionally use the system pattern.
export function triggerSuccessHaptic() {
  if (!isHapticsEnabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    () => {},
  );
}

// A gentle corrective tick when the tapped choice was not the one asked for.
export function triggerMissHaptic() {
  if (!isHapticsEnabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

// A light impact for gentle beats — phase changes, arriving on a result
// surface, a soft tick.
export function triggerLightHaptic() {
  if (!isHapticsEnabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

// The crisp knock a counter lands on after ticking up through selection
// clicks — the last coin settling into the balance.
export function triggerCoinSettleHaptic() {
  if (!isHapticsEnabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => {});
}

// A heavy impact for milestone beats (streak milestones, jackpot moments).
export function triggerHeavyHaptic() {
  if (!isHapticsEnabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
}

// One weighty tick for a milestone celebration.
export function triggerCelebrationHaptic() {
  triggerHeavyHaptic();
}
