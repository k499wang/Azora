-- Accounts can use old and new app versions on different devices. Older
-- versions have no required to-do row and may have no routine goals at all.
-- Keep the shipped advancement rule (Resets, lesson and check-in) for every
-- enrollment, including ones already adopted by a newer build. The explicit
-- to-do claim still gates room rewards in the new UI and pays its own coins.
-- Replacing the function retains the restricted grants from migration 003.

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

-- New clients opt in only through this name, so deploying only migrations
-- 001-004 cannot make them impose the incompatible advancement gate.
create or replace function public.adopt_plan_todo_step_compatible()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.adopt_plan_todo_step();
$$;

revoke all on function public.adopt_plan_todo_step_compatible() from public, anon;
grant execute on function public.adopt_plan_todo_step_compatible() to authenticated;
