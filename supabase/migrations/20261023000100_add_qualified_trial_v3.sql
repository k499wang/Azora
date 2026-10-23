-- Add a two-hour signal limited to the full-price $59.99 yearly trial.
-- The $39.99 offer and the exit offer both sell azora_pro_yearly_3999, so a product
-- match excludes both. Existing queue rows are unchanged; only future INSERTs enqueue V3.
alter table public.qualified_trial_events
  drop constraint qualified_trial_events_event_name_check;
alter table public.qualified_trial_events
  add constraint qualified_trial_events_event_name_check
  check (event_name in ('qualified_trial', 'qualified_trial_v2', 'qualified_trial_v3'));

create or replace function public.enqueue_qualified_trial_event()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  event jsonb := new.payload->'event';
  purchased_ms numeric;
  expiration_ms numeric;

begin
  if new.event_type <> 'INITIAL_PURCHASE'
    or new.environment is distinct from 'PRODUCTION'
    or event->>'environment' is distinct from 'PRODUCTION'
    or event->>'period_type' is distinct from 'TRIAL'
    or coalesce(event->>'store', '') not in ('APP_STORE', 'PLAY_STORE')
    or nullif(btrim(event->>'original_transaction_id'), '') is null
    or nullif(btrim(event->>'app_id'), '') is null
    or nullif(btrim(event->>'app_user_id'), '') is null
    or nullif(btrim(event->>'product_id'), '') is null
    or jsonb_typeof(event->'purchased_at_ms') is distinct from 'number'
    or jsonb_typeof(event->'expiration_at_ms') is distinct from 'number'
  then return new; end if;

  purchased_ms := (event->>'purchased_at_ms')::numeric;
  expiration_ms := (event->>'expiration_at_ms')::numeric;
  if purchased_ms <= 0 or purchased_ms > 253402300199999
    or purchased_ms <> trunc(purchased_ms)
    or expiration_ms <= purchased_ms + 600000
    or expiration_ms > 253402300799999
    or expiration_ms <> trunc(expiration_ms)
  then return new; end if;

  insert into public.qualified_trial_events (
    source_event_id, revenuecat_app_id, store, environment,
    original_transaction_id, app_user_id, product_id, event_name, due_at, next_attempt_at
  )
  select new.event_id, event->>'app_id', event->>'store', new.environment,
    event->>'original_transaction_id', event->>'app_user_id', event->>'product_id',
    version.event_name, to_timestamp((purchased_ms / 1000)::double precision) + version.delay,
    to_timestamp((purchased_ms / 1000)::double precision) + version.delay
  from (values
    ('qualified_trial', interval '10 minutes', 600000::numeric, null::text),
    ('qualified_trial_v2', interval '2 hours', 7200000::numeric, null::text),
    ('qualified_trial_v3', interval '2 hours', 7200000::numeric, 'azora_pro_yearly_5999_v2')
  ) as version(event_name, delay, delay_ms, product_id)
  where expiration_ms > purchased_ms + version.delay_ms
    and (version.product_id is null or version.product_id = event->>'product_id')
  on conflict (revenuecat_app_id, store, environment, original_transaction_id, event_name) do nothing;
  return new;
exception when others then
  -- Optional marketing work must not roll back the audit INSERT and prevent
  -- the existing RevenueCat webhook from updating paid access.
  raise warning 'Qualified trial enqueue failed (SQLSTATE %); RevenueCat event retained', sqlstate;
  return new;
end;
$$;
