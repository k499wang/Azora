import { requireSupabaseClient } from '../supabase';
import { useAuthStore } from '../../stores/authStore';
import { getCurrentRevenueCatAppUserId } from './revenueCatClient';
import { refreshRevenueCatCustomerInfoForCurrentUser } from './revenueCatIdentitySync';
import { lookupUserEntitlement } from './entitlementServiceCore';
import type { UserEntitlement } from './entitlementResolution';

export type { UserEntitlement } from './entitlementResolution';

export async function getUserEntitlement(
  expectedUserId: string,
): Promise<UserEntitlement | null> {
  const supabase = requireSupabaseClient();

  return lookupUserEntitlement(expectedUserId, {
    getMirrorEntitlement: async () => {
      const { data, error } = await supabase
        .from('user_entitlement_v')
        .select(
          'entitlement,status,product_id,store,current_period_ends_at,trial_ends_at,will_renew,is_pro,initial_offering_id,experiment_id,experiment_variant',
        )
        .maybeSingle();
      if (error != null) throw error;
      return mapEntitlementRow(data);
    },
    getAuthenticatedUserId: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error != null) throw error;
      return data.user?.id ?? null;
    },
    getCurrentAuthUserId: () => useAuthStore.getState().user?.id ?? null,
    getCurrentRevenueCatAppUserId,
    refreshRevenueCatCustomerInfo: refreshRevenueCatCustomerInfoForCurrentUser,
  });
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
  if (data == null || data.entitlement == null || data.status == null) return null;

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
