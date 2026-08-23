import { useQuery, type QueryClient } from '@tanstack/react-query';
import { getUserEntitlement } from '../../services/subscriptions/entitlementService';
import { useAuthStore } from '../../stores/authStore';

const ENTITLEMENT_STALE_TIME_MS = 1000 * 60 * 5;

export function getUserEntitlementQueryKey(userId: string | null) {
  return ['user-entitlement', userId] as const;
}

function getUserEntitlementQueryOptions(userId: string | null) {
  return {
    queryKey: getUserEntitlementQueryKey(userId),
    queryFn: () => {
      if (userId == null) {
        throw new Error('Cannot load entitlement without a signed-in user.');
      }
      return getUserEntitlement(userId);
    },
    staleTime: ENTITLEMENT_STALE_TIME_MS,
  };
}

export function useUserEntitlementQuery(userId: string | null) {
  return useQuery({
    ...getUserEntitlementQueryOptions(userId),
    enabled: userId != null,
  });
}

/** Resolve analytics entitlement from the canonical shared query cache. */
export async function resolveUserIsPro(
  queryClient: QueryClient,
  userId: string | null,
): Promise<boolean | null> {
  if (userId == null) return null;
  if (useAuthStore.getState().user?.id !== userId) return null;

  try {
    const entitlement = await queryClient.fetchQuery(
      getUserEntitlementQueryOptions(userId),
    );
    if (useAuthStore.getState().user?.id !== userId) return null;
    return entitlement?.isPro === true;
  } catch {
    return null;
  }
}
