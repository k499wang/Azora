-- ⚠️  CONTRACT STEP — DO NOT APPLY UNTIL THE BAKE IS COMPLETE.
--
-- Removes the breath-hold HRV surface end-to-end:
--   1. Rewrites complete_breath_hold to stop writing HRV columns + breath-hold IBI.
--   2. Drops user_today_breath_hold_ibi_samples_v.
--   3. Drops the rmssd/sdnn/pnn50/hr_drop/beat_count/stress columns on
--      breath_hold_sessions.
--   4. Recreates user_today_breath_hold_v without those columns.
--   5. Deletes historical breath-hold IBI rows from heart_rate_ibi_samples.
--
-- This step is IRREVERSIBLE.
--
-- Precondition: the app release that stopped reading the breath-hold HRV
-- columns + IBI view must be effectively the only version in the field.
-- Confirm via client-version analytics; the standalone "write-stop" Phase was
-- intentionally skipped so pre-removal clients keep their full UI during the
-- bake. Applying this before they're gone will surface "column does not exist"
-- read errors on their Home.
--
-- The complete_breath_hold signature is unchanged, so any straggler client
-- still sending HRV / ibi_samples keys to the RPC still succeeds — the keys
-- are simply ignored.
--
-- After applying: regenerate supabase/database.types.ts and run `npx tsc
-- --noEmit` to confirm nothing still references the dropped columns.

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
    avg_bpm, min_bpm, max_bpm, health_score, lung_age, score_version, notes
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
    p_session->>'notes'
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

-- Views must be dropped before the columns they reference.
drop view if exists public.user_today_breath_hold_ibi_samples_v;
drop view if exists public.user_today_breath_hold_v;

alter table public.breath_hold_sessions
  drop column if exists rmssd,
  drop column if exists sdnn,
  drop column if exists pnn50,
  drop column if exists hr_drop,
  drop column if exists beat_count,
  drop column if exists stress;

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
  created_at
from ranked
where rn = 1;

grant select on public.user_today_breath_hold_v to authenticated;
alter view public.user_today_breath_hold_v set (security_invoker = true);

-- Heart-rate-session and breathing-session IBI rows are deliberately untouched.
delete from public.heart_rate_ibi_samples
where breath_hold_session_id is not null;
