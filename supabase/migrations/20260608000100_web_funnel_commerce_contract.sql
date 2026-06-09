-- Web funnel commerce contract.
--
-- The mobile/backend repo owns these shared Supabase tables so the separate
-- web funnel repo can consume one billing/auth contract without creating a
-- competing subscription schema.

alter table public.subscriptions
  add column if not exists last_revenuecat_event_id text,
  add column if not exists last_revenuecat_event_type text,
  add column if not exists last_revenuecat_event_timestamp_ms bigint,
  add column if not exists last_revenuecat_event_received_at timestamptz,
  add column if not exists last_revenuecat_transaction_id text,
  add column if not exists last_revenuecat_original_transaction_id text;

comment on column public.subscriptions.last_revenuecat_event_id is
  'Most recent RevenueCat event id that updated this mirror row. Used for audit/debugging and stale-event protection.';
comment on column public.subscriptions.last_revenuecat_event_type is
  'Most recent RevenueCat event type that updated this mirror row.';
comment on column public.subscriptions.last_revenuecat_event_timestamp_ms is
  'Most recent RevenueCat event timestamp in milliseconds. Incoming older events must not overwrite newer subscription state.';
comment on column public.subscriptions.last_revenuecat_event_received_at is
  'Supabase receipt time for the most recent RevenueCat event that updated this mirror row.';
comment on column public.subscriptions.last_revenuecat_transaction_id is
  'Most recent RevenueCat transaction id mirrored into subscriptions, when present.';
comment on column public.subscriptions.last_revenuecat_original_transaction_id is
  'Most recent RevenueCat original transaction id mirrored into subscriptions, when present.';

create table if not exists public.web_funnel_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  anonymous_id text not null,
  user_id uuid references public.profiles(user_id) on delete cascade,
  funnel_slug text not null,
  landing_path text not null,
  initial_url text not null,
  referrer text,
  user_agent text,
  ip_country text,
  status text not null default 'started'
    check (status in ('started', 'authenticated', 'checkout_started', 'purchased', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists web_funnel_sessions_updated_at on public.web_funnel_sessions;
create trigger web_funnel_sessions_updated_at
before update on public.web_funnel_sessions
for each row execute function public.update_updated_at();

create index if not exists web_funnel_sessions_anonymous_id_idx
  on public.web_funnel_sessions (anonymous_id);

create index if not exists web_funnel_sessions_user_created_idx
  on public.web_funnel_sessions (user_id, created_at desc)
  where user_id is not null;

create index if not exists web_funnel_sessions_funnel_created_idx
  on public.web_funnel_sessions (funnel_slug, created_at desc);

create table if not exists public.web_funnel_attribution (
  session_id uuid primary key references public.web_funnel_sessions(id) on delete cascade,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  fbclid text,
  fbp text,
  fbc text,
  appsflyer_pid text,
  appsflyer_c text,
  appsflyer_deep_link_value text,
  landing_event_id text,
  lead_event_id text,
  checkout_event_id text,
  purchase_event_id text,
  raw_params jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists web_funnel_attribution_updated_at on public.web_funnel_attribution;
create trigger web_funnel_attribution_updated_at
before update on public.web_funnel_attribution
for each row execute function public.update_updated_at();

create index if not exists web_funnel_attribution_utm_campaign_idx
  on public.web_funnel_attribution (utm_source, utm_campaign);

create unique index if not exists web_funnel_attribution_landing_event_id_key
  on public.web_funnel_attribution (landing_event_id)
  where landing_event_id is not null;

create unique index if not exists web_funnel_attribution_lead_event_id_key
  on public.web_funnel_attribution (lead_event_id)
  where lead_event_id is not null;

create unique index if not exists web_funnel_attribution_checkout_event_id_key
  on public.web_funnel_attribution (checkout_event_id)
  where checkout_event_id is not null;

create unique index if not exists web_funnel_attribution_purchase_event_id_key
  on public.web_funnel_attribution (purchase_event_id)
  where purchase_event_id is not null;

create table if not exists public.web_funnel_answers (
  id uuid primary key default extensions.gen_random_uuid(),
  session_id uuid not null references public.web_funnel_sessions(id) on delete cascade,
  step_id text not null,
  answer jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, step_id)
);

drop trigger if exists web_funnel_answers_updated_at on public.web_funnel_answers;
create trigger web_funnel_answers_updated_at
before update on public.web_funnel_answers
for each row execute function public.update_updated_at();

create index if not exists web_funnel_answers_session_created_idx
  on public.web_funnel_answers (session_id, created_at);

create table if not exists public.web_checkout_intents (
  id uuid primary key default extensions.gen_random_uuid(),
  session_id uuid not null references public.web_funnel_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  offer_id text not null,
  revenuecat_app_user_id text not null,
  revenuecat_product_id text,
  revenuecat_purchase_url text not null,
  environment text not null check (environment in ('SANDBOX', 'PRODUCTION')),
  status text not null default 'created'
    check (status in ('created', 'redirected', 'purchased', 'failed', 'abandoned')),
  checkout_event_id text,
  purchase_event_id text,
  revenuecat_event_id text,
  revenuecat_transaction_id text,
  revenuecat_original_transaction_id text,
  purchased_at timestamptz,
  price_amount numeric,
  currency text,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (revenuecat_app_user_id = user_id::text)
);

drop trigger if exists web_checkout_intents_updated_at on public.web_checkout_intents;
create trigger web_checkout_intents_updated_at
before update on public.web_checkout_intents
for each row execute function public.update_updated_at();

create index if not exists web_checkout_intents_session_idx
  on public.web_checkout_intents (session_id);

create index if not exists web_checkout_intents_user_status_created_idx
  on public.web_checkout_intents (user_id, status, created_at desc);

create index if not exists web_checkout_intents_offer_environment_idx
  on public.web_checkout_intents (offer_id, environment, created_at desc);

create unique index if not exists web_checkout_intents_checkout_event_id_key
  on public.web_checkout_intents (checkout_event_id)
  where checkout_event_id is not null;

create unique index if not exists web_checkout_intents_purchase_event_id_key
  on public.web_checkout_intents (purchase_event_id)
  where purchase_event_id is not null;

create unique index if not exists web_checkout_intents_revenuecat_event_id_key
  on public.web_checkout_intents (revenuecat_event_id)
  where revenuecat_event_id is not null;

create index if not exists web_checkout_intents_revenuecat_transaction_idx
  on public.web_checkout_intents (revenuecat_transaction_id)
  where revenuecat_transaction_id is not null;

alter table public.web_funnel_sessions enable row level security;
alter table public.web_funnel_attribution enable row level security;
alter table public.web_funnel_answers enable row level security;
alter table public.web_checkout_intents enable row level security;

drop policy if exists "web_funnel_sessions_select_own"
on public.web_funnel_sessions;
create policy "web_funnel_sessions_select_own"
on public.web_funnel_sessions for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "web_funnel_attribution_select_own"
on public.web_funnel_attribution;
create policy "web_funnel_attribution_select_own"
on public.web_funnel_attribution for select
to authenticated
using (
  exists (
    select 1
    from public.web_funnel_sessions s
    where s.id = web_funnel_attribution.session_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "web_funnel_answers_select_own"
on public.web_funnel_answers;
create policy "web_funnel_answers_select_own"
on public.web_funnel_answers for select
to authenticated
using (
  exists (
    select 1
    from public.web_funnel_sessions s
    where s.id = web_funnel_answers.session_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "web_checkout_intents_select_own"
on public.web_checkout_intents;
create policy "web_checkout_intents_select_own"
on public.web_checkout_intents for select
to authenticated
using (auth.uid() = user_id);

-- Web funnel writes and purchase reconciliation are intentionally server-side
-- through the web app backend, Edge Functions, or other service-role jobs.
grant select on public.web_funnel_sessions to authenticated;
grant select on public.web_funnel_attribution to authenticated;
grant select on public.web_funnel_answers to authenticated;
grant select on public.web_checkout_intents to authenticated;
