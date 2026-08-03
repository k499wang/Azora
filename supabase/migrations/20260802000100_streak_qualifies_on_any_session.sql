-- Streak rule change: any completed exercise earns the day.
--
-- Previously only `complete_breath_hold` set `qualifies_for_streak = true`;
-- guided breathing sessions and heart-rate captures inherited
-- `daily_breath_hold_completed`, so a breathing-only day never counted. That
-- contradicted the guided-breathing completion screen, which folds today into
-- the streak locally (`src/lib/weeklyProgress.ts`) and therefore showed a
-- number Home immediately contradicted.
--
-- New rule: a breath hold OR a breathing session qualifies the day. Heart-rate
-- captures alone still do not, but they must never clear a flag another session
-- set — the old passthrough did exactly that when a capture followed a
-- breathing session.

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
  values (v_user_id, v_local_date, v_timezone, 1, v_duration, true)
  on conflict (user_id, activity_date) do update set
    timezone = excluded.timezone,
    breathing_session_count = public.daily_activity.breathing_session_count + 1,
    breathing_seconds = public.daily_activity.breathing_seconds + excluded.breathing_seconds,
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
  v_idempotency_key text := nullif(p_session->>'idempotency_key', '');
  v_existing_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if v_local_date is null or v_timezone is null then
    raise exception 'local_date and timezone are required';
  end if;

  if v_idempotency_key is not null then
    select id into v_existing_id
    from public.heart_rate_sessions
    where user_id = v_user_id
      and idempotency_key = v_idempotency_key
    limit 1;

    if v_existing_id is not null then
      return v_existing_id;
    end if;
  end if;

  perform public.ensure_profile_exists(v_user_id);

  insert into public.heart_rate_sessions (
    id, user_id, started_at, ended_at, local_date, timezone,
    duration_seconds, avg_bpm, min_bpm, max_bpm,
    rmssd, sdnn, pnn50, hr_drop, beat_count, stress, idempotency_key
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
    nullif(p_session->>'stress', '')::int,
    v_idempotency_key
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
    updated_at = now();

  return v_session_id;
end;
$$;

-- Deleting the last breath hold of a day no longer clears the day outright:
-- a breathing session that day still qualifies it.
create or replace function public.recompute_daily_activity_after_breath_hold_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_best int;
begin
  select count(*)::int, max(hold_seconds)
    into v_count, v_best
  from public.breath_hold_sessions
  where user_id = old.user_id
    and local_date = old.local_date;

  update public.daily_activity
  set
    daily_breath_hold_completed = v_count > 0,
    breath_hold_count = v_count,
    best_hold_seconds = v_best,
    qualifies_for_streak = v_count > 0 or breathing_session_count > 0,
    updated_at = now()
  where user_id = old.user_id
    and activity_date = old.local_date;

  return old;
end;
$$;

-- Backfill so history matches the new rule instead of leaving a rule boundary
-- at the deploy date. This can only lengthen streaks, never shorten them.
update public.daily_activity
set qualifies_for_streak = true,
    updated_at = now()
where qualifies_for_streak = false
  and breathing_session_count > 0;
