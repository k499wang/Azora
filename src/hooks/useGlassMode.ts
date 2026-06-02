import { useSyncExternalStore } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import {
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import { resolveGlassMode, type GlassMode } from '../lib/glassSupport';

// Native capability is fixed for the process lifetime, so probe once.
const platform = Platform.OS === 'android' ? 'android' : 'ios';
const liquidGlassAvailable = isLiquidGlassAvailable();
const glassApiAvailable = isGlassEffectAPIAvailable();

// Dev-only override so any fallback can be inspected on a glass-capable
// device. EXPO_PUBLIC_* is inlined at bundle time, so restart Metro with a
// cleared cache after changing it: `npx expo start -c`.
//
//   EXPO_PUBLIC_FORCE_GLASS_MODE=solid   -> force the opaque scrim (Android look)
//   EXPO_PUBLIC_FORCE_GLASS_MODE=blur    -> force the BlurView (iOS < 26 look)
//   EXPO_PUBLIC_FORCE_GLASS_MODE=liquid  -> force native Liquid Glass
//   EXPO_PUBLIC_FORCE_GLASS_FALLBACK=true-> force the platform's natural
//                                           non-glass fallback (iOS->blur)
function envForcedMode(): GlassMode | null {
  if (!__DEV__) return null;
  const raw = process.env.EXPO_PUBLIC_FORCE_GLASS_MODE;
  if (raw === 'liquid' || raw === 'blur' || raw === 'solid') return raw;
  if (process.env.EXPO_PUBLIC_FORCE_GLASS_FALLBACK === 'true') {
    return resolveGlassMode({
      platform,
      liquidGlassAvailable,
      glassApiAvailable,
      forceFallback: true,
    });
  }
  return null;
}

let forcedMode: GlassMode | null = envForcedMode();
const listeners = new Set<() => void>();

function notifyAll() {
  listeners.forEach((notify) => notify());
}

// Reduce Transparency can toggle at runtime, so track it live and re-resolve.
let reduceTransparency = false;
AccessibilityInfo.isReduceTransparencyEnabled().then((enabled) => {
  if (enabled === reduceTransparency) return;
  reduceTransparency = enabled;
  notifyAll();
});
AccessibilityInfo.addEventListener('reduceTransparencyChanged', (enabled) => {
  reduceTransparency = enabled;
  notifyAll();
});

// Pass a GlassMode to force it, or null to return to native behavior.
export function setForcedGlassMode(mode: GlassMode | null) {
  if (!__DEV__ || forcedMode === mode) return;
  forcedMode = mode;
  notifyAll();
}

export function getForcedGlassMode() {
  return forcedMode;
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

function getSnapshot(): GlassMode {
  if (forcedMode) return forcedMode;
  return resolveGlassMode({
    platform,
    liquidGlassAvailable,
    glassApiAvailable,
    reduceTransparency,
  });
}

export function useGlassMode(): GlassMode {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
