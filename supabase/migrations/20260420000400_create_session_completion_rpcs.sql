-- Atomic completion functions. These are called by authenticated clients via
-- supabase.rpc(). They create the session, insert derived BPM samples, and
-- update daily_activity in one transaction.

create or replace function public.ensure_profile_exists(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  insert into public.user_preferences (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;
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

revoke all on function public.ensure_profile_exists(uuid) from public;
revoke all on function public.complete_breath_hold(jsonb, jsonb) from public;
revoke all on function public.complete_breathing_session(jsonb, jsonb) from public;
revoke all on function public.complete_heart_rate_session(jsonb, jsonb) from public;

grant execute on function public.complete_breath_hold(jsonb, jsonb) to authenticated;
grant execute on function public.complete_breathing_session(jsonb, jsonb) to authenticated;
grant execute on function public.complete_heart_rate_session(jsonb, jsonb) to authenticated;
