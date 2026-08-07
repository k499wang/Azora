import { useMutation, useQueryClient } from '@tanstack/react-query';
import { placeDecoration } from '../../services/room/roomService';
import { getCurrentRoomQueryKey } from './useCurrentRoomQuery';

interface PlaceDecorationInput {
  slot: string;
  optionId: string;
}

export function usePlaceDecorationMutation(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slot, optionId }: PlaceDecorationInput) => {
      if (userId == null) {
        throw new Error('Cannot place a decoration without a signed-in user.');
      }

      return placeDecoration(userId, slot, optionId);
    },
    onSuccess: async (room) => {
      const queryKey = getCurrentRoomQueryKey(userId);
      queryClient.setQueryData(queryKey, room);
      await queryClient.invalidateQueries({ queryKey, exact: true });
    },
  });
}
