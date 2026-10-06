import { createContext, useContext, useState, type ReactNode } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import {
  createProgressLedger,
  type ProgressLedger,
} from '../../lib/onboardingMilestones';

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
 *
 * The ledger lives here for the same reason: which milestones the flow has
 * already celebrated has to survive the swap too.
 */
interface OnboardingProgress {
  value: SharedValue<number>;
  ledger: ProgressLedger;
}

const OnboardingProgressContext = createContext<OnboardingProgress | null>(
  null,
);

interface OnboardingProgressProviderProps {
  children: ReactNode;
}

export function OnboardingProgressProvider({
  children,
}: OnboardingProgressProviderProps) {
  const value = useSharedValue(0);
  const [progress] = useState(() => ({
    value,
    ledger: createProgressLedger(0),
  }));

  return (
    <OnboardingProgressContext.Provider value={progress}>
      {children}
    </OnboardingProgressContext.Provider>
  );
}

/** null outside the flow, where a screen owns its own bar */
export function useOnboardingProgress() {
  return useContext(OnboardingProgressContext);
}
