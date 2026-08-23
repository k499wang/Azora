import { useMutation, useQueryClient } from '@tanstack/react-query';
import { placeDecoration } from '../../services/room/roomService';
import { getCurrentRoomQueryKey } from './useCurrentRoomQuery';
import { getRoomsQueryKey } from './useRoomsQuery';
import { getDayHistoryQueryKeyPrefix } from '../history/useDayHistoryQuery';
import { resolveUserIsPro } from '../subscriptions/useUserEntitlementQuery';
import {
  trackRoomCompleted,
  trackRoomDecorationPlaced,
} from '../../services/analytics/room';
import { ROOM_SLOT_COUNT, type RoomSlot } from '../../lib/room/roomProgress';
import { useAuthStore } from '../../stores/authStore';

interface PlaceDecorationInput {
  slot: RoomSlot;
  optionId: string;
  earnedLocalDate: string;
}

export function usePlaceDecorationMutation(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slot,
      optionId,
      earnedLocalDate,
    }: PlaceDecorationInput) => {
      if (userId == null) {
        throw new Error('Cannot place a decoration without a signed-in user.');
      }

      return placeDecoration(userId, slot, optionId, earnedLocalDate);
    },
    onSuccess: (currentRoom, variables) => {
      const queryKey = getCurrentRoomQueryKey(userId);
      queryClient.setQueryData(queryKey, currentRoom);
      void queryClient.invalidateQueries({
        queryKey: getRoomsQueryKey(userId),
        exact: true,
      });
      void queryClient.invalidateQueries({
        queryKey: getDayHistoryQueryKeyPrefix(userId),
      });

      // Tracked here rather than in the screen because this is the only path a
      // written decoration takes. The dev lab never reaches it — the lab's
      // fabricated room short-circuits before `mutate`, so previews cannot
      // pollute the funnel.
      const room = currentRoom.room;
      if (room == null) return;

      const placedCount = room.decorations.length;
      const completesRoom = placedCount >= ROOM_SLOT_COUNT;
      const analyticsUserId = userId;
      if (analyticsUserId == null) return;
      const properties = {
        floor: room.floor,
        slot: variables.slot,
        optionId: variables.optionId,
        placedCount,
        completesRoom,
      };

      void resolveUserIsPro(queryClient, analyticsUserId).then((isPro) => {
        if (useAuthStore.getState().user?.id !== analyticsUserId) return;

        trackRoomDecorationPlaced({ isPro, ...properties });
        if (completesRoom) {
          trackRoomCompleted({ isPro, floor: properties.floor });
        }
      });
    },
  });
}
