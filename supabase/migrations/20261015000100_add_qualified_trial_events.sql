-- A separate marketing signal; immediate RevenueCat integration events are unchanged.
create table public.qualified_trial_events (
  id uuid primary key default gen_random_uuid(),
  source_event_id text not null references public.revenuecat_events(event_id) on delete cascade,
  revenuecat_app_id text not null,
  store text not null check (store in ('APP_STORE', 'PLAY_STORE')),
  environment text not null check (environment = 'PRODUCTION'),
  original_transaction_id text not null,
  app_user_id text not null,
  product_id text not null,
  due_at timestamptz not null,
  status text not null default 'pending' check (status in (
    'pending', 'processing', 'dispatching', 'sent', 'suppressed', 'failed', 'uncertain'
  )),
  attempts integer not null default 0 check (attempts between 0 and 5),
  next_attempt_at timestamptz not null,
  lease_token uuid,
  lease_expires_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (revenuecat_app_id, store, environment, original_transaction_id)
);

alter table public.qualified_trial_events enable row level security;
revoke all on table public.qualified_trial_events from public, anon, authenticated;
grant all on table public.qualified_trial_events to service_role;

create index qualified_trial_events_pending_idx
  on public.qualified_trial_events (next_attempt_at)
  where status in ('pending', 'processing', 'dispatching');

create index revenuecat_events_trial_cancellation_idx
  on public.revenuecat_events (
    (payload->'event'->>'app_id'),
    (payload->'event'->>'store'),
    environment,
    (payload->'event'->>'original_transaction_id')
  ) where event_type in ('CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE');

create function public.enqueue_qualified_trial_event()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  event jsonb := new.payload->'event';
  purchased_ms numeric;
  expiration_ms numeric;
  qualification_at timestamptz;
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

  qualification_at := to_timestamp((purchased_ms / 1000)::double precision) + interval '10 minutes';
  insert into public.qualified_trial_events (
    source_event_id, revenuecat_app_id, store, environment,
    original_transaction_id, app_user_id, product_id, due_at, next_attempt_at
  ) values (
    new.event_id, event->>'app_id', event->>'store', new.environment,
    event->>'original_transaction_id', event->>'app_user_id', event->>'product_id',
    qualification_at, qualification_at
  ) on conflict (revenuecat_app_id, store, environment, original_transaction_id) do nothing;
  return new;
exception when others then
  -- Optional marketing work must not roll back the audit INSERT and prevent
  -- the existing RevenueCat webhook from updating paid access.
  raise warning 'Qualified trial enqueue failed (SQLSTATE %); RevenueCat event retained', sqlstate;
  return new;
end;
$$;

revoke all on function public.enqueue_qualified_trial_event() from public, anon, authenticated;
create trigger enqueue_qualified_trial_event
after insert on public.revenuecat_events
for each row execute function public.enqueue_qualified_trial_event();

create function public.claim_qualified_trial_events(
  p_stores text[] default array['APP_STORE', 'PLAY_STORE']::text[]
)
returns table (
  id uuid, source_event_id text, store text, app_user_id text, product_id text,
  original_transaction_id text, due_at timestamptz, lease_token uuid, attempts integer, payload jsonb
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
    q.original_transaction_id, q.due_at, q.lease_token, q.attempts, e.payload
  from claimed q join public.revenuecat_events e on e.event_id = q.source_event_id;
end;
$$;

create function public.prepare_qualified_trial_dispatch(p_id uuid, p_lease_token uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare q public.qualified_trial_events;
begin
  select * into q from public.qualified_trial_events
  where id = p_id and lease_token = p_lease_token and status = 'processing'
    and lease_expires_at > now() for update;
  if not found then return false; end if;

  if exists (
    select 1 from public.revenuecat_events e
    where e.event_type in ('CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE')
      and e.environment = q.environment
      and e.payload->'event'->>'app_id' = q.revenuecat_app_id
      and e.payload->'event'->>'store' = q.store
      and e.payload->'event'->>'original_transaction_id' = q.original_transaction_id
  ) then
    update public.qualified_trial_events set status = 'suppressed',
      last_error = 'Cancellation, expiration, or billing issue recorded', updated_at = now()
    where id = p_id;
    return false;
  end if;

  update public.qualified_trial_events set status = 'dispatching',
    lease_expires_at = now() + interval '2 minutes', updated_at = now()
  where id = p_id;
  return true;
end;
$$;

create function public.finish_qualified_trial_event(
  p_id uuid, p_lease_token uuid, p_status text, p_error text default null
) returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if p_status not in ('pending', 'suppressed', 'failed', 'sent', 'uncertain') then
    raise exception 'Invalid qualified trial outcome';
  end if;
  update public.qualified_trial_events q set
    status = case when p_status = 'pending' and q.attempts >= 5 then 'failed' else p_status end,
    last_error = left(p_error, 500), updated_at = now(),
    sent_at = case when p_status = 'sent' then now() else q.sent_at end,
    next_attempt_at = case when p_status = 'pending'
      then now() + make_interval(secs => 60 * power(2, q.attempts)::integer)
      else q.next_attempt_at end,
    lease_expires_at = null
  where q.id = p_id and q.lease_token = p_lease_token and (
    (q.status = 'processing' and p_status in ('pending', 'suppressed', 'failed'))
    or (q.status = 'dispatching' and p_status in ('sent', 'failed', 'uncertain'))
  );
  return found;
end;
$$;

revoke all on function public.claim_qualified_trial_events(text[]) from public, anon, authenticated;
revoke all on function public.prepare_qualified_trial_dispatch(uuid, uuid) from public, anon, authenticated;
revoke all on function public.finish_qualified_trial_event(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.claim_qualified_trial_events(text[]) to service_role;
grant execute on function public.prepare_qualified_trial_dispatch(uuid, uuid) to service_role;
grant execute on function public.finish_qualified_trial_event(uuid, uuid, text, text) to service_role;
