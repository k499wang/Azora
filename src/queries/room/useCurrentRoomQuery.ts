import { useQuery } from '@tanstack/react-query';
import { getCurrentRoom } from '../../services/room/roomService';

export function getCurrentRoomQueryKey(userId: string | null) {
  return ['current-room', userId] as const;
}

export function useCurrentRoomQuery(userId: string | null) {
  return useQuery({
    queryKey: getCurrentRoomQueryKey(userId),
    enabled: userId != null,
    queryFn: () => getCurrentRoom(userId as string),
    staleTime: 1000 * 60 * 5,
  });
}
