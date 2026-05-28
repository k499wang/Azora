import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getHomeStats } from '../../services/tracking/homeStatsService';

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
  return useQuery({
    queryKey: getHomeStatsQueryKey(userId, localDate),
    enabled: userId != null,
    queryFn: () => getHomeStats(userId as string, localDate),
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });
}
