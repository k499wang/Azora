import { useQuery } from '@tanstack/react-query';
import { getUserEntitlement } from '../../services/subscriptions/entitlementService';

export function getUserEntitlementQueryKey(userId: string | null) {
  return ['user-entitlement', userId] as const;
}

export function useUserEntitlementQuery(userId: string | null) {
  return useQuery({
    queryKey: getUserEntitlementQueryKey(userId),
    enabled: userId != null,
    queryFn: getUserEntitlement,
    staleTime: 1000 * 60 * 5,
  });
}
