import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createNextRoom, type RoomLook } from '../../services/room/roomService';
import { getCurrentRoomQueryKey } from './useCurrentRoomQuery';
import { getRoomsQueryKey } from './useRoomsQuery';
import { resolveUserIsPro } from '../subscriptions/useUserEntitlementQuery';
import { trackRoomStarted } from '../../services/analytics/room';
import { useAuthStore } from '../../stores/authStore';

export function useCreateNextRoomMutation(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (look: RoomLook) => {
      if (userId == null) {
        throw new Error('Cannot open a room without a signed-in user.');
      }

      return createNextRoom(userId, look);
    },
    onSuccess: (currentRoom, look) => {
      const queryKey = getCurrentRoomQueryKey(userId);
      queryClient.setQueryData(queryKey, currentRoom);
      void queryClient.invalidateQueries({
        queryKey: getRoomsQueryKey(userId),
        exact: true,
      });

      // Opening floor n+1 is the only signal that a finished room was worth
      // finishing. A user who completes a room and never starts another has
      // churned out of the loop while still looking active everywhere else.
      if (currentRoom.room == null) return;
      const analyticsUserId = userId;
      if (analyticsUserId == null) return;
      const properties = {
        floor: currentRoom.room.floor,
        shell: look.shell,
        frameHue: look.frameHue,
      };

      void resolveUserIsPro(queryClient, analyticsUserId).then((isPro) => {
        if (useAuthStore.getState().user?.id !== analyticsUserId) return;
        trackRoomStarted({ isPro, ...properties });
      });
    },
  });
}
