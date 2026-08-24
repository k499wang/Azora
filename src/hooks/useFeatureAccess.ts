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
import { logDevDiagnostic } from '../services/debug/devLogger';

export type FeatureAccessState = FeatureAccessResult & { isLoading: boolean };

export function useFeatureAccess(feature: FeatureKeyValue): FeatureAccessState {
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? null;
  const entitlementQuery = useUserEntitlementQuery(userId);
  const isPro = entitlementQuery.data?.isPro === true;
  const needsUsage =
    feature === FeatureKey.HeartRateMeasurement ||
    feature === FeatureKey.DailyExercise;
  const usageQuery = useDailyFeatureUsageQuery(needsUsage ? userId : null);

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

  logDevDiagnostic('[hr-gate] useFeatureAccess', {
    feature,
    isPro,
    entitlementStatus: {
      isPending: entitlementQuery.isPending,
      isFetching: entitlementQuery.isFetching,
    },
    usageStatus: {
      isPending: usageQuery.isPending,
      isFetching: usageQuery.isFetching,
    },
    decision: result,
  });

  return result;
}
