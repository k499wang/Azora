import { useQuery } from '@tanstack/react-query';
import {
  getDailyFeatureUsage,
  getLocalDate,
} from '../../services/subscriptions/featureAccess';

export function getDailyFeatureUsageQueryKey(
  userId: string | null,
  localDate: string,
) {
  return ['daily-feature-usage', userId, localDate] as const;
}

export function useDailyFeatureUsageQuery(userId: string | null) {
  const localDate = getLocalDate();

  return useQuery({
    queryKey: getDailyFeatureUsageQueryKey(userId, localDate),
    enabled: userId != null,
    queryFn: () => getDailyFeatureUsage(userId as string, localDate),
    staleTime: 1000 * 60,
  });
}
