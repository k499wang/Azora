import { useMemo } from 'react';
import {
  FeatureKey,
  getFeatureAccess,
  getLocalDate,
  type FeatureAccessResult,
  type FeatureKeyValue,
} from '../services/subscriptions/featureAccess';
import { useAuthStore } from '../stores/authStore';
import { useUserEntitlementQuery } from '../queries/subscriptions/useUserEntitlementQuery';
import { useDailyFeatureUsageQuery } from '../queries/subscriptions/useDailyFeatureUsageQuery';
import { useLifetimeFeatureUsageQuery } from '../queries/subscriptions/useLifetimeFeatureUsageQuery';
import { useActiveSelfCareGoalsQuery } from '../queries/selfCare/useActiveSelfCareGoalsQuery';
import { logDevDiagnostic } from '../services/debug/devLogger';

export type FeatureAccessState = FeatureAccessResult & { isLoading: boolean };

export function useFeatureAccess(feature: FeatureKeyValue): FeatureAccessState {
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? null;
  const entitlementQuery = useUserEntitlementQuery(userId);
  const isPro = entitlementQuery.data?.isPro === true;
  const needsUsage = feature === FeatureKey.DailyExercise;
  const usageQuery = useDailyFeatureUsageQuery(needsUsage ? userId : null);
  const needsLifetimeUsage =
    feature === FeatureKey.PhotoCleanup && !entitlementQuery.isPending && !isPro;
  const lifetimeUsageQuery = useLifetimeFeatureUsageQuery(
    needsLifetimeUsage ? userId : null,
  );
  const needsActiveCount =
    feature === FeatureKey.RoutineTodos && !entitlementQuery.isPending && !isPro;
  const activeTodosQuery = useActiveSelfCareGoalsQuery(
    needsActiveCount ? userId : null,
    getLocalDate(),
  );
  const activeCount = activeTodosQuery.data?.length ?? null;

  const access = useMemo(
    () => getFeatureAccess({
      feature,
      isPro,
      usage: usageQuery.data ?? null,
      lifetimeUsage: lifetimeUsageQuery.data ?? null,
      activeCount,
    }),
    [feature, isPro, usageQuery.data, lifetimeUsageQuery.data, activeCount],
  );

  const result = {
    ...access,
    isLoading:
      entitlementQuery.isPending ||
      (needsUsage && usageQuery.isPending) ||
      (needsLifetimeUsage && lifetimeUsageQuery.isPending) ||
      (needsActiveCount && activeTodosQuery.isPending),
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
