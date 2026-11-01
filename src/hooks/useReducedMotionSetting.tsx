import { createContext, useContext, type ReactNode } from 'react';
import { ReducedMotionConfig, ReduceMotion, useReducedMotion } from 'react-native-reanimated';

const FullMotionContext = createContext(false);

/** Plays every animation below it in full, even with the system's Reduce Motion on. */
export function FullMotion({ children }: { children: ReactNode }) {
  return (
    <FullMotionContext.Provider value>
      <ReducedMotionConfig mode={ReduceMotion.Never} />
      {children}
    </FullMotionContext.Provider>
  );
}

/** The system's Reduce Motion setting, unless a `FullMotion` above overrides it. */
export function useReducedMotionSetting() {
  const system = useReducedMotion();
  return useContext(FullMotionContext) ? false : system;
}
