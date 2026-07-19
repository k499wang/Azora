import { useQuery } from '@tanstack/react-query';
import { logDevDiagnostic } from '../../services/debug/devLogger';
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
    queryFn: async () => {
      logDevDiagnostic(
        '[hr-gate] useDailyFeatureUsageQuery: fetching from supabase',
        { localDate },
      );
      const data = await getDailyFeatureUsage(userId as string, localDate);
      logDevDiagnostic('[hr-gate] useDailyFeatureUsageQuery: succeeded');
      return data;
    },
    staleTime: 1000 * 60,
  });
}
