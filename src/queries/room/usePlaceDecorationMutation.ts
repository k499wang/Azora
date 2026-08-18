import { useMutation, useQueryClient } from '@tanstack/react-query';
import { placeDecoration } from '../../services/room/roomService';
import { getCurrentRoomQueryKey } from './useCurrentRoomQuery';
import { getRoomsQueryKey } from './useRoomsQuery';
import type { RoomSlot } from '../../lib/room/roomProgress';

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
    onSuccess: (currentRoom) => {
      const queryKey = getCurrentRoomQueryKey(userId);
      queryClient.setQueryData(queryKey, currentRoom);
      void queryClient.invalidateQueries({
        queryKey: getRoomsQueryKey(userId),
        exact: true,
      });
    },
  });
}
