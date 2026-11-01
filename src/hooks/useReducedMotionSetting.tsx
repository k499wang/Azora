import type { ReactNode } from 'react';
import { ReduceMotion } from 'react-native-reanimated';

/**
 * Azora plays every animation whatever the system's Reduce Motion setting:
 * half-skipped motion left flows looking broken. App.tsx sets the same policy
 * for Reanimated's defaults with `ReducedMotionConfig`.
 */
export function useReducedMotionSetting() {
  return false;
}

export function useAnimationReduceMotion() {
  return ReduceMotion.Never;
}

export function FullMotion({ children }: { children: ReactNode }) {
  return children;
}
