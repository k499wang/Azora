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
  void supabase;

  throw new Error(
    'getUserEntitlement is scaffolded but not wired yet. Read from `user_entitlement_v`.',
  );
}
