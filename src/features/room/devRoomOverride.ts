import { useSyncExternalStore } from 'react';
import type { RoomClaim } from './useRoomClaim';

/**
 * A fake room state, for the dev lab only.
 *
 * The decorate screen reads its whole world from `useRoomClaim`, so there is no
 * way to see its states without arranging real progress — three exercises and a
 * day's wait per case. This lets the lab hand the real screen a fabricated
 * answer instead.
 *
 * `__DEV__` is checked at the read, not the write, so a release build cannot
 * return an override even if one were somehow set.
 */

let override: RoomClaim | null = null;
const listeners = new Set<() => void>();

export function setRoomOverride(next: RoomClaim | null): void {
  override = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function read(): RoomClaim | null {
  return __DEV__ ? override : null;
}

/** True when the screen is showing fabricated state and must not write. */
export function isRoomOverridden(): boolean {
  return read() != null;
}

export function useRoomOverride(): RoomClaim | null {
  return useSyncExternalStore(subscribe, read, read);
}
