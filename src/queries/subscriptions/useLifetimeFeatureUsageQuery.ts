import { useQuery } from '@tanstack/react-query';
import { getLifetimeFeatureUsage } from '../../services/subscriptions/featureAccess';

export function getLifetimeFeatureUsageQueryKey(userId: string | null) {
  return ['lifetime-feature-usage', userId] as const;
}

export function useLifetimeFeatureUsageQuery(userId: string | null) {
  return useQuery({
    queryKey: getLifetimeFeatureUsageQueryKey(userId),
    enabled: userId != null,
    queryFn: () => getLifetimeFeatureUsage(userId as string),
    staleTime: 1000 * 60,
  });
}
