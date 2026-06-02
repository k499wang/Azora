export type GlassMode = 'liquid' | 'blur' | 'solid';

export interface GlassEnv {
  platform: 'ios' | 'android';
  liquidGlassAvailable: boolean;
  glassApiAvailable: boolean;
  forceFallback?: boolean;
  reduceTransparency?: boolean;
}

// Single source of truth for "which glass treatment can this surface use".
//
// - 'liquid' — native Liquid Glass (iOS 26+ only, both capability flags true).
// - 'blur'   — expo-blur BlurView; a real frosted blur on iOS < 26.
// - 'solid'  — opaque scrim. Android gets this because expo-blur does NOT
//              render a blur without the experimental Dimezis method, so a
//              translucent BlurView leaves content legible. For lock/paywall
//              overlays that means an opaque scrim is the only correct choice.
export function resolveGlassMode({
  platform,
  liquidGlassAvailable,
  glassApiAvailable,
  forceFallback = false,
  reduceTransparency = false,
}: GlassEnv): GlassMode {
  const liquidReady =
    !forceFallback &&
    platform === 'ios' &&
    liquidGlassAvailable &&
    glassApiAvailable;

  // Native Liquid Glass honors Reduce Transparency itself, so leave it to the OS.
  if (liquidReady) return 'liquid';
  if (platform === 'android') return 'solid';
  // BlurView ignores Reduce Transparency, so downgrade to an opaque scrim.
  if (reduceTransparency) return 'solid';
  return 'blur';
}
