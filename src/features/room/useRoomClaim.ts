import { useRoomOverride } from './devRoomOverride';
import { useDayCompletion, type DayCompletion } from './useDayCompletion';
import { roomProgress, type RoomProgress } from '../../lib/room/roomProgress';
import { useCurrentRoomQuery } from '../../queries/room/useCurrentRoomQuery';
import type { Room } from '../../services/room/roomService';
import type { DailiesCompletion } from '../../hooks/useDailiesCompletion';

export interface RoomClaim {
  room: Room | null;
  progress: RoomProgress;
  /** the three sessions on their own, for the screens that list them */
  dailies: DailiesCompletion;
  /** the whole day — sessions and to-dos — which is what earns a decoration */
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
 * The rule is the whole day: the three dailies *and* today's to-dos. See
 * `useDayCompletion`.
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
      dailiesComplete: day.allCompleted,
    }),
    dailies,
    day,
    isLoading: currentRoomQuery.isPending || day.isLoading,
  };
}
