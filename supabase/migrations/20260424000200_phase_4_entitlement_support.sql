-- Phase 4: expose a Pro-entitlement read for authenticated clients and prevent
-- RevenueCat app_user_id collisions across Supabase users.

create unique index if not exists subscriptions_revenuecat_app_user_id_key
  on public.subscriptions (revenuecat_app_user_id);

create or replace view public.user_entitlement_v
with (security_invoker = true) as
select
  s.user_id,
  s.entitlement,
  s.status,
  s.product_id,
  s.store,
  s.current_period_ends_at,
  s.trial_ends_at,
  s.will_renew,
  (
    s.status in ('active', 'trialing', 'in_grace_period')
    and (s.current_period_ends_at is null or s.current_period_ends_at > now())
  ) as is_pro
from public.subscriptions s
where s.user_id = auth.uid();

comment on view public.user_entitlement_v is
  'Authenticated client read of the caller''s Pro entitlement state. is_pro is true when the subscription status is active/trialing/in_grace_period and the current period has not elapsed. Used by Phase 5 freemium gates.';

grant select on public.user_entitlement_v to authenticated;
