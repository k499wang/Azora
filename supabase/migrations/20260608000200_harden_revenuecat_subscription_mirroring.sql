-- RevenueCat can send billing/audit events such as INVOICE_ISSUANCE before or
-- around lifecycle events. Those events should be logged, but must not become
-- the app-facing subscription state.

alter table public.subscriptions
  alter column entitlement set default 'Azora  Pro';

update public.subscriptions
set entitlement = 'Azora  Pro'
where entitlement = 'pro';

update public.subscriptions
set
  status = 'expired',
  will_renew = false,
  current_period_ends_at = coalesce(current_period_ends_at, now())
where status = 'in_grace_period';

with latest_lifecycle_event as (
  select distinct on (e.user_id)
    e.user_id,
    e.event_id,
    e.event_type,
    e.payload->'event' as event_payload,
    e.received_at
  from public.revenuecat_events e
  where e.user_id is not null
    and e.event_type in (
      'INITIAL_PURCHASE',
      'RENEWAL',
      'CANCELLATION',
      'UNCANCELLATION',
      'NON_RENEWING_PURCHASE',
      'EXPIRATION',
      'BILLING_ISSUE',
      'PRODUCT_CHANGE'
    )
  order by
    e.user_id,
    (e.payload->'event'->>'event_timestamp_ms')::bigint desc nulls last,
    e.received_at desc
)
update public.subscriptions s
set
  entitlement = coalesce(
    latest_lifecycle_event.event_payload->'entitlement_ids'->>0,
    'Azora  Pro'
  ),
  status = case latest_lifecycle_event.event_type
    when 'INITIAL_PURCHASE' then
      case
        when latest_lifecycle_event.event_payload->>'period_type' = 'TRIAL'
          then 'trialing'
        else 'active'
      end
    when 'RENEWAL' then
      case
        when latest_lifecycle_event.event_payload->>'period_type' = 'TRIAL'
          then 'trialing'
        else 'active'
      end
    when 'UNCANCELLATION' then
      case
        when latest_lifecycle_event.event_payload->>'period_type' = 'TRIAL'
          then 'trialing'
        else 'active'
      end
    when 'PRODUCT_CHANGE' then
      case
        when latest_lifecycle_event.event_payload->>'period_type' = 'TRIAL'
          then 'trialing'
        else 'active'
      end
    when 'NON_RENEWING_PURCHASE' then 'active'
    when 'CANCELLATION' then 'active'
    when 'BILLING_ISSUE' then 'expired'
    when 'EXPIRATION' then 'expired'
    else s.status
  end,
  product_id = latest_lifecycle_event.event_payload->>'product_id',
  store = latest_lifecycle_event.event_payload->>'store',
  current_period_ends_at = case
    when latest_lifecycle_event.event_payload->>'expiration_at_ms' is not null
      then to_timestamp(
        (latest_lifecycle_event.event_payload->>'expiration_at_ms')::double precision / 1000.0
      )
    when latest_lifecycle_event.event_type = 'CANCELLATION'
      then coalesce(s.current_period_ends_at, now())
    when latest_lifecycle_event.event_type = 'EXPIRATION'
      then now()
    else null
  end,
  will_renew = case latest_lifecycle_event.event_type
    when 'INITIAL_PURCHASE' then true
    when 'RENEWAL' then true
    when 'UNCANCELLATION' then true
    when 'PRODUCT_CHANGE' then true
    when 'NON_RENEWING_PURCHASE' then false
    when 'CANCELLATION' then false
    when 'BILLING_ISSUE' then false
    when 'EXPIRATION' then false
    else s.will_renew
  end,
  trial_ends_at = case
    when latest_lifecycle_event.event_payload->>'period_type' = 'TRIAL'
      and latest_lifecycle_event.event_payload->>'expiration_at_ms' is not null
      then to_timestamp(
        (latest_lifecycle_event.event_payload->>'expiration_at_ms')::double precision / 1000.0
      )
    else null
  end,
  last_revenuecat_event_id = latest_lifecycle_event.event_id,
  last_revenuecat_event_type = latest_lifecycle_event.event_type,
  last_revenuecat_event_timestamp_ms =
    (latest_lifecycle_event.event_payload->>'event_timestamp_ms')::bigint,
  last_revenuecat_event_received_at = latest_lifecycle_event.received_at,
  last_revenuecat_transaction_id =
    latest_lifecycle_event.event_payload->>'transaction_id',
  last_revenuecat_original_transaction_id =
    latest_lifecycle_event.event_payload->>'original_transaction_id'
from latest_lifecycle_event
where s.user_id = latest_lifecycle_event.user_id
  and s.status = 'unknown'
  and s.last_revenuecat_event_type = 'INVOICE_ISSUANCE';

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
    s.status in ('active', 'trialing')
    and (s.current_period_ends_at is null or s.current_period_ends_at > now())
  ) as is_pro
from public.subscriptions s
where s.user_id = auth.uid();

comment on view public.user_entitlement_v is
  'Authenticated client read of the caller''s Pro entitlement state plus pricing-experiment attribution. is_pro is true when status is active/trialing and the current period has not elapsed. initial_offering_id / experiment_id / experiment_variant are set once at initial purchase.';

grant select on public.user_entitlement_v to authenticated;
