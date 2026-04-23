-- Hardening migration:
-- 1. prevent duplicate graph points per session offset
-- 2. replace hardcoded breathing technique validation with a reference table
-- 3. force user-scoped views to run with invoker permissions
-- 4. make function ownership explicit for security-definer RPCs

create table if not exists public.breathing_technique_catalog (
  id text primary key,
  display_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.breathing_technique_catalog (id, display_name)
values
  ('box', 'Box Breathing'),
  ('478', '4-7-8 Breathing'),
  ('wimhof', 'Wim Hof'),
  ('resonance', 'Resonance'),
  ('relaxing', 'Relaxing Breath')
on conflict (id) do update set
  display_name = excluded.display_name;

alter table public.breathing_technique_catalog enable row level security;

create policy "breathing_technique_catalog_select_authenticated"
on public.breathing_technique_catalog for select
to authenticated
using (active = true);

revoke all on public.breathing_technique_catalog from public;
grant select on public.breathing_technique_catalog to authenticated;

alter table public.breathing_sessions
  drop constraint if exists breathing_sessions_known_technique;

alter table public.breathing_sessions
  add constraint breathing_sessions_technique_id_fkey
  foreign key (technique_id)
  references public.breathing_technique_catalog(id);

with ranked as (
  select
    id,
    row_number() over (
      partition by breath_hold_session_id, offset_ms
      order by created_at desc, id desc
    ) as rn
  from public.heart_rate_samples
  where breath_hold_session_id is not null
)
delete from public.heart_rate_samples s
using ranked r
where s.id = r.id
  and r.rn > 1;

with ranked as (
  select
    id,
    row_number() over (
      partition by breathing_session_id, offset_ms
      order by created_at desc, id desc
    ) as rn
  from public.heart_rate_samples
  where breathing_session_id is not null
)
delete from public.heart_rate_samples s
using ranked r
where s.id = r.id
  and r.rn > 1;

with ranked as (
  select
    id,
    row_number() over (
      partition by heart_rate_session_id, offset_ms
      order by created_at desc, id desc
    ) as rn
  from public.heart_rate_samples
  where heart_rate_session_id is not null
)
delete from public.heart_rate_samples s
using ranked r
where s.id = r.id
  and r.rn > 1;

with ranked as (
  select
    id,
    row_number() over (
      partition by breath_hold_session_id, offset_ms
      order by created_at desc, id desc
    ) as rn
  from public.heart_rate_ibi_samples
  where breath_hold_session_id is not null
)
delete from public.heart_rate_ibi_samples s
using ranked r
where s.id = r.id
  and r.rn > 1;

with ranked as (
  select
    id,
    row_number() over (
      partition by breathing_session_id, offset_ms
      order by created_at desc, id desc
    ) as rn
  from public.heart_rate_ibi_samples
  where breathing_session_id is not null
)
delete from public.heart_rate_ibi_samples s
using ranked r
where s.id = r.id
  and r.rn > 1;

with ranked as (
  select
    id,
    row_number() over (
      partition by heart_rate_session_id, offset_ms
      order by created_at desc, id desc
    ) as rn
  from public.heart_rate_ibi_samples
  where heart_rate_session_id is not null
)
delete from public.heart_rate_ibi_samples s
using ranked r
where s.id = r.id
  and r.rn > 1;

create unique index if not exists heart_rate_samples_breath_hold_unique_offset_idx
  on public.heart_rate_samples (breath_hold_session_id, offset_ms)
  where breath_hold_session_id is not null;

create unique index if not exists heart_rate_samples_breathing_unique_offset_idx
  on public.heart_rate_samples (breathing_session_id, offset_ms)
  where breathing_session_id is not null;

create unique index if not exists heart_rate_samples_hr_unique_offset_idx
  on public.heart_rate_samples (heart_rate_session_id, offset_ms)
  where heart_rate_session_id is not null;

create unique index if not exists heart_rate_ibi_samples_breath_hold_unique_offset_idx
  on public.heart_rate_ibi_samples (breath_hold_session_id, offset_ms)
  where breath_hold_session_id is not null;

create unique index if not exists heart_rate_ibi_samples_breathing_unique_offset_idx
  on public.heart_rate_ibi_samples (breathing_session_id, offset_ms)
  where breathing_session_id is not null;

create unique index if not exists heart_rate_ibi_samples_hr_unique_offset_idx
  on public.heart_rate_ibi_samples (heart_rate_session_id, offset_ms)
  where heart_rate_session_id is not null;

create or replace function public.complete_breathing_session(
  p_session jsonb,
  p_samples jsonb default '[]'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_session_id uuid := extensions.gen_random_uuid();
  v_local_date date := (p_session->>'local_date')::date;
  v_timezone text := nullif(p_session->>'timezone', '');
  v_duration int := coalesce(nullif(p_session->>'duration_seconds', '')::int, 0);
  v_technique_id text := nullif(p_session->>'technique_id', '');
  v_ibi_samples jsonb := coalesce(p_session->'ibi_samples', '[]'::jsonb);
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if v_local_date is null or v_timezone is null or v_technique_id is null then
    raise exception 'local_date, timezone, and technique_id are required';
  end if;

  if not exists (
    select 1
    from public.breathing_technique_catalog t
    where t.id = v_technique_id
      and t.active = true
  ) then
    raise exception 'unknown technique_id';
  end if;

  perform public.ensure_profile_exists(v_user_id);

  insert into public.breathing_sessions (
    id, user_id, technique_id, started_at, ended_at, local_date, timezone,
    duration_seconds, target_rounds, rounds_completed,
    avg_bpm, min_bpm, max_bpm, completed
  )
  values (
    v_session_id, v_user_id, v_technique_id,
    (p_session->>'started_at')::timestamptz,
    (p_session->>'ended_at')::timestamptz,
    v_local_date, v_timezone,
    v_duration,
    nullif(p_session->>'target_rounds', '')::int,
    nullif(p_session->>'rounds_completed', '')::int,
    nullif(p_session->>'avg_bpm', '')::int,
    nullif(p_session->>'min_bpm', '')::int,
    nullif(p_session->>'max_bpm', '')::int,
    coalesce(nullif(p_session->>'completed', '')::boolean, false)
  );

  if jsonb_typeof(p_samples) = 'array' and jsonb_array_length(p_samples) > 0 then
    insert into public.heart_rate_samples (
      user_id, breathing_session_id, offset_ms, bpm, signal_quality
    )
    select
      v_user_id,
      v_session_id,
      (s->>'offset_ms')::int,
      (s->>'bpm')::int,
      nullif(s->>'signal_quality', '')::numeric
    from jsonb_array_elements(p_samples) s
    on conflict (breathing_session_id, offset_ms)
      where breathing_session_id is not null
      do update set
        bpm = excluded.bpm,
        signal_quality = excluded.signal_quality;
  end if;

  if jsonb_typeof(v_ibi_samples) = 'array' and jsonb_array_length(v_ibi_samples) > 0 then
    insert into public.heart_rate_ibi_samples (
      user_id, breathing_session_id, offset_ms, ibi_ms, signal_quality
    )
    select
      v_user_id,
      v_session_id,
      (s->>'offset_ms')::int,
      (s->>'ibi_ms')::int,
      nullif(s->>'signal_quality', '')::numeric
    from jsonb_array_elements(v_ibi_samples) s
    on conflict (breathing_session_id, offset_ms)
      where breathing_session_id is not null
      do update set
        ibi_ms = excluded.ibi_ms,
        signal_quality = excluded.signal_quality;
  end if;

  insert into public.daily_activity (
    user_id, activity_date, timezone, breathing_session_count, breathing_seconds,
    qualifies_for_streak
  )
  values (v_user_id, v_local_date, v_timezone, 1, v_duration, false)
  on conflict (user_id, activity_date) do update set
    timezone = excluded.timezone,
    breathing_session_count = public.daily_activity.breathing_session_count + 1,
    breathing_seconds = public.daily_activity.breathing_seconds + excluded.breathing_seconds,
    qualifies_for_streak = public.daily_activity.daily_breath_hold_completed,
    updated_at = now();

  return v_session_id;
end;
$$;

create or replace function public.complete_breath_hold(
  p_session jsonb,
  p_samples jsonb default '[]'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_session_id uuid := extensions.gen_random_uuid();
  v_local_date date := (p_session->>'local_date')::date;
  v_timezone text := nullif(p_session->>'timezone', '');
  v_hold int := (p_session->>'hold_seconds')::int;
  v_ibi_samples jsonb := coalesce(p_session->'ibi_samples', '[]'::jsonb);
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if v_local_date is null or v_timezone is null or v_hold is null then
    raise exception 'local_date, timezone, and hold_seconds are required';
  end if;

  perform public.ensure_profile_exists(v_user_id);

  insert into public.breath_hold_sessions (
    id, user_id, started_at, ended_at, local_date, timezone,
    inhale_seconds, hold_seconds, recovery_seconds,
    avg_bpm, min_bpm, max_bpm, health_score, lung_age, score_version, notes,
    rmssd, sdnn, pnn50, hr_drop, beat_count
  )
  values (
    v_session_id, v_user_id,
    (p_session->>'started_at')::timestamptz,
    (p_session->>'ended_at')::timestamptz,
    v_local_date, v_timezone,
    nullif(p_session->>'inhale_seconds', '')::int,
    v_hold,
    nullif(p_session->>'recovery_seconds', '')::int,
    nullif(p_session->>'avg_bpm', '')::int,
    nullif(p_session->>'min_bpm', '')::int,
    nullif(p_session->>'max_bpm', '')::int,
    nullif(p_session->>'health_score', '')::int,
    nullif(p_session->>'lung_age', '')::int,
    coalesce(nullif(p_session->>'score_version', '')::smallint, 1),
    p_session->>'notes',
    nullif(p_session->>'rmssd', '')::int,
    nullif(p_session->>'sdnn', '')::int,
    nullif(p_session->>'pnn50', '')::int,
    nullif(p_session->>'hr_drop', '')::int,
    nullif(p_session->>'beat_count', '')::int
  );

  if jsonb_typeof(p_samples) = 'array' and jsonb_array_length(p_samples) > 0 then
    insert into public.heart_rate_samples (
      user_id, breath_hold_session_id, offset_ms, bpm, signal_quality
    )
    select
      v_user_id,
      v_session_id,
      (s->>'offset_ms')::int,
      (s->>'bpm')::int,
      nullif(s->>'signal_quality', '')::numeric
    from jsonb_array_elements(p_samples) s
    on conflict (breath_hold_session_id, offset_ms)
      where breath_hold_session_id is not null
      do update set
        bpm = excluded.bpm,
        signal_quality = excluded.signal_quality;
  end if;

  if jsonb_typeof(v_ibi_samples) = 'array' and jsonb_array_length(v_ibi_samples) > 0 then
    insert into public.heart_rate_ibi_samples (
      user_id, breath_hold_session_id, offset_ms, ibi_ms, signal_quality
    )
    select
      v_user_id,
      v_session_id,
      (s->>'offset_ms')::int,
      (s->>'ibi_ms')::int,
      nullif(s->>'signal_quality', '')::numeric
    from jsonb_array_elements(v_ibi_samples) s
    on conflict (breath_hold_session_id, offset_ms)
      where breath_hold_session_id is not null
      do update set
        ibi_ms = excluded.ibi_ms,
        signal_quality = excluded.signal_quality;
  end if;

  insert into public.daily_activity (
    user_id, activity_date, timezone,
    daily_breath_hold_completed, breath_hold_count, best_hold_seconds,
    qualifies_for_streak
  )
  values (v_user_id, v_local_date, v_timezone, true, 1, v_hold, true)
  on conflict (user_id, activity_date) do update set
    timezone = excluded.timezone,
    daily_breath_hold_completed = true,
    breath_hold_count = public.daily_activity.breath_hold_count + 1,
    best_hold_seconds = greatest(
      coalesce(public.daily_activity.best_hold_seconds, 0),
      excluded.best_hold_seconds
    ),
    qualifies_for_streak = true,
    updated_at = now();

  return v_session_id;
end;
$$;

create or replace function public.complete_heart_rate_session(
  p_session jsonb,
  p_samples jsonb default '[]'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_session_id uuid := extensions.gen_random_uuid();
  v_local_date date := (p_session->>'local_date')::date;
  v_timezone text := nullif(p_session->>'timezone', '');
  v_duration int := coalesce(nullif(p_session->>'duration_seconds', '')::int, 0);
  v_ibi_samples jsonb := coalesce(p_session->'ibi_samples', '[]'::jsonb);
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if v_local_date is null or v_timezone is null then
    raise exception 'local_date and timezone are required';
  end if;

  perform public.ensure_profile_exists(v_user_id);

  insert into public.heart_rate_sessions (
    id, user_id, started_at, ended_at, local_date, timezone,
    duration_seconds, avg_bpm, min_bpm, max_bpm,
    rmssd, sdnn, pnn50, hr_drop, beat_count
  )
  values (
    v_session_id, v_user_id,
    (p_session->>'started_at')::timestamptz,
    (p_session->>'ended_at')::timestamptz,
    v_local_date, v_timezone,
    v_duration,
    nullif(p_session->>'avg_bpm', '')::int,
    nullif(p_session->>'min_bpm', '')::int,
    nullif(p_session->>'max_bpm', '')::int,
    nullif(p_session->>'rmssd', '')::int,
    nullif(p_session->>'sdnn', '')::int,
    nullif(p_session->>'pnn50', '')::int,
    nullif(p_session->>'hr_drop', '')::int,
    nullif(p_session->>'beat_count', '')::int
  );

  if jsonb_typeof(p_samples) = 'array' and jsonb_array_length(p_samples) > 0 then
    insert into public.heart_rate_samples (
      user_id, heart_rate_session_id, offset_ms, bpm, signal_quality
    )
    select
      v_user_id,
      v_session_id,
      (s->>'offset_ms')::int,
      (s->>'bpm')::int,
      nullif(s->>'signal_quality', '')::numeric
    from jsonb_array_elements(p_samples) s
    on conflict (heart_rate_session_id, offset_ms)
      where heart_rate_session_id is not null
      do update set
        bpm = excluded.bpm,
        signal_quality = excluded.signal_quality;
  end if;

  if jsonb_typeof(v_ibi_samples) = 'array' and jsonb_array_length(v_ibi_samples) > 0 then
    insert into public.heart_rate_ibi_samples (
      user_id, heart_rate_session_id, offset_ms, ibi_ms, signal_quality
    )
    select
      v_user_id,
      v_session_id,
      (s->>'offset_ms')::int,
      (s->>'ibi_ms')::int,
      nullif(s->>'signal_quality', '')::numeric
    from jsonb_array_elements(v_ibi_samples) s
    on conflict (heart_rate_session_id, offset_ms)
      where heart_rate_session_id is not null
      do update set
        ibi_ms = excluded.ibi_ms,
        signal_quality = excluded.signal_quality;
  end if;

  insert into public.daily_activity (
    user_id, activity_date, timezone, heart_rate_capture_count, qualifies_for_streak
  )
  values (v_user_id, v_local_date, v_timezone, 1, false)
  on conflict (user_id, activity_date) do update set
    timezone = excluded.timezone,
    heart_rate_capture_count = public.daily_activity.heart_rate_capture_count + 1,
    qualifies_for_streak = public.daily_activity.daily_breath_hold_completed,
    updated_at = now();

  return v_session_id;
end;
$$;

do $$
begin
  if exists (
    select 1
    from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'ensure_profile_exists'
      and pg_get_function_identity_arguments(oid) = 'p_user_id uuid'
  ) then
    alter function public.ensure_profile_exists(uuid) owner to postgres;
  end if;

  if exists (
    select 1
    from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'complete_breath_hold'
      and pg_get_function_identity_arguments(oid) = 'p_session jsonb, p_samples jsonb'
  ) then
    alter function public.complete_breath_hold(jsonb, jsonb) owner to postgres;
  end if;

  if exists (
    select 1
    from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'complete_breathing_session'
      and pg_get_function_identity_arguments(oid) = 'p_session jsonb, p_samples jsonb'
  ) then
    alter function public.complete_breathing_session(jsonb, jsonb) owner to postgres;
  end if;

  if exists (
    select 1
    from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'complete_heart_rate_session'
      and pg_get_function_identity_arguments(oid) = 'p_session jsonb, p_samples jsonb'
  ) then
    alter function public.complete_heart_rate_session(jsonb, jsonb) owner to postgres;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_class
    where relnamespace = 'public'::regnamespace
      and relname = 'user_streaks_v'
      and relkind = 'v'
  ) then
    alter view public.user_streaks_v set (security_invoker = true);
  end if;

  if exists (
    select 1
    from pg_class
    where relnamespace = 'public'::regnamespace
      and relname = 'user_today_breath_hold_v'
      and relkind = 'v'
  ) then
    alter view public.user_today_breath_hold_v set (security_invoker = true);
  end if;

  if exists (
    select 1
    from pg_class
    where relnamespace = 'public'::regnamespace
      and relname = 'user_today_breath_hold_ibi_samples_v'
      and relkind = 'v'
  ) then
    alter view public.user_today_breath_hold_ibi_samples_v set (security_invoker = true);
  end if;

  if exists (
    select 1
    from pg_class
    where relnamespace = 'public'::regnamespace
      and relname = 'user_today_heart_rate_v'
      and relkind = 'v'
  ) then
    alter view public.user_today_heart_rate_v set (security_invoker = true);
  end if;

  if exists (
    select 1
    from pg_class
    where relnamespace = 'public'::regnamespace
      and relname = 'user_today_heart_rate_ibi_samples_v'
      and relkind = 'v'
  ) then
    alter view public.user_today_heart_rate_ibi_samples_v set (security_invoker = true);
  end if;
end
$$;
