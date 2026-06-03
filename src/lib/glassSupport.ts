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
// - 'blur'   — expo-blur BlurView; a real frosted blur on iOS < 26 and on
//              Android (the BlurView must set experimentalBlurMethod
//              "dimezisBlurView", otherwise Android renders only a flat tint).
// - 'solid'  — opaque scrim. Reserved for Reduce Transparency, where the user
//              has asked the OS to avoid blur/translucency entirely.
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
  // Reduce Transparency (accessibility): opaque scrim, no blur or translucency.
  if (reduceTransparency) return 'solid';
  // Everything else blurs — iOS < 26 natively, Android via dimezisBlurView.
  return 'blur';
}
