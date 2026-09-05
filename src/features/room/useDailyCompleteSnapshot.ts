import { useCallback, useEffect, useRef, useState } from 'react';
import { DAILIES_PER_DAY } from '../../lib/dailies';
import type { RoomSlot } from '../../lib/room/roomProgress';
import { markSeenDailies, readSeenDailies } from './dailyProgressSeen';
import type { RoomClaim } from './useRoomClaim';

const SNAPSHOT_DEADLINE_MS = 900;

/** Everything the completion celebration needs from live room state. */
export interface DailyCompleteState {
  /** How much of today is done: the dailies plus the to-dos ticked off. */
  done: number;
  /** What today asks for in total: three dailies plus today's to-dos. */
  total: number;
  /** The whole day is done and today's piece has not yet been placed. */
  unlocked: boolean;
  /** False once today's piece is placed, or the room is full. */
  showBar: boolean;
  nextSlot: RoomSlot | null;
}

export interface DailyCompleteSnapshot {
  state: DailyCompleteState;
  /** Frozen progress-bar origin, including repeat-daily behavior. */
  barFrom: number;
  todayLocalDate: string;
}

/** The locally completed slots to project while persistence catches up. */
export interface DailyCompletionProjection {
  guided?: boolean;
  handPicked?: boolean;
  breathHold?: boolean;
}

/** Keep the animated snapshot frozen while canonical entitlement catches up. */
export function isDailyCompleteRewardReady(
  state: Pick<DailyCompleteState, 'unlocked'>,
  canClaim: boolean,
): boolean {
  return !state.unlocked || canClaim;
}

export function buildDailyCompleteSnapshot(
  claim: Pick<RoomClaim, 'dailies' | 'day' | 'progress'>,
  seenDone: number | null,
  projection: DailyCompletionProjection = {},
): DailyCompleteSnapshot {
  const guidedCompleted =
    claim.dailies.guidedCompleted || projection.guided === true;
  const handPickedCompleted =
    claim.dailies.handPickedCompleted || projection.handPicked === true;
  const breathHoldCompleted =
    claim.dailies.breathHoldCompleted || projection.breathHold === true;
  const dailiesDone = [
    guidedCompleted,
    handPickedCompleted,
    breathHoldCompleted,
  ].filter(Boolean).length;
  // The to-do list earns the same decoration, so the bar counts it too — see
  // `useDayCompletion`. The just-finished session is projected on top of the
  // dailies, but nothing on the list can have changed since it started.
  const done = dailiesDone + claim.day.todosDone;
  const total = DAILIES_PER_DAY + claim.day.todosTotal;
  const allCompleted =
    // Already earned today counts even if a to-do has since been unticked.
    claim.day.allCompleted ||
    (guidedCompleted &&
      handPickedCompleted &&
      breathHoldCompleted &&
      claim.day.todosDone === claim.day.todosTotal);
  const canClaim =
    allCompleted &&
    !claim.progress.claimedToday &&
    !claim.progress.isComplete &&
    claim.progress.nextSlot != null;

  return {
    state: {
      done,
      total,
      unlocked: canClaim,
      showBar: !claim.progress.isComplete && !claim.progress.claimedToday,
      nextSlot: claim.progress.nextSlot,
    },
    barFrom: (seenDone ?? Math.max(0, done - 1)) / total,
    todayLocalDate: claim.dailies.todayLocalDate,
  };
}

/**
 * Freeze the room/dailies values used by one completion celebration.
 *
 * The just-finished slot is projected locally, so persistence is not part of
 * the visual critical path. Existing cached state supplies the other slots and
 * room status; the deadline only covers an unusually cold/missing cache.
 */
export function useDailyCompleteSnapshot({
  active,
  claim,
  projection,
}: {
  active: boolean;
  claim: RoomClaim;
  projection: DailyCompletionProjection;
}) {
  const [snapshot, setSnapshot] = useState<DailyCompleteSnapshot | null>(null);
  const latest = useRef<DailyCompleteSnapshot | null>(null);

  if (active && snapshot == null) {
    latest.current = buildDailyCompleteSnapshot(
      claim,
      readSeenDailies(claim.dailies.todayLocalDate),
      projection,
    );
  }

  const freezeLatest = useCallback(() => {
    setSnapshot((current) => current ?? latest.current);
  }, []);

  useEffect(() => {
    if (!active) {
      setSnapshot(null);
      return;
    }
    if (snapshot != null) return;

    const deadline = setTimeout(freezeLatest, SNAPSHOT_DEADLINE_MS);
    return () => clearTimeout(deadline);
  }, [active, freezeLatest, snapshot]);

  useEffect(() => {
    if (!active || snapshot != null) return;
    if (!claim.isLoading) freezeLatest();
  }, [
    active,
    claim.isLoading,
    freezeLatest,
    snapshot,
  ]);

  const markSeen = useCallback(() => {
    if (snapshot == null) return;
    markSeenDailies(snapshot.todayLocalDate, snapshot.state.done);
  }, [snapshot]);

  return { snapshot, markSeen };
}
