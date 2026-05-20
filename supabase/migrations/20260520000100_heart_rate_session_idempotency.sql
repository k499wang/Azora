-- Make complete_heart_rate_session idempotent so a client retry after a network
-- blip (where the server already committed) returns the original row instead of
-- inserting a duplicate or double-counting daily_activity.

alter table public.heart_rate_sessions
  add column if not exists idempotency_key text;

comment on column public.heart_rate_sessions.idempotency_key is
  'Client-supplied deterministic key derived from the reading''s content. '
  'Used to dedup retries of the same capture.';

create unique index if not exists heart_rate_sessions_user_idempotency_idx
  on public.heart_rate_sessions (user_id, idempotency_key)
  where idempotency_key is not null;

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
    qualifies_for_streak = public.daily_activity.daily_breath_hold_completed,
    updated_at = now();

  return v_session_id;
end;
$$;
