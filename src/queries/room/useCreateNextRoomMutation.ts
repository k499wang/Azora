import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createNextRoom, type RoomLook } from '../../services/room/roomService';
import { getCurrentRoomQueryKey } from './useCurrentRoomQuery';
import { getRoomsQueryKey } from './useRoomsQuery';

export function useCreateNextRoomMutation(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (look: RoomLook) => {
      if (userId == null) {
        throw new Error('Cannot open a room without a signed-in user.');
      }

      return createNextRoom(userId, look);
    },
    onSuccess: async (currentRoom) => {
      const queryKey = getCurrentRoomQueryKey(userId);
      queryClient.setQueryData(queryKey, currentRoom);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey, exact: true }),
        queryClient.invalidateQueries({
          queryKey: getRoomsQueryKey(userId),
          exact: true,
        }),
      ]);
    },
  });
}
