import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  getHeartRateStats,
} from '../../services/tracking/heartRateStatsService';
import { formatLocalDate } from '../../lib/calendar/weekCalendarDays';

export function getHeartRateStatsQueryKey(userId: string | null) {
  return ['heart-rate-stats', userId] as const;
}

/**
 * Heart-tab scoped stats. Kept separate from the Home stats query so the new
 * tab has a focused payload and an independent cache key — mutations that
 * produce a new HR capture invalidate this key alongside the home-stats one.
 *
 * The today-localDate is part of the source-picker (`pickHrSource`) so we
 * include `formatLocalDate(new Date())` as the queryFn argument; React Query
 * caches by the user-bucketed key, the captured date is just a freshness
 * signal resolved at call time.
 */
export function useHeartRateStatsQuery(userId: string | null) {
  return useQuery({
    queryKey: getHeartRateStatsQueryKey(userId),
    enabled: userId != null,
    queryFn: () =>
      getHeartRateStats(userId as string, formatLocalDate(new Date())),
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });
}
