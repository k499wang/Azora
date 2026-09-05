import { useSyncExternalStore } from 'react';

/**
 * Pretend today's three dailies are finished, for the dev lab only.
 *
 * The room loop hangs off one flag — `allCompleted` — and reaching it honestly
 * costs two breathing sessions and a breath hold, every time any part of what
 * follows needs another look. This lies about that flag and nothing else, so
 * the delivery wait, the claim, the picker and the write are all the real ones
 * running on real data.
 *
 * `__DEV__` is checked at the read, so a release build cannot report a forced
 * completion even if one were somehow set. The write is guarded too, so it
 * cannot be set in the first place — either alone is enough, which is the point
 * of having both.
 */

let forced = false;
const listeners = new Set<() => void>();

export function setDailiesForcedComplete(next: boolean): void {
  if (!__DEV__) return;

  forced = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function read(): boolean {
  return __DEV__ ? forced : false;
}

/** True when the day is being reported as done without having been done. */
export function areDailiesForcedComplete(): boolean {
  return read();
}

export function useDailiesForcedComplete(): boolean {
  return useSyncExternalStore(subscribe, read, read);
}
