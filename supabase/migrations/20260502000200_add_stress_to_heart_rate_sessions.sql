-- Store the exact stress score shown on standalone heart-rate results so
-- saved Home/detail views do not recompute a slightly different value.

alter table public.heart_rate_sessions
  add column if not exists stress int
    check (stress is null or (stress between 0 and 100));

comment on column public.heart_rate_sessions.stress is
  'Derived 0-100 stress score shown for the standalone heart-rate session.';

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
    rmssd, sdnn, pnn50, hr_drop, beat_count, stress
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
    nullif(p_session->>'beat_count', '')::int,
    nullif(p_session->>'stress', '')::int
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

create or replace view public.user_today_heart_rate_v as
with profile_days as (
  select
    p.user_id,
    ((now() at time zone p.timezone)::date) as today_local
  from public.profiles p
  where p.user_id = auth.uid()
),
ranked as (
  select
    h.*,
    row_number() over (
      partition by h.user_id, h.local_date
      order by h.started_at desc, h.created_at desc
    ) as rn
  from public.heart_rate_sessions h
  join profile_days pd
    on pd.user_id = h.user_id
   and pd.today_local = h.local_date
)
select
  id,
  user_id,
  started_at,
  ended_at,
  local_date,
  timezone,
  duration_seconds,
  avg_bpm,
  min_bpm,
  max_bpm,
  rmssd,
  sdnn,
  pnn50,
  hr_drop,
  beat_count,
  created_at,
  stress
from ranked
where rn = 1;

grant select on public.user_today_heart_rate_v to authenticated;
