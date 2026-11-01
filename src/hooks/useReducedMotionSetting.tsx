import { createContext, useContext, type ReactNode } from 'react';
import { ReduceMotion, useReducedMotion } from 'react-native-reanimated';

const FullMotionContext = createContext(false);

/** Scoped motion policy; animation callers apply it without changing global settings. */
export function FullMotion({ children }: { children: ReactNode }) {
  return (
    <FullMotionContext.Provider value>
      {children}
    </FullMotionContext.Provider>
  );
}

/** Pass to Reanimated configs, modifiers and layout builders at every animation level. */
export function useAnimationReduceMotion() {
  return useContext(FullMotionContext) ? ReduceMotion.Never : ReduceMotion.System;
}

/** The system's Reduce Motion setting, unless a `FullMotion` above overrides it. */
export function useReducedMotionSetting() {
  const system = useReducedMotion();
  return useContext(FullMotionContext) ? false : system;
}
