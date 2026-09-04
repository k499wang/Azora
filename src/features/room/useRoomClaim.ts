import { useDailiesCompletion } from '../../hooks/useDailiesCompletion';
import { useDecorationDelivery } from './useDecorationDelivery';
import { useRoomOverride } from './devRoomOverride';
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
  const override = useRoomOverride();
  const currentRoomQuery = useCurrentRoomQuery(userId);
  const dailies = useDailiesCompletion(userId);
  const deliveryReadyAt = useDecorationDelivery(
    userId,
    dailies.todayLocalDate,
    dailies.allCompleted,
  );
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
      dailiesComplete: dailies.allCompleted,
      deliveryReadyAt,
      nowMs: Date.now(),
    }),
    dailies,
    isLoading: currentRoomQuery.isPending || dailies.isLoading,
  };
}
