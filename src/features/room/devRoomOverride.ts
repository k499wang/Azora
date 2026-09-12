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
 * `__DEV__` is checked at the read, so a release build cannot return an override
 * even if one were somehow set. The write is guarded too, so it cannot be set
 * in the first place — either alone is enough, which is the point of having
 * both.
 */

let override: RoomClaim | null = null;
const listeners = new Set<() => void>();

export function setRoomOverride(next: RoomClaim | null): void {
  if (!__DEV__) return;

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

/**
 * A dev-only nudge that replays the reward flow on Home.
 *
 * The flow fires on the day's *transition* to earned, which is three exercises
 * and a day's wait away — and a fabricated claim arrives already earned, so it
 * never crosses the line that opens it. The lab sets the fake room and then
 * asks for the flow directly.
 */
let replays = 0;
const replayListeners = new Set<() => void>();

export function requestRewardFlowReplay(): void {
  if (!__DEV__) return;

  replays += 1;
  replayListeners.forEach((listener) => listener());
}

export function useRewardFlowReplay(): number {
  return useSyncExternalStore(
    (listener) => {
      replayListeners.add(listener);
      return () => replayListeners.delete(listener);
    },
    () => replays,
    () => 0,
  );
}
