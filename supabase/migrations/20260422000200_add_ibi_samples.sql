-- Store derived inter-beat interval samples for session-level HRV graphs and
-- summary recomputation. These are derived timing values, not raw camera data.

create table public.heart_rate_ibi_samples (
  id bigserial primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  breath_hold_session_id uuid references public.breath_hold_sessions(id) on delete cascade,
  breathing_session_id uuid references public.breathing_sessions(id) on delete cascade,
  heart_rate_session_id uuid references public.heart_rate_sessions(id) on delete cascade,
  offset_ms int not null check (offset_ms >= 0),
  ibi_ms int not null check (ibi_ms between 300 and 2000),
  signal_quality numeric check (
    signal_quality is null or (signal_quality >= 0 and signal_quality <= 1)
  ),
  created_at timestamptz not null default now(),
  constraint heart_rate_ibi_samples_one_parent check (
    (
      (breath_hold_session_id is not null)::int +
      (breathing_session_id is not null)::int +
      (heart_rate_session_id is not null)::int
    ) = 1
  )
);

comment on table public.heart_rate_ibi_samples is
  'Derived inter-beat interval samples only. Raw camera/PPG frame, RGB, and ROI data must not be stored here.';

create index heart_rate_ibi_samples_breath_hold_idx
  on public.heart_rate_ibi_samples (breath_hold_session_id, offset_ms);

create index heart_rate_ibi_samples_breathing_session_idx
  on public.heart_rate_ibi_samples (breathing_session_id, offset_ms);

create index heart_rate_ibi_samples_hr_session_idx
  on public.heart_rate_ibi_samples (heart_rate_session_id, offset_ms);

create index heart_rate_ibi_samples_user_created_idx
  on public.heart_rate_ibi_samples (user_id, created_at desc);

alter table public.heart_rate_ibi_samples enable row level security;

create policy "heart_rate_ibi_samples_select_own"
on public.heart_rate_ibi_samples for select
to authenticated
using (user_id = auth.uid());

create or replace view public.user_today_breath_hold_ibi_samples_v as
with profile_days as (
  select
    p.user_id,
    ((now() at time zone p.timezone)::date) as today_local
  from public.profiles p
  where p.user_id = auth.uid()
),
latest_session as (
  select b.id
  from public.breath_hold_sessions b
  join profile_days pd
    on pd.user_id = b.user_id
   and pd.today_local = b.local_date
  order by b.started_at desc, b.created_at desc
  limit 1
)
select
  s.id,
  s.user_id,
  s.breath_hold_session_id,
  s.offset_ms,
  s.ibi_ms,
  s.signal_quality,
  s.created_at
from public.heart_rate_ibi_samples s
join latest_session ls
  on ls.id = s.breath_hold_session_id
order by s.offset_ms asc;

grant select on public.user_today_breath_hold_ibi_samples_v to authenticated;

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
    from jsonb_array_elements(p_samples) s;
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
    from jsonb_array_elements(v_ibi_samples) s;
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

  if v_technique_id not in ('box', '478', 'wimhof', 'resonance', 'relaxing') then
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
    from jsonb_array_elements(p_samples) s;
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
    from jsonb_array_elements(v_ibi_samples) s;
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
    duration_seconds, avg_bpm, min_bpm, max_bpm
  )
  values (
    v_session_id, v_user_id,
    (p_session->>'started_at')::timestamptz,
    (p_session->>'ended_at')::timestamptz,
    v_local_date, v_timezone,
    v_duration,
    nullif(p_session->>'avg_bpm', '')::int,
    nullif(p_session->>'min_bpm', '')::int,
    nullif(p_session->>'max_bpm', '')::int
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
    from jsonb_array_elements(p_samples) s;
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
    from jsonb_array_elements(v_ibi_samples) s;
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
