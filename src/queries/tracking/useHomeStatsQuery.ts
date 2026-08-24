import { useQuery } from '@tanstack/react-query';
import {
  getHomeStats,
  type HomeStats,
} from '../../services/tracking/homeStatsService';
import { mergeHomeStatsPartialResult } from './homeStatsStructuralSharing';

export function getHomeStatsQueryKey(
  userId: string | null,
  localDate?: string | null,
) {
  return localDate == null
    ? getHomeStatsQueryKeyPrefix(userId)
    : ['home-stats', userId, localDate] as const;
}

export function getHomeStatsQueryKeyPrefix(userId: string | null) {
  return ['home-stats', userId] as const;
}

export function useHomeStatsQuery(userId: string | null, localDate: string) {
  return useQuery<HomeStats>({
    queryKey: getHomeStatsQueryKey(userId, localDate),
    enabled: userId != null,
    queryFn: () => getHomeStats(userId as string, localDate),
    staleTime: 1000 * 60 * 5,
    structuralSharing: (previous, incoming) =>
      mergeHomeStatsPartialResult(
        previous as HomeStats | undefined,
        incoming as HomeStats,
      ),
  });
}
