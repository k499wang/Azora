import { requireSupabaseClient } from '../supabase';

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
  const { data, error } = await supabase
    .from('user_entitlement_v')
    .select(
      'entitlement,status,product_id,store,current_period_ends_at,trial_ends_at,will_renew,is_pro,initial_offering_id,experiment_id,experiment_variant',
    )
    .maybeSingle();

  if (error != null) {
    throw error;
  }

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
