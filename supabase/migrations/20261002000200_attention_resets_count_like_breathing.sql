-- A guided attention Reset counts like a breathing session: it earns its local
-- day for the streak and spends one of the free daily exercises.
--
-- Breathing gets both from `complete_breathing_session`, which bumps
-- `daily_activity.breathing_session_count` and sets `qualifies_for_streak`,
-- and from the shared qualification rule, which reads `breathing_sessions`.
-- An attention Reset has no session row, so the counter lives in its own
-- column rather than inflating the breathing count, and the rule reads that
-- column as well as the credited `attention.` plan completion.
--
-- Two ways in. A play that credits today's plan goes through
-- `advance_program_day`, and only a credited completion counts there: the
-- `on conflict do nothing` insert is what makes a retried call harmless, so the
-- counter follows it. Any other play — from Explore, from search, or a replay
-- of a plan Reset already done — goes through `record_attention_session`,
-- which counts every call, as `complete_breathing_session` does.

alter table public.daily_activity
  add column if not exists attention_session_count int not null default 0
  check (attention_session_count >= 0);

create or replace function public.recompute_daily_activity_streak_qualification(
  p_user_id uuid,
  p_local_date date
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_timezone text;
  v_qualifies boolean;
begin
  select timezone into v_timezone
  from public.profiles
  where user_id = p_user_id;

  if v_timezone is null then
    return;
  end if;

  select
    exists (
      select 1
      from public.breath_hold_sessions
      where user_id = p_user_id and local_date = p_local_date
    )
    or exists (
      select 1
      from public.breathing_sessions
      where user_id = p_user_id and local_date = p_local_date
    )
    or exists (
      select 1
      from public.self_care_goal_completions
      where user_id = p_user_id and local_date = p_local_date
    )
    or exists (
      select 1
      from public.mood_check_ins
      where user_id = p_user_id and local_date = p_local_date
    )
    or exists (
      select 1
      from public.program_action_completions
      where user_id = p_user_id
        and local_date = p_local_date
        and (activity_id like 'lesson:%' or activity_id like 'attention.%')
    )
    or exists (
      select 1
      from public.daily_activity
      where user_id = p_user_id
        and activity_date = p_local_date
        and attention_session_count > 0
    )
  into v_qualifies;

  insert into public.daily_activity (
    user_id, activity_date, timezone, qualifies_for_streak
  )
  values (p_user_id, p_local_date, v_timezone, v_qualifies)
  on conflict (user_id, activity_date) do update set
    timezone = excluded.timezone,
    qualifies_for_streak = excluded.qualifies_for_streak,
    updated_at = now();
end;
$$;

create or replace function public.advance_program_day(p_completion jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_local_date date := (p_completion->>'local_date')::date;
  v_technique_id text := nullif(p_completion->>'technique_id', '');
  v_script_id text := nullif(p_completion->>'script_id', '');
  v_modality text := coalesce(nullif(p_completion->>'modality', ''), 'breathing');
  v_session_id uuid := nullif(p_completion->>'breathing_session_id', '')::uuid;
  v_enrollment public.program_enrollments%rowtype;
  v_day jsonb;
  v_activity_id text;
  v_activity_revision int;
  v_credited int;
begin
  if v_user_id is null then raise exception 'not authenticated'; end if;
  if v_local_date is null then raise exception 'local_date is required'; end if;

  select * into v_enrollment from public.program_enrollments
  where user_id = v_user_id and status = 'active' for update;
  if not found then return jsonb_build_object('outcome', 'no_active_enrollment'); end if;
  if v_enrollment.last_advanced_on = v_local_date then
    return jsonb_build_object('outcome', 'already_advanced_today', 'enrollment', public.program_enrollment_json(v_enrollment));
  end if;

  select day into v_day from jsonb_array_elements(v_enrollment.resolved->'days') as day
  where (day->>'day')::int = v_enrollment.program_day limit 1;
  if v_day is null then
    return jsonb_build_object('outcome', 'no_current_day', 'enrollment', public.program_enrollment_json(v_enrollment));
  end if;

  select activity->>'activityId', (activity->>'activityRevision')::int
    into v_activity_id, v_activity_revision
  from jsonb_array_elements(v_day->'activities') as activity
  where activity->'match'->>'modality' = v_modality
    and (
      (v_modality = 'breathing'
        and v_technique_id is not null
        and activity->'match'->>'techniqueId' = v_technique_id)
      or (v_modality = 'attention'
        and v_script_id is not null
        and activity->'match'->>'scriptId' = v_script_id)
    )
    and not exists (
      select 1 from public.program_action_completions done
      where done.enrollment_id = v_enrollment.id
        and done.program_day = v_enrollment.program_day
        and done.activity_id = activity->>'activityId'
    )
  limit 1;

  if v_activity_id is null then
    return jsonb_build_object('outcome', 'completion_does_not_match', 'enrollment', public.program_enrollment_json(v_enrollment));
  end if;

  insert into public.program_action_completions (
    enrollment_id, user_id, program_day, activity_id, activity_revision,
    local_date, breathing_session_id
  ) values (
    v_enrollment.id, v_user_id, v_enrollment.program_day,
    v_activity_id, v_activity_revision, v_local_date,
    case when v_modality = 'breathing' then v_session_id end
  ) on conflict (enrollment_id, program_day, activity_id) do nothing;
  get diagnostics v_credited = row_count;

  if v_modality = 'attention' and v_credited > 0 then
    insert into public.daily_activity (
      user_id, activity_date, timezone, attention_session_count, qualifies_for_streak
    )
    select v_user_id, v_local_date, profiles.timezone, 1, true
    from public.profiles
    where profiles.user_id = v_user_id
    on conflict (user_id, activity_date) do update set
      attention_session_count = public.daily_activity.attention_session_count + 1,
      qualifies_for_streak = true,
      updated_at = now();
  end if;

  return public.advance_program_day_if_ready(v_user_id, v_local_date);
end;
$$;

revoke all on function public.advance_program_day(jsonb) from public;
grant execute on function public.advance_program_day(jsonb) to authenticated;

create or replace function public.record_attention_session(p_session jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_local_date date := (p_session->>'local_date')::date;
  v_script_id text := nullif(p_session->>'script_id', '');
begin
  if v_user_id is null then raise exception 'not authenticated'; end if;
  if v_local_date is null then raise exception 'local_date is required'; end if;
  if v_script_id is null or v_script_id not in ('54321', 'muscle-release') then
    raise exception 'unknown script_id';
  end if;

  insert into public.daily_activity (
    user_id, activity_date, timezone, attention_session_count, qualifies_for_streak
  )
  select v_user_id, v_local_date, profiles.timezone, 1, true
  from public.profiles
  where profiles.user_id = v_user_id
  on conflict (user_id, activity_date) do update set
    attention_session_count = public.daily_activity.attention_session_count + 1,
    qualifies_for_streak = true,
    updated_at = now();
end;
$$;

revoke all on function public.record_attention_session(jsonb) from public, anon;
grant execute on function public.record_attention_session(jsonb) to authenticated;
