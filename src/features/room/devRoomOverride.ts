import { useSyncExternalStore } from 'react';
import { ROOM_SLOTS, type RoomSlot } from '../../lib/room/roomProgress';
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
 * Puts a placed piece into the fabricated room.
 *
 * Without this the lab could rehearse a placement but never its consequence:
 * the fake room stayed as it was, so the seventh piece left the room still
 * six-sevenths full and the seal had nothing to replay. The write the real flow
 * makes to the server is made here to the fiction instead, which is what lets a
 * whole day be played end to end.
 */
export function placeInOverride(
  slot: RoomSlot,
  optionId: string,
  earnedLocalDate: string,
): void {
  if (!__DEV__ || override?.room == null) return;

  const decorations = [
    ...override.room.decorations,
    { slot, optionId, earnedLocalDate },
  ];
  const nextSlot = ROOM_SLOTS[decorations.length] ?? null;

  override = {
    ...override,
    room: { ...override.room, decorations },
    progress: {
      ...override.progress,
      placedCount: decorations.length,
      nextSlot,
      isComplete: nextSlot == null,
      claimedToday: true,
      canClaim: false,
    },
  };
  listeners.forEach((listener) => listener());
}

/**
 * A dev-only nudge that replays the reward flow on Home.
 *
 * The flow fires on the day's *transition* to earned, which is three exercises
 * and a day's wait away — and a fabricated claim arrives already earned, so it
 * never crosses the line that opens it. The lab sets the fake room and then
 * asks for the flow directly.
 */
export type RewardFlowReplay = {
  /** rises on every request, so the same ask twice still plays twice */
  count: number;
  /**
   * `claim` opens the day's piece; `seal` jumps to the ending. The ending is
   * worth watching on Home rather than on a screen of its own, because the
   * room it opens is the room Home is about to draw and the handover between
   * them is the part that has to be seen.
   */
  mode: 'claim' | 'seal';
};

const NO_REPLAY: RewardFlowReplay = { count: 0, mode: 'claim' };
let replay: RewardFlowReplay = NO_REPLAY;
const replayListeners = new Set<() => void>();

export function requestRewardFlowReplay(
  mode: 'claim' | 'seal' = 'claim',
): void {
  if (!__DEV__) return;

  replay = { count: replay.count + 1, mode };
  replayListeners.forEach((listener) => listener());
}

export function useRewardFlowReplay(): RewardFlowReplay {
  return useSyncExternalStore(
    (listener) => {
      replayListeners.add(listener);
      return () => replayListeners.delete(listener);
    },
    () => replay,
    () => NO_REPLAY,
  );
}
