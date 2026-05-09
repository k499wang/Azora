import { requireSupabaseClient } from '../supabase';
import {
  getCurrentRevenueCatAppUserId,
  getRevenueCatCustomerInfo,
  hasCurrentRevenueCatIdentity,
  isRevenueCatReady,
} from './revenueCatClient';

const PRO_ENTITLEMENT = 'Azora  Pro';

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

export async function getUserEntitlement(): Promise<UserEntitlement | null> {
  const supabase = requireSupabaseClient();
  const [{ data, error }, authResult] = await Promise.all([
    supabase
      .from('user_entitlement_v')
      .select(
        'entitlement,status,product_id,store,current_period_ends_at,trial_ends_at,will_renew,is_pro,initial_offering_id,experiment_id,experiment_variant',
      )
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);

  if (error != null) {
    throw error;
  }

  const supabaseRow = mapEntitlementRow(data);
  if (supabaseRow != null && supabaseRow.isPro) {
    return supabaseRow;
  }

  const authUserId = authResult.data.user?.id ?? null;
  const revenueCatProEntitlement = await getActiveRevenueCatProEntitlement(authUserId);
  if (revenueCatProEntitlement != null) {
    return revenueCatProEntitlement;
  }

  return supabaseRow;
}

function mapEntitlementRow(
  data:
    | {
        entitlement: string | null;
        status: string | null;
        product_id: string | null;
        store: string | null;
        current_period_ends_at: string | null;
        trial_ends_at: string | null;
        will_renew: boolean | null;
        is_pro: boolean | null;
        initial_offering_id?: string | null;
        experiment_id?: string | null;
        experiment_variant?: string | null;
      }
    | null,
): UserEntitlement | null {
  if (data == null || data.entitlement == null || data.status == null) {
    return null;
  }

  return {
    entitlement: data.entitlement,
    status: data.status,
    productId: data.product_id,
    store: data.store,
    currentPeriodEndsAt: data.current_period_ends_at,
    trialEndsAt: data.trial_ends_at,
    willRenew: data.will_renew,
    isPro: data.is_pro === true,
    initialOfferingId: data.initial_offering_id,
    experimentId: data.experiment_id,
    experimentVariant: data.experiment_variant,
  };
}

async function getActiveRevenueCatProEntitlement(
  authUserId: string | null,
): Promise<UserEntitlement | null> {
  if (authUserId == null) return null;
  if (!isRevenueCatReady() || !hasCurrentRevenueCatIdentity()) return null;
  if (getCurrentRevenueCatAppUserId() !== authUserId) return null;

  let customerInfo;
  try {
    customerInfo = await getRevenueCatCustomerInfo();
  } catch {
    return null;
  }

  const entitlement = customerInfo.entitlements.active[PRO_ENTITLEMENT];
  if (entitlement == null || entitlement.isActive !== true) {
    return null;
  }

  if (isExpired(entitlement.expirationDate)) {
    return null;
  }

  return {
    entitlement: PRO_ENTITLEMENT,
    status: 'active',
    productId: entitlement.productIdentifier ?? null,
    store: entitlement.store ?? null,
    currentPeriodEndsAt: entitlement.expirationDate ?? null,
    trialEndsAt: null,
    willRenew: entitlement.willRenew ?? null,
    isPro: true,
    initialOfferingId: null,
    experimentId: null,
    experimentVariant: null,
  };
}

function isExpired(expirationDate: string | null | undefined): boolean {
  if (expirationDate == null) return false;
  const expiresAt = Date.parse(expirationDate);
  if (Number.isNaN(expiresAt)) return false;
  return expiresAt <= Date.now();
}
