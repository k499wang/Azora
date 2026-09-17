import { useSyncExternalStore } from 'react';

/**
 * Force the survey offer onto Home, for dev only.
 *
 * The offer is shown once, to a free account, and never again once it has been
 * answered or closed. Clearing the stored dismissal is therefore only half of
 * what it takes to see it: a dev account with an entitlement is filtered out
 * before storage is ever consulted, so the bar stays hidden no matter how often
 * the flag is reset. This lies about both gates and nothing else — the bar, its
 * animation, the link it opens and the write it makes on dismissal are all the
 * real ones.
 *
 * `__DEV__` is checked at the read, so a release build cannot report a forced
 * offer even if one were somehow set. The write is guarded too, so it cannot be
 * set in the first place — either alone is enough, which is the point of having
 * both.
 */

let forced = false;
const listeners = new Set<() => void>();

export function setSurveyOfferForced(next: boolean): void {
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

export function useSurveyOfferForced(): boolean {
  return useSyncExternalStore(subscribe, read, read);
}
