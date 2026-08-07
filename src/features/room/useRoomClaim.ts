import { useDailiesCompletion } from '../../hooks/useDailiesCompletion';
import { roomProgress, type RoomProgress } from '../../lib/room/roomProgress';
import { useCurrentRoomQuery } from '../../queries/room/useCurrentRoomQuery';
import type { Room } from '../../services/room/roomService';
import type { DailiesCompletion } from '../../hooks/useDailiesCompletion';

export interface RoomClaim {
  room: Room | null;
  progress: RoomProgress;
  dailies: DailiesCompletion;
  isLoading: boolean;
}

/**
 * The room's state and whether a piece is waiting to be placed.
 *
 * Four places ask this — the picker, the Home badge, and both post-session
 * screens — and they must agree, or the badge promises something the picker
 * refuses to give.
 */
export function useRoomClaim(userId: string | null): RoomClaim {
  const currentRoomQuery = useCurrentRoomQuery(userId);
  const dailies = useDailiesCompletion(userId);
  const currentRoom = currentRoomQuery.data;

  return {
    room: currentRoom?.room ?? null,
    progress: roomProgress({
      decorations: currentRoom?.room?.decorations ?? [],
      lastEarnedLocalDate: currentRoom?.lastEarnedLocalDate ?? null,
      todayLocalDate: dailies.todayLocalDate,
      dailiesComplete: dailies.allCompleted,
    }),
    dailies,
    isLoading: currentRoomQuery.isPending || dailies.isLoading,
  };
}
