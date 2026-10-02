-- A guided attention Reset (5-4-3-2-1, Muscle Release) can complete a plan
-- activity. It has no session row of its own, so the completion carries the
-- script it played and is matched against the snapshot's `match.scriptId`.
-- Breathing completions are unchanged, and `script_id` is optional, so clients
-- that only send breathing keep working.

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

  return public.advance_program_day_if_ready(v_user_id, v_local_date);
end;
$$;

revoke all on function public.advance_program_day(jsonb) from public;
grant execute on function public.advance_program_day(jsonb) to authenticated;
