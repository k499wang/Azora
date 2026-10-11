import type { QueryClient } from '@tanstack/react-query';
import type { CustomerInfo } from 'react-native-purchases';
import {
  mapRevenueCatProEntitlement,
  resolveUserEntitlement,
  type UserEntitlement,
} from '../../services/subscriptions/entitlementResolution';

export function getUserEntitlementQueryKey(userId: string | null) {
  return ['user-entitlement', userId] as const;
}

/** Publish confirmed access before closing the paywall or rendering a boot gate. */
export async function publishRevenueCatEntitlement(
  queryClient: QueryClient,
  userId: string,
  customerInfo: CustomerInfo,
  isCurrentUser: () => boolean,
): Promise<boolean> {
  const entitlement = mapRevenueCatProEntitlement(customerInfo);
  if (entitlement == null || !isCurrentUser()) return false;

  const queryKey = getUserEntitlementQueryKey(userId);
  // A pre-purchase read must not overwrite the store's confirmed result.
  await queryClient.cancelQueries({ queryKey, exact: true }, { revert: false });
  if (!isCurrentUser()) return false;
  queryClient.setQueryData<UserEntitlement | null>(queryKey, (previous) =>
    resolveUserEntitlement(previous ?? null, entitlement),
  );
  return true;
}
