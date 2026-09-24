import { useEffect, useRef } from 'react';
import type { RootStackNavigationProp, RootStackParamList } from './types';
import { subscribeToClosingTransitionEnd } from './useOpeningTransitionComplete';

/**
 * Runs `onClosed` once this screen has finished closing, however it leaves —
 * a button, the close control, Android back, or a pop from somewhere else.
 *
 * The screen underneath regains focus the moment the close starts, so anything
 * meant to greet the user there has to wait for this rather than for focus.
 * Bounded by the same fallback as the opening transition, so a close whose
 * event never arrives still completes.
 */
export function useAfterScreenClosed<RouteName extends keyof RootStackParamList>(
  navigation: RootStackNavigationProp<RouteName>,
  onClosed: () => void,
) {
  const latest = useRef(onClosed);
  latest.current = onClosed;

  useEffect(
    () =>
      navigation.addListener('beforeRemove', () => {
        let unsubscribe = () => {};
        unsubscribe = subscribeToClosingTransitionEnd(
          (listener) => navigation.addListener('transitionEnd', listener),
          () => {
            unsubscribe();
            latest.current();
          },
        );
      }),
    [navigation],
  );
}
