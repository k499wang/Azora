-- Phase 4 analytics: capture which offering and experiment arm a user first
-- subscribed under, so revenue, retention, and churn can be segmented by
-- pricing test variant. See
-- docs/analytics/paywall-pricing-experiments-playbook.md.
--
-- Set once on INITIAL_PURCHASE. Preserved across RENEWAL, PRODUCT_CHANGE,
-- CANCELLATION, and EXPIRATION events. The webhook must not overwrite these
-- on non-INITIAL_PURCHASE events.

alter table public.subscriptions
  add column if not exists initial_offering_id text,
  add column if not exists experiment_id text,
  add column if not exists experiment_variant text;

comment on column public.subscriptions.initial_offering_id is
  'RevenueCat offering identifier presented at the initial purchase. Set once on INITIAL_PURCHASE and preserved. Used as the canonical price-arm attribution key.';
comment on column public.subscriptions.experiment_id is
  'RevenueCat experiment id the user converted within, if any. Set once on INITIAL_PURCHASE.';
comment on column public.subscriptions.experiment_variant is
  'RevenueCat experiment variant name (e.g. control, treatment_a). Set once on INITIAL_PURCHASE.';

create index if not exists subscriptions_initial_offering_id_idx
  on public.subscriptions (initial_offering_id);

create index if not exists subscriptions_experiment_idx
  on public.subscriptions (experiment_id, experiment_variant);

-- Rebuild user_entitlement_v to expose the new attribution fields.

drop view if exists public.user_entitlement_v;

create view public.user_entitlement_v
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
  s.initial_offering_id,
  s.experiment_id,
  s.experiment_variant,
  (
    s.status in ('active', 'trialing', 'in_grace_period')
    and (s.current_period_ends_at is null or s.current_period_ends_at > now())
  ) as is_pro
from public.subscriptions s
where s.user_id = auth.uid();

comment on view public.user_entitlement_v is
  'Authenticated client read of the caller''s Pro entitlement state plus pricing-experiment attribution. is_pro is true when status is active/trialing/in_grace_period and the current period has not elapsed. initial_offering_id / experiment_id / experiment_variant are set once at initial purchase.';

grant select on public.user_entitlement_v to authenticated;
