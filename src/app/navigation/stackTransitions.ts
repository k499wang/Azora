import { useSyncExternalStore } from 'react';
import { subscribeToClosingTransitionEnd } from './useOpeningTransitionComplete';

type SubscribeToTransitionEnd = Parameters<typeof subscribeToClosingTransitionEnd>[0];
type TransitionTimers = Parameters<typeof subscribeToClosingTransitionEnd>[2];

/**
 * Whether a root-stack screen is still sliding off whatever it uncovered.
 *
 * The screen underneath regains focus the moment the close starts, so focus
 * alone would start work under the slide. `beforeRemove` arrives in JS before
 * the state changes, which is earlier than the uncovered screen can react, so
 * nothing slips through between the two. A screen already off screen — under
 * another one, or dismissed natively before JS heard about it — has no close
 * left to wait for.
 */
export function createStackTransitions(timers?: TransitionTimers) {
  const offScreen = new Set<string>();
  const removing = new Set<string>();
  const listeners = new Set<() => void>();
  let closing = 0;

  const notify = () => listeners.forEach((listener) => listener());

  return {
    willRemove(routeKey: string, subscribe: SubscribeToTransitionEnd) {
      if (offScreen.delete(routeKey)) return;
      removing.add(routeKey);
      closing += 1;
      if (closing === 1) notify();
      let unsubscribe = () => {};
      unsubscribe = subscribeToClosingTransitionEnd(subscribe, () => {
        unsubscribe();
        removing.delete(routeKey);
        closing -= 1;
        if (closing === 0) notify();
      }, timers);
    },
    transitionEnded(routeKey: string, closed: boolean) {
      if (!closed) offScreen.delete(routeKey);
      else if (!removing.has(routeKey)) offScreen.add(routeKey);
    },
    isSettled: () => closing === 0,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const stackTransitions = createStackTransitions();

/** False while a root-stack screen is still closing over the app. */
export function useStackSettled(): boolean {
  return useSyncExternalStore(stackTransitions.subscribe, stackTransitions.isSettled);
}
