-- A tick can complete the final plan day before the explicit coin claim.
-- Keep the latest completed plan claimable, including retries after un-ticking
-- and returning on a later day to finish an unclaimed final step.
-- Completed plans retain their final day; only active plans show the prior day
-- after advancing. Prefer an active plan if the user has since started another.

create or replace function public.claim_plan_todo_step(p_claim jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_date_text text := p_claim->>'localDate';
  v_local_date date;
  v_enrollment public.program_enrollments%rowtype;
  v_program_day int;
  v_inserted int;
begin
  if v_user_id is null then
    raise exception 'claim_plan_todo_step requires an authenticated user';
  end if;

  if v_date_text is null or v_date_text !~ '^\d{4}-\d{2}-\d{2}$' then
    return jsonb_build_object('outcome', 'invalid_date');
  end if;

  -- The shape check passes `2026-13-40`; the cast is what rejects it.
  begin
    v_local_date := v_date_text::date;
  exception when invalid_datetime_format or datetime_field_overflow then
    return jsonb_build_object('outcome', 'invalid_date');
  end;
  if v_local_date not between date '2020-01-01' and date '2100-01-01' then
    return jsonb_build_object('outcome', 'invalid_date');
  end if;

  select * into v_enrollment
  from public.program_enrollments
  where user_id = v_user_id
    and status in ('active', 'completed')
  order by (status = 'active') desc, created_at desc
  limit 1
  for update;

  if not found then
    return jsonb_build_object('outcome', 'no_active_enrollment');
  end if;

  -- The day on the user's screen; see `record_lesson_read`.
  v_program_day := case
    when v_enrollment.status = 'active'
      and v_enrollment.last_advanced_on = v_local_date
      and v_enrollment.program_day > 1
      then v_enrollment.program_day - 1
    else v_enrollment.program_day
  end;

  if v_enrollment.todo_step_from_day is null
    or v_program_day < v_enrollment.todo_step_from_day
  then
    return jsonb_build_object(
      'outcome', 'not_required',
      'enrollmentId', v_enrollment.id,
      'programDay', v_program_day
    );
  end if;

  -- A claim already made stands even if its to-do was un-ticked since.
  if not exists (
    select 1 from public.program_action_completions done
    where done.enrollment_id = v_enrollment.id
      and done.program_day = v_program_day
      and done.activity_id = 'todo:claim'
  ) and not exists (
    select 1 from public.self_care_goal_completions
    where user_id = v_user_id and local_date = v_local_date
  ) then
    return jsonb_build_object(
      'outcome', 'no_todo_ticked',
      'enrollmentId', v_enrollment.id,
      'programDay', v_program_day
    );
  end if;

  insert into public.program_action_completions (
    enrollment_id, user_id, program_day, activity_id, activity_revision,
    local_date, breathing_session_id
  )
  values (
    v_enrollment.id, v_user_id, v_program_day, 'todo:claim', 1,
    v_local_date, null
  )
  on conflict (enrollment_id, program_day, activity_id) do nothing;

  get diagnostics v_inserted = row_count;

  return jsonb_build_object(
    'outcome', 'recorded',
    'coinsAwarded', case when v_inserted > 0 then 10 else 0 end,
    'enrollmentId', v_enrollment.id,
    'programDay', v_program_day,
    'activityId', 'todo:claim'
  );
end;
$$;

revoke all on function public.claim_plan_todo_step(jsonb) from public, anon;
grant execute on function public.claim_plan_todo_step(jsonb) to authenticated;

