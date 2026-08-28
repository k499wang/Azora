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

interface TransitionTimers {
  setTimeout: (run: () => void, ms: number) => ReturnType<typeof setTimeout>;
  clearTimeout: (handle: ReturnType<typeof setTimeout>) => void;
}

/**
 * How long a screen will wait on the native transition before revealing itself
 * anyway.
 *
 * `transitionEnd` is the honest signal, and on a healthy device it lands in
 * about a third of this. But it is a single event on a single listener attached
 * after the first render, and everything gated on it — the results content, the
 * celebration sheet — waits on it forever if it does not arrive. Two ways it
 * does not: a `replace` whose transition finishes before the effect subscribes,
 * and a device busy enough that the slide itself runs long. The second is why
 * the results screen takes visibly longer to come in the more the app has been
 * used in one launch.
 *
 * Far enough out that a normal transition always wins the race, so nothing
 * changes when the device is keeping up.
 */
const TRANSITION_FALLBACK_MS = 900;

/**
 * Subscribe to the first native-stack transition that finishes opening, or give
 * up waiting for it.
 *
 * Kept separate from the hook so the one-shot, fallback, and cleanup behavior
 * can be verified without rendering a navigator in domain tests.
 */
export function subscribeToOpeningTransitionEnd(
  subscribe: SubscribeToTransitionEnd,
  onComplete: () => void,
  timers: TransitionTimers = globalThis,
): () => void {
  return subscribeToTransitionEnd(subscribe, false, onComplete, timers);
}

/** Subscribe before leaving a route, then complete once its close finishes. */
export function subscribeToClosingTransitionEnd(
  subscribe: SubscribeToTransitionEnd,
  onComplete: () => void,
  timers: TransitionTimers = globalThis,
): () => void {
  return subscribeToTransitionEnd(subscribe, true, onComplete, timers);
}

function subscribeToTransitionEnd(
  subscribe: SubscribeToTransitionEnd,
  expectedClosing: boolean,
  onComplete: () => void,
  timers: TransitionTimers,
): () => void {
  let completed = false;
  let fallback: ReturnType<typeof setTimeout> | null = null;

  const clearFallback = () => {
    if (fallback == null) return;
    timers.clearTimeout(fallback);
    fallback = null;
  };

  const complete = () => {
    if (completed) return;
    completed = true;
    clearFallback();
    onComplete();
  };

  // Subscribed before the fallback is armed: the event is the better answer, so
  // give it every chance to be the one that arrives.
  const unsubscribe = subscribe((event) => {
    if (event.data.closing !== expectedClosing) return;
    complete();
  });

  fallback = timers.setTimeout(complete, TRANSITION_FALLBACK_MS);

  return () => {
    clearFallback();
    unsubscribe();
  };
}

/** True once this route's native opening transition has finished, or timed out. */
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
