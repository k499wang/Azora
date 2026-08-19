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

export function useDailyActivityRangeQuery(userId: string | null, days: number) {
  return useQuery({
    queryKey: getDailyActivityRangeQueryKey(userId, days),
    enabled: userId != null,
    queryFn: () => getDailyActivityRange(userId as string, days),
    staleTime: 1000 * 60 * 5,
  });
}
