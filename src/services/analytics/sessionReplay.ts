import { posthog } from '../../config/posthog';

/**
 * Session replay screenshots the window on the main thread, which is the same
 * thread a native-driven animation runs on — every capture during a transition
 * costs frames. Pausing across the animation leaves a gap in the recording
 * rather than ending it: `startSessionRecording(true)` resumes the current
 * session, so one replay still covers the whole flow.
 */

/** no transition should outlast this; the watchdog resumes if one leaks */
const MAX_PAUSE_MS = 2000;

let pauseDepth = 0;
let watchdog: ReturnType<typeof setTimeout> | null = null;

// stop and start are async, so overlapping transitions could otherwise resolve
// out of order and leave recording off. One chain keeps them sequential.
let queue: Promise<unknown> = Promise.resolve();

function enqueue(operation: () => Promise<void>): void {
  queue = queue.then(operation).catch(() => {});
}

function clearWatchdog(): void {
  if (watchdog == null) return;
  clearTimeout(watchdog);
  watchdog = null;
}

function resumeNow(): void {
  pauseDepth = 0;
  clearWatchdog();
  enqueue(() => posthog.startSessionRecording(true));
}

/**
 * Pauses replay until the returned resume is called. Resume is idempotent and
 * safe to call from a cleanup path — recording restarts once the last pause
 * holder releases.
 */
export function pauseSessionReplay(): () => void {
  pauseDepth += 1;

  if (pauseDepth === 1) {
    enqueue(() => posthog.stopSessionRecording());
    watchdog = setTimeout(resumeNow, MAX_PAUSE_MS);
  }

  let released = false;

  return () => {
    if (released) return;
    released = true;

    if (pauseDepth === 0) return;
    pauseDepth -= 1;
    if (pauseDepth > 0) return;

    clearWatchdog();
    enqueue(() => posthog.startSessionRecording(true));
  };
}
