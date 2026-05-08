import { useMemo } from 'react';
import {
  FeatureKey,
  getFeatureAccess,
  type FeatureAccessResult,
  type FeatureKeyValue,
} from '../services/subscriptions/featureAccess';
import { useAuthStore } from '../stores/authStore';
import { useUserEntitlementQuery } from '../queries/subscriptions/useUserEntitlementQuery';
import { useDailyFeatureUsageQuery } from '../queries/subscriptions/useDailyFeatureUsageQuery';

export function useFeatureAccess(feature: FeatureKeyValue): FeatureAccessResult & {
  isLoading: boolean;
} {
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? null;
  const entitlementQuery = useUserEntitlementQuery(userId);
  const usageQuery = useDailyFeatureUsageQuery(userId);
  const isPro = entitlementQuery.data?.isPro === true;
  const needsUsage =
    feature === FeatureKey.HeartRateMeasurement ||
    feature === FeatureKey.DailyExercise;

  const access = useMemo(
    () => getFeatureAccess({
      feature,
      isPro,
      usage: usageQuery.data ?? null,
    }),
    [feature, isPro, usageQuery.data],
  );

  const result = {
    ...access,
    isLoading:
      entitlementQuery.isPending ||
      (needsUsage && usageQuery.isPending),
  };

  console.log('[hr-gate] useFeatureAccess', {
    feature,
    userId,
    isPro,
    entitlementStatus: {
      isPending: entitlementQuery.isPending,
      isFetching: entitlementQuery.isFetching,
      data: entitlementQuery.data,
    },
    usageStatus: {
      isPending: usageQuery.isPending,
      isFetching: usageQuery.isFetching,
      data: usageQuery.data,
    },
    decision: result,
  });

  return result;
}
