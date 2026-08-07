import { useQuery } from '@tanstack/react-query';
import { getRooms } from '../../services/room/roomService';

export function getRoomsQueryKey(userId: string | null) {
  return ['rooms', userId] as const;
}

/** Every floor of the hotel. The current room is the last entry. */
export function useRoomsQuery(userId: string | null) {
  return useQuery({
    queryKey: getRoomsQueryKey(userId),
    enabled: userId != null,
    queryFn: () => getRooms(userId as string),
    staleTime: 1000 * 60 * 5,
  });
}
