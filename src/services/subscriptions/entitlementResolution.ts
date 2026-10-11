import type { CustomerInfo } from 'react-native-purchases';
import { getRevenueCatTrialEndsAt } from './entitlementTrial';

export const PRO_ENTITLEMENT = 'Azora  Pro';

export interface UserEntitlement {
  entitlement: string;
  status: string;
  productId: string | null;
  store: string | null;
  currentPeriodEndsAt: string | null;
  trialEndsAt: string | null;
  willRenew: boolean | null;
  isPro: boolean;
  initialOfferingId?: string | null;
  experimentId?: string | null;
  experimentVariant?: string | null;
}

export function mapRevenueCatProEntitlement(
  customerInfo: Pick<CustomerInfo, 'entitlements'>,
): UserEntitlement | null {
  const entitlement = customerInfo.entitlements.active[PRO_ENTITLEMENT];
  if (entitlement?.isActive !== true) return null;

  // The SDK accounts for grace periods and offline access; the device clock does not.
  return {
    entitlement: PRO_ENTITLEMENT,
    status: 'active',
    productId: entitlement.productIdentifier ?? null,
    store: entitlement.store ?? null,
    currentPeriodEndsAt: entitlement.expirationDate ?? null,
    trialEndsAt: getRevenueCatTrialEndsAt(entitlement),
    willRenew: entitlement.willRenew ?? null,
    isPro: true,
    initialOfferingId: null,
    experimentId: null,
    experimentVariant: null,
  };
}

export function resolveUserEntitlement(
  supabaseRow: UserEntitlement | null,
  revenueCatRow: UserEntitlement | null,
): UserEntitlement | null {
  if (revenueCatRow?.isPro === true) {
    return {
      ...revenueCatRow,
      initialOfferingId: supabaseRow?.initialOfferingId ?? revenueCatRow.initialOfferingId,
      experimentId: supabaseRow?.experimentId ?? revenueCatRow.experimentId,
      experimentVariant: supabaseRow?.experimentVariant ?? revenueCatRow.experimentVariant,
    };
  }

  return supabaseRow;
}
