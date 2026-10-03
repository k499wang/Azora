export interface VisibilitySources {
  isVisible: () => boolean;
  /** fires whenever the answer to `isVisible` may have changed */
  subscribe: (onChange: () => void) => () => void;
}

/**
 * Run work only while it can be seen, and tear it down the moment it cannot.
 * `start` learns whether it ran because the work came into view (focus,
 * foreground) rather than because it was set up or its inputs changed.
 *
 * Pure so the start/stop bookkeeping can be tested without a navigator or a
 * device; `useWhileVisible` is the hook that feeds it real focus and app state.
 */
export function runWhileVisible(
  start: (cameIntoView: boolean) => () => void,
  sources: VisibilitySources,
): () => void {
  let stop: (() => void) | null = null;

  const sync = (cameIntoView: boolean) => {
    const visible = sources.isVisible();
    if (visible && stop == null) {
      stop = start(cameIntoView);
      return;
    }

    if (!visible && stop != null) {
      stop();
      stop = null;
    }
  };

  const unsubscribe = sources.subscribe(() => sync(true));
  sync(false);

  return () => {
    unsubscribe();
    stop?.();
    stop = null;
  };
}
