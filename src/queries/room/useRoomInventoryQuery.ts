import { useQuery } from '@tanstack/react-query';
import { getRoomInventory } from '../../services/room/roomInventoryService';

export function getRoomInventoryQueryKey(userId: string | null) {
  return ['room-inventory', userId] as const;
}

export function useRoomInventoryQuery(userId: string | null) {
  return useQuery({
    queryKey: getRoomInventoryQueryKey(userId),
    enabled: userId != null,
    queryFn: () => getRoomInventory(userId as string),
    staleTime: 1000 * 60 * 5,
  });
}
