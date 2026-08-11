import { useEffect, useState } from 'react';
import type { RootStackNavigationProp, RootStackParamList } from './types';

interface TransitionEndEvent {
  data: {
    closing: boolean;
  };
}

type SubscribeToTransitionEnd = (
  listener: (event: TransitionEndEvent) => void,
) => () => void;

/**
 * Subscribe to the first native-stack transition that finishes opening.
 *
 * Kept separate from the hook so the one-shot and cleanup behavior can be
 * verified without rendering a navigator in domain tests.
 */
export function subscribeToOpeningTransitionEnd(
  subscribe: SubscribeToTransitionEnd,
  onComplete: () => void,
): () => void {
  let completed = false;

  return subscribe((event) => {
    if (event.data.closing || completed) return;

    completed = true;
    onComplete();
  });
}

/** True once this route's native opening transition has fully finished. */
export function useOpeningTransitionComplete<
  RouteName extends keyof RootStackParamList,
>(navigation: RootStackNavigationProp<RouteName>): boolean {
  const [complete, setComplete] = useState(false);

  useEffect(
    () =>
      subscribeToOpeningTransitionEnd(
        (listener) => navigation.addListener('transitionEnd', listener),
        () => setComplete(true),
      ),
    [navigation],
  );

  return complete;
}
