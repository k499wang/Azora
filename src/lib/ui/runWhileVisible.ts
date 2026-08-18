export interface VisibilitySources {
  isVisible: () => boolean;
  /** fires whenever the answer to `isVisible` may have changed */
  subscribe: (onChange: () => void) => () => void;
}

/**
 * Run work only while it can be seen, and tear it down the moment it cannot.
 *
 * Pure so the start/stop bookkeeping can be tested without a navigator or a
 * device; `useWhileVisible` is the hook that feeds it real focus and app state.
 */
export function runWhileVisible(
  start: () => () => void,
  sources: VisibilitySources,
): () => void {
  let stop: (() => void) | null = null;

  const sync = () => {
    const visible = sources.isVisible();
    if (visible && stop == null) {
      stop = start();
      return;
    }

    if (!visible && stop != null) {
      stop();
      stop = null;
    }
  };

  const unsubscribe = sources.subscribe(sync);
  sync();

  return () => {
    unsubscribe();
    stop?.();
    stop = null;
  };
}
