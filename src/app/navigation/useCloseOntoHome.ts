import { useCallback, useEffect, useState } from 'react';
import type { RootStackNavigationProp, RootStackParamList } from './types';

/**
 * Closes this screen with no transition.
 *
 * For a screen that hands off to something drawn over the screen beneath it:
 * sliding away first would put its exit between the tap and what the tap
 * opened. The animation is switched off a frame ahead of the pop, so the native
 * stack has the new option before it dismisses.
 */
export function useCloseInstantly<RouteName extends keyof RootStackParamList>(
  navigation: RootStackNavigationProp<RouteName>,
): () => void {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!closing) return;

    navigation.setOptions({ animation: 'none' });
    const frame = requestAnimationFrame(() => navigation.goBack());
    return () => cancelAnimationFrame(frame);
  }, [closing, navigation]);

  return useCallback(() => setClosing(true), []);
}
