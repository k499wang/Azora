-- "Do a to-do": one claimed routine to-do joins the steps a plan day asks for.
--
-- Opt-in per enrollment, so a build that cannot show the step never leaves a
-- user on a day it cannot finish. `todo_step_from_day` is null until a build
-- that draws the step adopts the enrollment (new enrollments insert 1), and the
-- step is required only from that day on.
--
-- The claim, not the tick, is the completion. It is stored as a
-- `program_action_completions` row (`activity_id = 'todo:claim'`), so
-- un-ticking the to-do afterwards does not undo the day.

alter table public.program_enrollments
  add column todo_step_from_day int
  constraint program_enrollments_todo_step_from_day_positive
  check (todo_step_from_day >= 1);

create or replace function public.program_enrollment_json(
  p_row public.program_enrollments
)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select jsonb_build_object(
    'id', p_row.id,
    'plan_id', p_row.plan_id,
    'preset_revision', p_row.preset_revision,
    'resolver_version', p_row.resolver_version,
    'enrolled_on', p_row.enrolled_on,
    'program_day', p_row.program_day,
    'last_advanced_on', p_row.last_advanced_on,
    'status', p_row.status,
    'resolved', p_row.resolved,
    'todo_step_from_day', p_row.todo_step_from_day
  );
$$;

-- Clients may update only `status` on this table, so adoption goes through here.
-- Idempotent: an enrollment already adopted keeps the day it was adopted on.
create or replace function public.adopt_plan_todo_step()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_enrollment public.program_enrollments%rowtype;
begin
  if v_user_id is null then
    raise exception 'adopt_plan_todo_step requires an authenticated user';
  end if;

  update public.program_enrollments
  set todo_step_from_day = program_day
  where user_id = v_user_id
    and status = 'active'
    and todo_step_from_day is null
  returning * into v_enrollment;

  if not found then
    select * into v_enrollment
    from public.program_enrollments
    where user_id = v_user_id and status = 'active';
    if not found then return null; end if;
  end if;

  return public.program_enrollment_json(v_enrollment);
end;
$$;

revoke all on function public.adopt_plan_todo_step() from public, anon;
grant execute on function public.adopt_plan_todo_step() to authenticated;

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

  if v_enrollment.todo_step_from_day is not null
    and v_enrollment.program_day >= v_enrollment.todo_step_from_day
    and not exists (
      select 1 from public.program_action_completions done
      where done.enrollment_id = v_enrollment.id
        and done.program_day = v_enrollment.program_day
        and done.activity_id = 'todo:claim'
    )
  then
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

-- Mirrors `record_lesson_read`: the server picks the day, the client's day
-- number is never sent. Claiming twice, or on two devices, is the same row.
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
  where user_id = v_user_id and status = 'active'
  for update;

  if not found then
    return jsonb_build_object('outcome', 'no_active_enrollment');
  end if;

  -- The day on the user's screen; see `record_lesson_read`.
  v_program_day := case
    when v_enrollment.last_advanced_on = v_local_date and v_enrollment.program_day > 1
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

-- The claim can be the last step of a day, like a lesson read.
create or replace function public.advance_plan_after_lesson_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.activity_id like 'lesson:%' or new.activity_id = 'todo:claim' then
    perform public.advance_program_day_if_ready(new.user_id, new.local_date);
  end if;
  return new;
end;
$$;

-- The tick already paid its own coins; the claim pays the step's 10.
create or replace function public.grant_coins_for_daily_plan_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_activity_id text := to_jsonb(new)->>'activity_id';
begin
  insert into public.wallet_entries (user_id, delta, reason, local_date)
  values (
    new.user_id,
    case
      when tg_table_name = 'mood_check_ins' then 10
      -- Read through jsonb: `mood_check_ins` has no activity_id column, and a
      -- direct field reference fails on that table even in an untaken branch.
      when v_activity_id like 'lesson:%' then 10
      when v_activity_id = 'todo:claim' then 10
      else 20
    end,
    case
      when tg_table_name = 'mood_check_ins' then 'daily_mood_complete'
      when v_activity_id = 'todo:claim' then 'daily_plan_todo_claim'
      else 'daily_plan_activity_complete'
    end,
    new.local_date
  );
  return new;
end;
$$;
