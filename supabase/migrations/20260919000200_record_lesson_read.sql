-- Reading the day's lesson.
--
-- No new table. `program_action_completions` is already keyed
-- (enrollment_id, program_day, activity_id) — which is exactly "this enrollment
-- did this thing on this day of its plan", and a lesson is placed by program day
-- in the first place. A read is one row with `activity_id = 'lesson:<id>'`.
--
-- It cannot advance anybody's plan. `advance_program_day` counts what a day
-- still owes from the enrollment's frozen `resolved` snapshot, and a lesson is
-- not in that snapshot, so a row written here is invisible to it. That is the
-- property that makes reusing the table safe rather than merely convenient.
--
-- This exists as a definer function for the same reason the table has no insert
-- policy: a client that could write its own completion rows could credit itself
-- a day it never did. The function decides which day the row lands on; the
-- client is never asked, and is not believed if it says.

create or replace function public.record_lesson_read(p_read jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_lesson_id text := p_read->>'lessonId';
  -- Cast in the body, never here. A declaration that throws cannot be answered
  -- by the checks below it, so a malformed date arrived as a raw 22007 rather
  -- than as the refusal this function is written to give.
  v_revision_text text := p_read->>'revision';
  v_date_text text := p_read->>'localDate';
  v_revision int;
  v_local_date date;
  v_enrollment public.program_enrollments%rowtype;
  v_program_day int;
  v_activity_id text;
begin
  if v_user_id is null then
    raise exception 'record_lesson_read requires an authenticated user';
  end if;

  -- Catalogue ids look like `sleep.caffeine`. Checked rather than trusted: the
  -- id becomes a primary key value, and an id shaped like anything else is a
  -- row nothing will ever look for again.
  if v_lesson_id is null or v_lesson_id !~ '^[a-z]+\.[a-z]+$' then
    return jsonb_build_object('outcome', 'invalid_lesson');
  end if;

  -- Shape first, then value. `::date` on anything else raises, and a raise here
  -- reaches the client as a failure rather than as an answer.
  if v_date_text is null or v_date_text !~ '^\d{4}-\d{2}-\d{2}$' then
    return jsonb_build_object('outcome', 'invalid_date');
  end if;

  v_local_date := v_date_text::date;
  if v_local_date not between date '2020-01-01' and date '2100-01-01' then
    return jsonb_build_object('outcome', 'invalid_date');
  end if;

  -- A revision this build cannot express is a client we do not understand.
  v_revision := case
    when v_revision_text ~ '^\d+$' then v_revision_text::int
    else 1
  end;

  -- Locked for the same reason `advance_program_day` locks it: two devices
  -- must not read the day number either side of an advance and write the row
  -- against different days.
  select * into v_enrollment
  from public.program_enrollments
  where user_id = v_user_id and status = 'active'
  for update;

  if not found then
    return jsonb_build_object('outcome', 'no_active_enrollment');
  end if;

  -- The day on the user's screen, which is not always the day the enrollment
  -- has moved to. Finishing the last exercise advances `program_day`
  -- immediately, while Home keeps drawing the day just finished until midnight.
  -- The client's `programDayForDate` applies this same rule; a lesson read
  -- against tomorrow would tick nothing on the screen it was read from.
  v_program_day := case
    when v_enrollment.last_advanced_on = v_local_date and v_enrollment.program_day > 1
      then v_enrollment.program_day - 1
    else v_enrollment.program_day
  end;

  v_activity_id := 'lesson:' || v_lesson_id;

  insert into public.program_action_completions (
    enrollment_id, user_id, program_day, activity_id, activity_revision,
    local_date, breathing_session_id
  )
  values (
    v_enrollment.id, v_user_id, v_program_day, v_activity_id, v_revision,
    v_local_date, null
  )
  -- Read twice, or read on two devices. The row is the same row.
  on conflict (enrollment_id, program_day, activity_id) do nothing;

  return jsonb_build_object(
    'outcome', 'recorded',
    'enrollmentId', v_enrollment.id,
    'programDay', v_program_day,
    'activityId', v_activity_id
  );
end;
$$;

revoke all on function public.record_lesson_read(jsonb) from public;
grant execute on function public.record_lesson_read(jsonb) to authenticated;
