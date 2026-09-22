-- A plan day is complete only when its exercises, scheduled lesson, and a
-- check-in have all landed. The check is server-owned because any of the three
-- actions may be the last one, and clients cannot be trusted to advance a day.

create or replace function public.advance_program_day_if_ready(
  p_user_id uuid,
  p_local_date date
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enrollment public.program_enrollments%rowtype;
  v_day jsonb;
  v_expected_lesson_id text;
  v_remaining int := 0;
  v_next_day int;
  v_next_status text;
  v_outcome text;
begin
  select * into v_enrollment
  from public.program_enrollments
  where user_id = p_user_id and status = 'active'
  for update;

  if not found then
    return jsonb_build_object('outcome', 'no_active_enrollment');
  end if;

  if v_enrollment.last_advanced_on = p_local_date then
    return jsonb_build_object(
      'outcome', 'already_advanced_today',
      'enrollment', public.program_enrollment_json(v_enrollment)
    );
  end if;

  select day into v_day
  from jsonb_array_elements(v_enrollment.resolved->'days') as day
  where (day->>'day')::int = v_enrollment.program_day
  limit 1;

  if v_day is null then
    return jsonb_build_object(
      'outcome', 'no_current_day',
      'enrollment', public.program_enrollment_json(v_enrollment)
    );
  end if;

  select count(*) into v_remaining
  from jsonb_array_elements(v_day->'activities') as activity
  where not exists (
    select 1 from public.program_action_completions done
    where done.enrollment_id = v_enrollment.id
      and done.program_day = v_enrollment.program_day
      and done.activity_id = activity->>'activityId'
  );

  v_expected_lesson_id := nullif(v_day->>'lessonActivityId', '');
  if v_expected_lesson_id is null then
    -- Older snapshots did not store the exact lesson id. Their lesson writer
    -- still records a lesson completion against the right plan day, so require
    -- that rather than treating an older enrollment as a different product.
    if not exists (
      select 1 from public.program_action_completions done
      where done.enrollment_id = v_enrollment.id
        and done.program_day = v_enrollment.program_day
        and done.activity_id like 'lesson:%'
    ) then
      v_remaining := v_remaining + 1;
    end if;
  elsif not exists (
    select 1 from public.program_action_completions done
    where done.enrollment_id = v_enrollment.id
      and done.program_day = v_enrollment.program_day
      and done.activity_id = v_expected_lesson_id
  ) then
    v_remaining := v_remaining + 1;
  end if;

  -- Mood belongs to the day the final action occurs. Returning to a partly
  -- finished plan tomorrow therefore asks for tomorrow's check-in too.
  if not exists (
    select 1 from public.mood_check_ins
    where user_id = p_user_id and local_date = p_local_date
  ) then
    v_remaining := v_remaining + 1;
  end if;

  if v_remaining > 0 then
    return jsonb_build_object(
      'outcome', 'recorded',
      'remaining', v_remaining,
      'enrollment', public.program_enrollment_json(v_enrollment)
    );
  end if;

  if v_enrollment.program_day >= jsonb_array_length(v_enrollment.resolved->'days') then
    v_next_day := v_enrollment.program_day;
    v_next_status := 'completed';
    v_outcome := 'completed';
  else
    v_next_day := v_enrollment.program_day + 1;
    v_next_status := 'active';
    v_outcome := 'advanced';
  end if;

  update public.program_enrollments
  set program_day = v_next_day,
      last_advanced_on = p_local_date,
      status = v_next_status
  where id = v_enrollment.id
  returning * into v_enrollment;

  return jsonb_build_object(
    'outcome', v_outcome,
    'enrollment', public.program_enrollment_json(v_enrollment)
  );
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
    and v_modality = 'breathing'
    and v_technique_id is not null
    and activity->'match'->>'techniqueId' = v_technique_id
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
    v_activity_id, v_activity_revision, v_local_date, v_session_id
  ) on conflict (enrollment_id, program_day, activity_id) do nothing;

  return public.advance_program_day_if_ready(v_user_id, v_local_date);
end;
$$;

create or replace function public.advance_plan_after_mood_check_in()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.advance_program_day_if_ready(new.user_id, new.local_date);
  return new;
end;
$$;

drop trigger if exists mood_check_in_plan_completion on public.mood_check_ins;
create trigger mood_check_in_plan_completion
after insert or update on public.mood_check_ins
for each row execute function public.advance_plan_after_mood_check_in();

create or replace function public.validate_plan_lesson_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expected_lesson_id text;
begin
  if new.activity_id not like 'lesson:%' then return new; end if;

  select nullif(day->>'lessonActivityId', '') into v_expected_lesson_id
  from public.program_enrollments enrollment,
       jsonb_array_elements(enrollment.resolved->'days') as day
  where enrollment.id = new.enrollment_id
    and (day->>'day')::int = new.program_day
  limit 1;

  if v_expected_lesson_id is not null and new.activity_id <> v_expected_lesson_id then
    raise exception 'lesson does not match this plan day';
  end if;
  return new;
end;
$$;

create or replace function public.advance_plan_after_lesson_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.activity_id like 'lesson:%' then
    perform public.advance_program_day_if_ready(new.user_id, new.local_date);
  end if;
  return new;
end;
$$;

drop trigger if exists program_action_completions_validate_lesson on public.program_action_completions;
create trigger program_action_completions_validate_lesson
before insert on public.program_action_completions
for each row execute function public.validate_plan_lesson_completion();

drop trigger if exists program_action_completions_plan_completion on public.program_action_completions;
create trigger program_action_completions_plan_completion
after insert on public.program_action_completions
for each row execute function public.advance_plan_after_lesson_completion();

revoke all on function public.advance_program_day_if_ready(uuid, date) from public;
grant execute on function public.advance_program_day_if_ready(uuid, date) to authenticated;
