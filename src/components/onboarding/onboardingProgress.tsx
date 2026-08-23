import { createContext, useContext, type ReactNode } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

/**
 * The progress bar's animated value, owned above the screens instead of inside
 * them.
 *
 * Every step renders a different screen component, so the layout that draws the
 * bar unmounts and remounts on each transition. A value held inside it would
 * start from the new step's number and the bar would jump. Held here it outlives
 * the swap, so the arriving screen animates from wherever the leaving one had
 * got to — and every screen animates the same way, which is the whole point.
 *
 * It is a shared value rather than state deliberately. The width is written on
 * the UI thread, so a transition costs no React renders. The `requestAnimationFrame`
 * ramp this replaced re-rendered the entire flow once per frame, which is what
 * forced the room screens to skip the animation to stay smooth.
 */
const OnboardingProgressContext = createContext<SharedValue<number> | null>(
  null,
);

interface OnboardingProgressProviderProps {
  children: ReactNode;
}

export function OnboardingProgressProvider({
  children,
}: OnboardingProgressProviderProps) {
  const progress = useSharedValue(0);

  return (
    <OnboardingProgressContext.Provider value={progress}>
      {children}
    </OnboardingProgressContext.Provider>
  );
}

/** null outside the flow, where a screen owns its own bar */
export function useOnboardingProgressValue() {
  return useContext(OnboardingProgressContext);
}
