-- Persist derived HRV metrics on completed breath-hold sessions and expose
-- today's latest breath-hold summary for authenticated clients.

alter table public.breath_hold_sessions
  add column if not exists rmssd int
    check (rmssd is null or (rmssd between 0 and 500)),
  add column if not exists sdnn int
    check (sdnn is null or (sdnn between 0 and 500)),
  add column if not exists pnn50 int
    check (pnn50 is null or (pnn50 between 0 and 100)),
  add column if not exists hr_drop int
    check (hr_drop is null or (hr_drop between -240 and 240)),
  add column if not exists beat_count int
    check (beat_count is null or beat_count >= 0);

comment on column public.breath_hold_sessions.rmssd is
  'Derived RMSSD in ms for the completed breath-hold session.';
comment on column public.breath_hold_sessions.sdnn is
  'Derived SDNN in ms for the completed breath-hold session.';
comment on column public.breath_hold_sessions.pnn50 is
  'Derived pNN50 percentage for the completed breath-hold session.';
comment on column public.breath_hold_sessions.hr_drop is
  'Derived heart-rate drop (start HR minus end HR) in bpm for the completed breath-hold session.';
comment on column public.breath_hold_sessions.beat_count is
  'Number of inter-beat intervals used to derive HRV metrics for the completed breath-hold session.';

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

create or replace view public.user_today_breath_hold_v as
with profile_days as (
  select
    p.user_id,
    ((now() at time zone p.timezone)::date) as today_local
  from public.profiles p
  where p.user_id = auth.uid()
),
ranked as (
  select
    b.*,
    row_number() over (
      partition by b.user_id, b.local_date
      order by b.started_at desc, b.created_at desc
    ) as rn
  from public.breath_hold_sessions b
  join profile_days pd
    on pd.user_id = b.user_id
   and pd.today_local = b.local_date
)
select
  id,
  user_id,
  started_at,
  ended_at,
  local_date,
  timezone,
  inhale_seconds,
  hold_seconds,
  recovery_seconds,
  avg_bpm,
  min_bpm,
  max_bpm,
  health_score,
  lung_age,
  score_version,
  notes,
  rmssd,
  sdnn,
  pnn50,
  hr_drop,
  beat_count,
  created_at
from ranked
where rn = 1;

grant select on public.user_today_breath_hold_v to authenticated;
