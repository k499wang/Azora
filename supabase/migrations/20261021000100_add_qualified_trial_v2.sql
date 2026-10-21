-- Add a two-hour marketing signal while preserving the existing ten-minute event.
-- Existing queue rows remain V1; only future audit INSERTs enqueue both versions.
alter table public.qualified_trial_events
  add column event_name text not null default 'qualified_trial'
    check (event_name in ('qualified_trial', 'qualified_trial_v2'));

-- The original unnamed constraint has a PostgreSQL-generated, truncated name.
do $$
declare original_key text;
begin
  select c.conname into strict original_key
  from pg_constraint c
  where c.conrelid = 'public.qualified_trial_events'::regclass and c.contype = 'u'
    and c.conkey = array[
      (select attnum from pg_attribute where attrelid = c.conrelid and attname = 'revenuecat_app_id'),
      (select attnum from pg_attribute where attrelid = c.conrelid and attname = 'store'),
      (select attnum from pg_attribute where attrelid = c.conrelid and attname = 'environment'),
      (select attnum from pg_attribute where attrelid = c.conrelid and attname = 'original_transaction_id')
    ]::smallint[];
  execute format('alter table public.qualified_trial_events drop constraint %I', original_key);
end;
$$;

alter table public.qualified_trial_events
  add constraint qualified_trial_events_transaction_version_key
  unique (revenuecat_app_id, store, environment, original_transaction_id, event_name);

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
    ('qualified_trial', interval '10 minutes', 600000::numeric),
    ('qualified_trial_v2', interval '2 hours', 7200000::numeric)
  ) as version(event_name, delay, delay_ms)
  where expiration_ms > purchased_ms + version.delay_ms
  on conflict (revenuecat_app_id, store, environment, original_transaction_id, event_name) do nothing;
  return new;
exception when others then
  -- Optional marketing work must not roll back the audit INSERT and prevent
  -- the existing RevenueCat webhook from updating paid access.
  raise warning 'Qualified trial enqueue failed (SQLSTATE %); RevenueCat event retained', sqlstate;
  return new;
end;
$$;

create function public.claim_qualified_trial_events(
  p_stores text[], p_event_names text[]
)
returns table (
  id uuid, source_event_id text, store text, app_user_id text, product_id text,
  original_transaction_id text, due_at timestamptz, lease_token uuid, attempts integer, payload jsonb, event_name text
) language plpgsql security definer set search_path = '' as $$
begin
  -- An interrupted external request may already have been accepted. Never resend it automatically.
  update public.qualified_trial_events q set status = 'uncertain',
    last_error = 'Dispatch lease expired; verify AppsFlyer before any manual retry', updated_at = now()
  where q.status = 'dispatching' and q.lease_expires_at <= now();

  update public.qualified_trial_events q set status = 'suppressed',
    last_error = 'Cancellation, expiration, or billing issue recorded', updated_at = now()
  where q.status in ('pending', 'processing') and exists (
    select 1 from public.revenuecat_events e
    where e.event_type in ('CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE')
      and e.environment = q.environment
      and e.payload->'event'->>'app_id' = q.revenuecat_app_id
      and e.payload->'event'->>'store' = q.store
      and e.payload->'event'->>'original_transaction_id' = q.original_transaction_id
  );

  update public.qualified_trial_events q set status = 'failed',
    last_error = 'Pre-dispatch retry limit reached', updated_at = now()
  where q.attempts >= 5 and (q.status = 'pending'
    or (q.status = 'processing' and q.lease_expires_at <= now()));

  return query
  with candidates as (
    select q.id from public.qualified_trial_events q
    where q.due_at <= now() and q.next_attempt_at <= now() and q.attempts < 5
      and q.store = any(p_stores)
      and q.event_name = any(p_event_names)
      and (q.status = 'pending' or (q.status = 'processing' and q.lease_expires_at <= now()))
    order by q.next_attempt_at, q.id
    limit 5 for update skip locked
  ), claimed as (
    update public.qualified_trial_events q set status = 'processing',
      attempts = q.attempts + 1, lease_token = gen_random_uuid(),
      lease_expires_at = now() + interval '2 minutes', updated_at = now()
    from candidates c where q.id = c.id returning q.*
  )
  select q.id, q.source_event_id, q.store, q.app_user_id, q.product_id,
    q.original_transaction_id, q.due_at, q.lease_token, q.attempts, e.payload, q.event_name
  from claimed q join public.revenuecat_events e on e.event_id = q.source_event_id;
end;
$$;

-- Older deployed workers must never claim V2 and label it as the ten-minute event.
create or replace function public.claim_qualified_trial_events(
  p_stores text[] default array['APP_STORE', 'PLAY_STORE']::text[]
)
returns table (
  id uuid, source_event_id text, store text, app_user_id text, product_id text,
  original_transaction_id text, due_at timestamptz, lease_token uuid, attempts integer, payload jsonb
) language sql security definer set search_path = '' as $$
  select q.id, q.source_event_id, q.store, q.app_user_id, q.product_id,
    q.original_transaction_id, q.due_at, q.lease_token, q.attempts, q.payload
  from public.claim_qualified_trial_events(p_stores, array['qualified_trial']::text[]) q;
$$;

revoke all on function public.claim_qualified_trial_events(text[], text[]) from public, anon, authenticated;
revoke all on function public.claim_qualified_trial_events(text[]) from public, anon, authenticated;
grant execute on function public.claim_qualified_trial_events(text[], text[]) to service_role;
grant execute on function public.claim_qualified_trial_events(text[]) to service_role;
