-- Launch schema for authenticated tracking, subscriptions, daily activity,
-- and derived heart-rate samples.

create extension if not exists pgcrypto with schema extensions;

create or replace function public.update_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  timezone text not null default 'America/Toronto',
  onboarding_goal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at();

create table public.user_preferences (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  reminder_enabled boolean not null default false,
  reminder_time time,
  units text not null default 'metric',
  privacy_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_preferences_updated_at
before update on public.user_preferences
for each row execute function public.update_updated_at();

create table public.breath_hold_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  local_date date not null,
  timezone text not null,
  inhale_seconds int,
  hold_seconds int not null check (hold_seconds >= 0),
  recovery_seconds int,
  avg_bpm int check (avg_bpm is null or (avg_bpm between 20 and 240)),
  min_bpm int check (min_bpm is null or (min_bpm between 20 and 240)),
  max_bpm int check (max_bpm is null or (max_bpm between 20 and 240)),
  health_score int check (health_score is null or (health_score between 0 and 100)),
  lung_age int check (lung_age is null or (lung_age between 1 and 120)),
  score_version smallint not null default 1,
  notes text,
  created_at timestamptz not null default now()
);

create index breath_hold_sessions_user_date_idx
  on public.breath_hold_sessions (user_id, local_date desc, started_at desc);

create table public.breathing_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  technique_id text not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  local_date date not null,
  timezone text not null,
  duration_seconds int not null default 0 check (duration_seconds >= 0),
  target_rounds int check (target_rounds is null or target_rounds > 0),
  rounds_completed int check (rounds_completed is null or rounds_completed >= 0),
  avg_bpm int check (avg_bpm is null or (avg_bpm between 20 and 240)),
  min_bpm int check (min_bpm is null or (min_bpm between 20 and 240)),
  max_bpm int check (max_bpm is null or (max_bpm between 20 and 240)),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  constraint breathing_sessions_known_technique check (
    technique_id in ('box', '478', 'wimhof', 'resonance', 'relaxing')
  )
);

create index breathing_sessions_user_date_idx
  on public.breathing_sessions (user_id, local_date desc, started_at desc);

create table public.heart_rate_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  local_date date not null,
  timezone text not null,
  duration_seconds int not null default 0 check (duration_seconds >= 0),
  avg_bpm int check (avg_bpm is null or (avg_bpm between 20 and 240)),
  min_bpm int check (min_bpm is null or (min_bpm between 20 and 240)),
  max_bpm int check (max_bpm is null or (max_bpm between 20 and 240)),
  created_at timestamptz not null default now()
);

create index heart_rate_sessions_user_date_idx
  on public.heart_rate_sessions (user_id, local_date desc, started_at desc);

create table public.heart_rate_samples (
  id bigserial primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  breath_hold_session_id uuid references public.breath_hold_sessions(id) on delete cascade,
  breathing_session_id uuid references public.breathing_sessions(id) on delete cascade,
  heart_rate_session_id uuid references public.heart_rate_sessions(id) on delete cascade,
  offset_ms int not null check (offset_ms >= 0),
  bpm int not null check (bpm between 20 and 240),
  signal_quality numeric check (signal_quality is null or (signal_quality >= 0 and signal_quality <= 1)),
  created_at timestamptz not null default now(),
  constraint heart_rate_samples_one_parent check (
    (
      (breath_hold_session_id is not null)::int +
      (breathing_session_id is not null)::int +
      (heart_rate_session_id is not null)::int
    ) = 1
  )
);

comment on table public.heart_rate_samples is
  'Derived BPM samples only. Raw camera/PPG frame, RGB, and ROI data must not be stored here.';

create index heart_rate_samples_breath_hold_idx
  on public.heart_rate_samples (breath_hold_session_id, offset_ms);

create index heart_rate_samples_breathing_session_idx
  on public.heart_rate_samples (breathing_session_id, offset_ms);

create index heart_rate_samples_hr_session_idx
  on public.heart_rate_samples (heart_rate_session_id, offset_ms);

create index heart_rate_samples_user_created_idx
  on public.heart_rate_samples (user_id, created_at desc);

create table public.daily_activity (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  activity_date date not null,
  timezone text not null,
  daily_breath_hold_completed boolean not null default false,
  breath_hold_count int not null default 0 check (breath_hold_count >= 0),
  best_hold_seconds int check (best_hold_seconds is null or best_hold_seconds >= 0),
  breathing_session_count int not null default 0 check (breathing_session_count >= 0),
  breathing_seconds int not null default 0 check (breathing_seconds >= 0),
  heart_rate_capture_count int not null default 0 check (heart_rate_capture_count >= 0),
  xp_earned int not null default 0 check (xp_earned >= 0),
  qualifies_for_streak boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, activity_date)
);

create trigger daily_activity_updated_at
before update on public.daily_activity
for each row execute function public.update_updated_at();

create table public.subscriptions (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  revenuecat_app_user_id text not null,
  entitlement text not null default 'pro',
  status text not null,
  product_id text,
  store text,
  current_period_ends_at timestamptz,
  will_renew boolean,
  trial_ends_at timestamptz,
  updated_at timestamptz not null default now()
);

create trigger subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.update_updated_at();

create table public.revenuecat_events (
  event_id text primary key,
  user_id uuid references public.profiles(user_id) on delete set null,
  environment text,
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

create index revenuecat_events_user_received_idx
  on public.revenuecat_events (user_id, received_at desc);
