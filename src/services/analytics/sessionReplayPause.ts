export interface SessionReplayPauseOptions {
  /** `null` keeps replay paused until the holder explicitly releases it. */
  autoResumeAfterMs?: number | null;
}

interface SessionReplayPauseOperations {
  stop: () => Promise<void>;
  resume: () => Promise<void>;
}

export const DEFAULT_SESSION_REPLAY_PAUSE_MS = 2000;

/**
 * Coordinates replay pauses from independent animation owners.
 *
 * Each caller owns its own optional watchdog and idempotent release. Replay
 * resumes only after every holder releases, so one expired transition cannot
 * accidentally resume recording over another animation that is still active.
 */
export function createSessionReplayPause(
  operations: SessionReplayPauseOperations,
): (options?: SessionReplayPauseOptions) => () => void {
  let holderCount = 0;
  let replayPaused = false;

  // Stop and resume are async. Serialise them and re-read the desired state
  // after each operation: a new holder may arrive while a resume is queued or
  // already in flight.
  let queue: Promise<unknown> = Promise.resolve();
  const reconcile = async () => {
    while (replayPaused !== (holderCount > 0)) {
      const shouldPause = holderCount > 0;
      if (shouldPause) {
        await operations.stop();
      } else {
        await operations.resume();
      }
      replayPaused = shouldPause;
    }
  };
  const enqueueReconcile = () => {
    queue = queue.then(reconcile).catch(() => {});
  };

  return ({
    autoResumeAfterMs = DEFAULT_SESSION_REPLAY_PAUSE_MS,
  }: SessionReplayPauseOptions = {}) => {
    holderCount += 1;
    enqueueReconcile();

    let released = false;
    let watchdog: ReturnType<typeof setTimeout> | null = null;

    const release = () => {
      if (released) return;
      released = true;

      if (watchdog != null) {
        clearTimeout(watchdog);
        watchdog = null;
      }

      holderCount -= 1;
      enqueueReconcile();
    };

    if (autoResumeAfterMs != null) {
      watchdog = setTimeout(release, autoResumeAfterMs);
    }

    return release;
  };
}
