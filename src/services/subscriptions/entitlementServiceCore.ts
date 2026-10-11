import type { CustomerInfo } from 'react-native-purchases';
import {
  mapRevenueCatProEntitlement,
  resolveUserEntitlement,
  type UserEntitlement,
} from './entitlementResolution';

export interface EntitlementLookupDependencies {
  getMirrorEntitlement: () => Promise<UserEntitlement | null>;
  getAuthenticatedUserId: () => Promise<string | null>;
  getCurrentAuthUserId: () => string | null;
  getCurrentRevenueCatAppUserId: () => string | null;
  refreshRevenueCatCustomerInfo: () => Promise<Pick<CustomerInfo, 'entitlements'> | null>;
}

export async function lookupUserEntitlement(
  expectedUserId: string,
  dependencies: EntitlementLookupDependencies,
): Promise<UserEntitlement | null> {
  const assertCurrentUser = () => {
    if (dependencies.getCurrentAuthUserId() !== expectedUserId) {
      throw new Error('Authenticated user changed during entitlement lookup.');
    }
  };

  assertCurrentUser();
  const [mirrorResult, authResult, revenueCatResult] = await Promise.allSettled([
    dependencies.getMirrorEntitlement(),
    dependencies.getAuthenticatedUserId(),
    dependencies.refreshRevenueCatCustomerInfo(),
  ]);

  assertCurrentUser();
  if (authResult.status === 'rejected') throw authResult.reason;
  if (authResult.value !== expectedUserId) {
    throw new Error('Authenticated user changed during entitlement lookup.');
  }

  const customerInfo = revenueCatResult.status === 'fulfilled' ? revenueCatResult.value : null;
  if (customerInfo != null && dependencies.getCurrentRevenueCatAppUserId() !== expectedUserId) {
    throw new Error('RevenueCat user changed during entitlement lookup.');
  }
  const revenueCatRow = customerInfo == null ? null : mapRevenueCatProEntitlement(customerInfo);
  if (mirrorResult.status === 'rejected' && revenueCatRow == null) {
    throw mirrorResult.reason;
  }

  const result = resolveUserEntitlement(
    mirrorResult.status === 'fulfilled' ? mirrorResult.value : null,
    revenueCatRow,
  );
  assertCurrentUser();
  return result;
}
