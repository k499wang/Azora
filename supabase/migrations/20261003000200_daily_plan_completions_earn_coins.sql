-- Reward the enrolled plan's exercises/lessons and the daily mood check-in.
-- Insert-only triggers rely on the completion primary key and the check-in's
-- (user_id, local_date) uniqueness: retries/edits never pay twice.
-- Existing completions and wallet history are intentionally unchanged.
create or replace function public.grant_coins_for_daily_plan_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.wallet_entries (user_id, delta, reason, local_date)
  values (
    new.user_id,
    20,
    case when tg_table_name = 'mood_check_ins'
      then 'daily_mood_complete' else 'daily_plan_activity_complete' end,
    new.local_date
  );
  return new;
end;
$$;

create trigger program_action_completions_earn_coins
  after insert on public.program_action_completions
  for each row execute function public.grant_coins_for_daily_plan_completion();

create trigger mood_check_ins_earn_coins
  after insert on public.mood_check_ins
  for each row execute function public.grant_coins_for_daily_plan_completion();

-- Return the amount this read actually earned, including zero on retries.
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
  v_inserted int;
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

  get diagnostics v_inserted = row_count;

  return jsonb_build_object(
    'coinsAwarded', case when v_inserted > 0 then 20 else 0 end,
    'outcome', 'recorded',
    'enrollmentId', v_enrollment.id,
    'programDay', v_program_day,
    'activityId', v_activity_id
  );
end;
$$;

revoke all on function public.record_lesson_read(jsonb) from public;
grant execute on function public.record_lesson_read(jsonb) to authenticated;

-- Confirm the actual grant instead of making clients infer it from progress.
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
  v_inserted int;
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

  get diagnostics v_inserted = row_count;
  return public.advance_program_day_if_ready(v_user_id, v_local_date) ||
    jsonb_build_object('coinsAwarded', case when v_inserted > 0 then 20 else 0 end);
end;
$$;

revoke all on function public.advance_program_day(jsonb) from public;
grant execute on function public.advance_program_day(jsonb) to authenticated;
