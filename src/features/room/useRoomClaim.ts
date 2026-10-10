import { useRoomOverride } from './devRoomOverride';
import { useDayCompletion, type DayCompletion } from './useDayCompletion';
import { roomProgress, type RoomProgress } from '../../lib/room/roomProgress';
import { useCurrentRoomQuery } from '../../queries/room/useCurrentRoomQuery';
import type { Room } from '../../services/room/roomService';
import type { DailiesCompletion } from '../../hooks/useDailiesCompletion';

export interface RoomClaim {
  room: Room | null;
  progress: RoomProgress;
  /** the sessions on their own, for the screens that list them */
  dailies: DailiesCompletion;
  /** the plan activities that earn a decoration */
  day: DayCompletion;
  isLoading: boolean;
}

/**
 * The room's state and whether a piece is waiting to be placed.
 *
 * Four places ask this — the picker, the Home badge, and both post-session
 * screens — and they must agree, or the badge promises something the picker
 * refuses to give.
 *
 * The rule is today's plan steps, including a claimed to-do on the days that
 * ask for one. See `useDayCompletion`.
 */
export function useRoomClaim(userId: string | null): RoomClaim {
  const override = useRoomOverride();
  const currentRoomQuery = useCurrentRoomQuery(userId);
  const day = useDayCompletion(userId);
  const dailies = day.dailies;
  const currentRoom = currentRoomQuery.data;

  // Dev lab only, and `useRoomOverride` returns null in release builds.
  if (override != null) {
    return override;
  }

  return {
    room: currentRoom?.room ?? null,
    progress: roomProgress({
      decorations: currentRoom?.room?.decorations ?? [],
      lastEarnedLocalDate: currentRoom?.lastEarnedLocalDate ?? null,
      todayLocalDate: dailies.todayLocalDate,
      // An unread room is not an empty one: a failed read must not offer a
      // piece the user may already have placed today.
      dailiesComplete: day.allCompleted && currentRoom != null,
    }),
    dailies,
    day,
    isLoading: currentRoomQuery.isPending || day.isLoading,
  };
}
