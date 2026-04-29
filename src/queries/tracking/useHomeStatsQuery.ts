import { useQuery } from '@tanstack/react-query';
import { getHomeStats } from '../../services/tracking/homeStatsService';

export function getHomeStatsQueryKey(userId: string | null) {
  return ['home-stats', userId] as const;
}

export function useHomeStatsQuery(userId: string | null) {
  return useQuery({
    queryKey: getHomeStatsQueryKey(userId),
    enabled: userId != null,
    queryFn: () => getHomeStats(userId as string),
    staleTime: 1000 * 60 * 5,
  });
}
