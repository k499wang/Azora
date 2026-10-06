import { startUiTimer } from './uiThreadTimer';

/**
 * Holds background work until the motion on screen has played out.
 *
 * A refetch that lands mid-animation re-renders whatever shows it, and every
 * React commit holds Reanimated's props registry while the UI thread waits on
 * it for the next frame. One tap set off a wallet refetch inside the tick and
 * a streak refetch inside the list closing up, so the same tick was smooth or
 * dropped frames depending on how fast the network answered. Work that only
 * corrects what is already shown waits here instead.
 */
let quietAt = 0;
const waiting = new Set<() => void>();
let cancelTimer: (() => void) | null = null;

function flush() {
  cancelTimer = null;
  const remaining = quietAt - Date.now();
  if (remaining > 0) {
    cancelTimer = startUiTimer(remaining, flush);
    return;
  }
  const ready = [...waiting];
  waiting.clear();
  ready.forEach((callback) => callback());
}

/** Motion starting now runs for `ms`; anything waiting goes after it. */
export function holdMotionQuiet(ms: number): void {
  quietAt = Math.max(quietAt, Date.now() + ms);
}

/** Runs `callback` once no motion is held, at once if none is. */
export function whenMotionQuiet(callback: () => void): void {
  if (Date.now() >= quietAt) {
    callback();
    return;
  }
  waiting.add(callback);
  if (cancelTimer == null) cancelTimer = startUiTimer(quietAt - Date.now(), flush);
}
