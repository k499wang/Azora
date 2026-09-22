import { useQuery } from '@tanstack/react-query';
import { getDailyActivityRange } from '../../services/tracking/breathHoldService';

export function getDailyActivityRangeQueryKeyPrefix(userId: string | null) {
  return ['daily-activity-range', userId] as const;
}

export function getDailyActivityRangeQueryKey(
  userId: string | null,
  days: number,
) {
  return ['daily-activity-range', userId, days] as const;
}

export function getDailyActivityRangeQueryOptions(userId: string, days: number) {
  return {
    queryKey: getDailyActivityRangeQueryKey(userId, days),
    queryFn: () => getDailyActivityRange(userId, days),
    staleTime: 1000 * 60 * 5,
  };
}

export function useDailyActivityRangeQuery(userId: string | null, days: number) {
  return useQuery({
    ...getDailyActivityRangeQueryOptions(userId as string, days),
    enabled: userId != null,
  });
}
