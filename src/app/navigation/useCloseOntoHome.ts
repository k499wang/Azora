import { useCallback, useEffect, useState } from 'react';
import { returnToHome } from './returnToHome';
import type { RootStackNavigationProp, RootStackParamList } from './types';

/**
 * Closes this screen onto Home, with no transition.
 *
 * For a screen that hands the finished day to Home to celebrate. Going back
 * instead lands on whichever tab opened it — the plan's "Start my plan", say —
 * and the celebration then waits, unseen, for somebody to visit Home. Sliding
 * away first would put its exit between the tap and what the tap opened, so
 * the animation is switched off a frame ahead of the pop, which gives the
 * native stack the new option before it dismisses.
 */
export function useCloseOntoHome<RouteName extends keyof RootStackParamList>(
  navigation: RootStackNavigationProp<RouteName>,
): () => void {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!closing) return;

    navigation.setOptions({ animation: 'none' });
    const frame = requestAnimationFrame(() => returnToHome(navigation));
    return () => cancelAnimationFrame(frame);
  }, [closing, navigation]);

  return useCallback(() => setClosing(true), []);
}
