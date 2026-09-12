-- =============================================================================
-- prepare-room-seventh-item-qa.sql
-- Prepares ONE explicitly selected account at room progress 6/7 so the production
-- app can exercise the real final-daily -> seventh-item -> completed-room ->
-- next-room -> Hotel flow.
--
-- This is an operational fixture, not a migration. Run it only from the
-- Supabase SQL editor with an account that has completed onboarding. Reset mode
-- deletes that account's entire hotel and today's breathing/breath-hold history.
--
-- It then seeds today's three exercises as done and clears today's to-do ticks,
-- so the only thing left is the to-do list. Ticking it off in the app runs the
-- real earn path — the same `allCompleted` rule, the same claim, the same write
-- — without three real sessions per attempt. The exercises are the only part of
-- the day that costs real time, so they are the only part seeded.
--
-- Exercises are seeded for every active technique in the catalog rather than
-- for two chosen ids, because which two count is decided in the app from the
-- day's recommendation and plan. Seeding all of them makes whichever pair it
-- picks already complete.
--
-- Before running:
--   1. Force-quit the app so it cannot write room data during setup.
--   2. Set v_email, v_expected_user_id, and v_device_timezone below, then set
--      v_allow_destructive_reset to true after reviewing its deletion scope.
--      The timezone must match the test device's current IANA timezone.
--   3. Run with ROLLBACK first and review the NOTICE output.
--   4. Change the final ROLLBACK to COMMIT and run again to apply the fixture.
--   5. Relaunch the app so its five-minute React Query cache cannot hide it.
--
-- Safety:
--   - email and UUID must resolve to the same auth user
--   - the user must have a profile with completed onboarding
--   - destructive reset must be explicitly enabled
--   - only the selected user's hotel and device-local-date breathing and
--     breath-hold state are reset; older exercise history is preserved
--   - today's standalone heart-rate sessions and counters are preserved
--   - verification failures abort the transaction
-- =============================================================================

begin;

do $fixture$
declare
  -- Replace the first three values, then explicitly enable the reset.
  v_email text := '<QA_EMAIL>';
  v_expected_user_id uuid := null;
  v_device_timezone text := 'America/Toronto';
  v_allow_destructive_reset boolean := false;

  v_user_id uuid;
  v_room_id uuid := extensions.gen_random_uuid();
  v_today date;
  v_deleted_rooms bigint;
  v_deleted_breathing_sessions bigint;
  v_deleted_breath_hold_sessions bigint;
  v_reset_daily_activity_rows bigint;
  v_decoration_count bigint;
  v_seeded_breathing_sessions bigint;
  v_active_todos bigint;
  v_cleared_todo_ticks bigint;
  v_slots text[];
  v_last_earned_local_date date;
begin
  if v_email = '<QA_EMAIL>' or v_expected_user_id is null then
    raise exception 'Set both v_email and v_expected_user_id before running';
  end if;

  select users.id
    into v_user_id
    from auth.users as users
   where lower(users.email) = lower(v_email);

  if v_user_id is null then
    raise exception 'No auth user found for email %', v_email;
  end if;

  if v_user_id <> v_expected_user_id then
    raise exception
      'Email/UUID mismatch for %. Resolved %, expected %',
      v_email,
      v_user_id,
      v_expected_user_id;
  end if;

  if not exists (
    select 1
      from public.profiles
     where user_id = v_user_id
  ) then
    raise exception
      'User % has no profile; finish account setup before preparing the fixture',
      v_user_id;
  end if;

  if not exists (
    select 1
      from public.profiles
     where user_id = v_user_id
       and onboarding_completed_at is not null
  ) then
    raise exception
      'User % has not completed onboarding; finish it before preparing the fixture',
      v_user_id;
  end if;

  -- PostgreSQL validates the IANA timezone here. The app uses the device's
  -- local date, so the fixture must use the same timezone rather than UTC or
  -- the profile's possibly stale timezone.
  v_today := (now() at time zone v_device_timezone)::date;

  if not v_allow_destructive_reset then
    raise exception
      'Reset is destructive. Review the header, then set v_allow_destructive_reset to true';
  end if;

  -- The room reset is intentionally account-wide: the fixture must own floor 1
  -- and room deletion cascades to its decorations. Exercise reset is limited to
  -- the device-local test date so older breathing history remains intact.
  delete from public.rooms
   where user_id = v_user_id;

  get diagnostics v_deleted_rooms = row_count;

  delete from public.breathing_sessions
   where user_id = v_user_id
     and local_date = v_today;

  get diagnostics v_deleted_breathing_sessions = row_count;

  delete from public.breath_hold_sessions
   where user_id = v_user_id
     and local_date = v_today;

  get diagnostics v_deleted_breath_hold_sessions = row_count;

  -- Breath-hold deletion has a recompute trigger, but breathing deletion does
  -- not. Reset both aggregates explicitly after deleting both session types.
  -- Heart-rate counters, XP, and the rest of the row remain untouched.
  update public.daily_activity
     set daily_breath_hold_completed = false,
         breath_hold_count = 0,
         best_hold_seconds = null,
         breathing_session_count = 0,
         breathing_seconds = 0,
         qualifies_for_streak = false,
         updated_at = now()
   where user_id = v_user_id
     and activity_date = v_today;

  get diagnostics v_reset_daily_activity_rows = row_count;

  if exists (
    select 1 from public.rooms where user_id = v_user_id
  ) or exists (
    select 1 from public.room_decorations where user_id = v_user_id
  ) or exists (
    select 1
      from public.breathing_sessions
     where user_id = v_user_id
       and local_date = v_today
  ) or exists (
    select 1
      from public.breath_hold_sessions
     where user_id = v_user_id
       and local_date = v_today
  ) or exists (
    select 1
      from public.daily_activity
     where user_id = v_user_id
       and activity_date = v_today
       and (
         daily_breath_hold_completed
         or breath_hold_count <> 0
         or best_hold_seconds is not null
         or breathing_session_count <> 0
         or breathing_seconds <> 0
         or qualifies_for_streak
       )
  ) then
    raise exception 'Destructive reset verification failed for user %', v_user_id;
  end if;

  -- Today's exercises, as the app's own RPCs would have written them: one
  -- completed session per active technique, one breath hold, and the same
  -- daily_activity aggregates both of those maintain.
  insert into public.breathing_sessions (
    user_id,
    technique_id,
    started_at,
    ended_at,
    local_date,
    timezone,
    duration_seconds,
    completed
  )
  select
    v_user_id,
    catalog.id,
    now() - interval '10 minutes',
    now() - interval '5 minutes',
    v_today,
    v_device_timezone,
    300,
    true
  from public.breathing_technique_catalog as catalog
  where catalog.active = true;

  get diagnostics v_seeded_breathing_sessions = row_count;

  insert into public.breath_hold_sessions (
    user_id,
    started_at,
    ended_at,
    local_date,
    timezone,
    hold_seconds
  )
  values (
    v_user_id,
    now() - interval '4 minutes',
    now() - interval '3 minutes',
    v_today,
    v_device_timezone,
    45
  );

  insert into public.daily_activity (
    user_id,
    activity_date,
    timezone,
    breathing_session_count,
    breathing_seconds,
    daily_breath_hold_completed,
    breath_hold_count,
    best_hold_seconds,
    qualifies_for_streak
  )
  values (
    v_user_id,
    v_today,
    v_device_timezone,
    v_seeded_breathing_sessions,
    v_seeded_breathing_sessions * 300,
    true,
    1,
    45,
    true
  )
  on conflict (user_id, activity_date) do update set
    timezone = excluded.timezone,
    breathing_session_count = excluded.breathing_session_count,
    breathing_seconds = excluded.breathing_seconds,
    daily_breath_hold_completed = true,
    breath_hold_count = 1,
    best_hold_seconds = 45,
    qualifies_for_streak = true,
    updated_at = now();

  -- The to-dos are left for the tester.
  --
  -- Only today's ticks are cleared, so the list starts the day untouched; the
  -- goals themselves are the account's own and are never touched. Ticking them
  -- off is quick, and it is the part of the day worth doing by hand — it is the
  -- real earn path, and the exercises are the only part that costs real time.
  delete from public.self_care_goal_completions
   where user_id = v_user_id
     and local_date = v_today;

  get diagnostics v_cleared_todo_ticks = row_count;

  select count(*)
    into v_active_todos
    from public.self_care_goals
   where user_id = v_user_id
     and archived_at is null;

  if v_active_todos = 0 then
    raise exception
      'User % has no to-dos; the day would already be complete on the seeded exercises and the piece would arrive unprompted. Add one in the app first',
      v_user_id;
  end if;

  insert into public.rooms (
    id,
    user_id,
    floor,
    shell,
    frame_hue
  )
  values (
    v_room_id,
    v_user_id,
    1,
    'cream',
    'sky'
  );

  -- These option ids are real authored options for their corresponding slots.
  -- Keeping the latest earn on yesterday makes today's seventh item claimable
  -- after the QA account completes its three real dailies.
  insert into public.room_decorations (
    user_id,
    room_id,
    slot,
    option_id,
    earned_local_date
  )
  values
    (v_user_id, v_room_id, 'day1', 'checker_rug',   v_today - 6),
    (v_user_id, v_room_id, 'day2', 'study_desk',   v_today - 5),
    (v_user_id, v_room_id, 'day3', 'bookcase',     v_today - 4),
    (v_user_id, v_room_id, 'day4', 'monstera',     v_today - 3),
    (v_user_id, v_room_id, 'day5', 'gallery_wall', v_today - 2),
    (v_user_id, v_room_id, 'day6', 'day_window',   v_today - 1);

  select
    count(*),
    array_agg(slot order by slot),
    max(earned_local_date)
  into
    v_decoration_count,
    v_slots,
    v_last_earned_local_date
  from public.room_decorations
  where user_id = v_user_id
    and room_id = v_room_id;

  if v_decoration_count <> 6
     or v_slots <> array['day1', 'day2', 'day3', 'day4', 'day5', 'day6']
     or v_last_earned_local_date <> v_today - 1 then
    raise exception
      'Fixture verification failed: count %, slots %, last earned %',
      v_decoration_count,
      v_slots,
      v_last_earned_local_date;
  end if;

  if not exists (
    select 1
      from public.daily_activity
     where user_id = v_user_id
       and activity_date = v_today
       and daily_breath_hold_completed
  ) or v_seeded_breathing_sessions = 0 or (
    select count(*)
      from public.self_care_goal_completions
     where user_id = v_user_id
       and local_date = v_today
  ) <> 0 then
    raise exception
      'Seeded-day verification failed for user %: breathing %, the breath hold, or the to-do ticks are not as expected',
      v_user_id,
      v_seeded_breathing_sessions;
  end if;

  raise notice 'Room fixture reset and verified';
  raise notice 'email: %', v_email;
  raise notice 'user_id: %', v_user_id;
  raise notice 'room_id: %', v_room_id;
  raise notice 'device-local today: % (%)', v_today, v_device_timezone;
  raise notice
    'reset: % rooms, % breathing sessions today, % breath-hold sessions today, % daily activity rows',
    v_deleted_rooms,
    v_deleted_breathing_sessions,
    v_deleted_breath_hold_sessions,
    v_reset_daily_activity_rows;
  raise notice
    'seeded today: % breathing sessions, 1 breath hold; to-dos: % ticks cleared, % left to do',
    v_seeded_breathing_sessions,
    v_cleared_todo_ticks,
    v_active_todos;
  raise notice 'progress: 6/7; next slot: day7; last earned: %',
    v_last_earned_local_date;
  raise notice 'to finish: tick off the % to-do(s) in the app', v_active_todos;
end
$fixture$;

-- Dry-run default. Review the NOTICE output above, then change this to COMMIT
-- and rerun the whole transaction when the target and state are correct.
rollback;
-- commit;


-- =============================================================================
-- WHY ARE TODAY'S DAILIES STILL UNCHECKED?
--
-- Run this after committing the fixture. It reports what the app looks for,
-- from the same angle the app looks at it. Set both values first.
--
-- Reading it:
--   · seeded_for is the date the rows carry. The app asks for its own device
--     date. If these differ, v_device_timezone did not match the device and
--     nothing the app asks for exists.
--   · completed_breathing_sessions is what makes the two breathing dailies tick.
--     Zero means the fixture did not commit — the script ends in ROLLBACK by
--     default, and a dry run reports success and writes nothing.
--   · breath_hold_done is the third daily, read straight off daily_activity.
--   · If all three look right and the app still shows them unchecked, it is the
--     five-minute query cache: force-quit and relaunch, do not just background.
-- =============================================================================

-- do $diagnose$
-- declare
--   v_email text := '<QA_EMAIL>';
--   v_device_timezone text := 'America/Toronto';
--   v_user_id uuid;
--   v_today date;
--   v_sessions bigint;
--   v_techniques text[];
--   v_hold boolean;
--   v_todos_open bigint;
--   v_decorations bigint;
-- begin
--   select users.id into v_user_id
--     from auth.users as users
--    where lower(users.email) = lower(v_email);
--
--   if v_user_id is null then
--     raise exception 'No auth user found for email %', v_email;
--   end if;
--
--   v_today := (now() at time zone v_device_timezone)::date;
--
--   select count(*), array_agg(technique_id order by technique_id)
--     into v_sessions, v_techniques
--     from public.breathing_sessions
--    where user_id = v_user_id
--      and local_date = v_today
--      and completed = true;
--
--   select coalesce(bool_or(daily_breath_hold_completed), false)
--     into v_hold
--     from public.daily_activity
--    where user_id = v_user_id
--      and activity_date = v_today;
--
--   select count(*)
--     into v_todos_open
--     from public.self_care_goals as goals
--    where goals.user_id = v_user_id
--      and goals.archived_at is null
--      and not exists (
--        select 1
--          from public.self_care_goal_completions as ticks
--         where ticks.goal_id = goals.id
--           and ticks.local_date = v_today
--      );
--
--   select count(*)
--     into v_decorations
--     from public.room_decorations
--    where user_id = v_user_id;
--
--   raise notice 'user: %', v_user_id;
--   raise notice 'seeded_for: % (timezone %)', v_today, v_device_timezone;
--   raise notice 'utc date now: %', (now() at time zone 'UTC')::date;
--   raise notice 'completed_breathing_sessions: % %', v_sessions, v_techniques;
--   raise notice 'breath_hold_done: %', v_hold;
--   raise notice 'decorations placed: % (want 6)', v_decorations;
--   raise notice 'to-dos still open: %', v_todos_open;
-- end
-- $diagnose$;

-- =============================================================================
-- POST-TEST VERIFICATION
--
-- Replace <QA_USER_ID>, then run this query after completing the app flow.
-- Expected:
--   - floor 1 has 7 decorations
--   - floor 2 has 0 decorations and the shell/frame selected in NextRoom
--   - no floor appears more than once
-- =============================================================================

-- select
--   rooms.floor,
--   rooms.shell,
--   rooms.frame_hue,
--   count(decorations.id) as decoration_count,
--   coalesce(
--     array_agg(decorations.slot order by decorations.slot)
--       filter (where decorations.id is not null),
--     '{}'::text[]
--   ) as slots,
--   max(decorations.earned_local_date) as last_earned_local_date
-- from public.rooms as rooms
-- left join public.room_decorations as decorations
--   on decorations.room_id = rooms.id
-- where rooms.user_id = '<QA_USER_ID>'::uuid
-- group by rooms.id, rooms.floor, rooms.shell, rooms.frame_hue
-- order by rooms.floor;

-- select floor, count(*) as rooms_on_floor
-- from public.rooms
-- where user_id = '<QA_USER_ID>'::uuid
-- group by floor
-- having count(*) > 1;


-- =============================================================================
-- CLEANUP
--
-- Cleanup removes every room belonging to the explicitly selected account. Its
-- decorations are removed by ON DELETE CASCADE; profile and daily/session data
-- are preserved. Use the same care as the reset above: this erases hotel history.
--
-- Copy this block into a new SQL-editor query, set both target values, and run
-- it with ROLLBACK first. Change ROLLBACK to COMMIT only after reviewing the
-- NOTICE. Keeping cleanup commented prevents it from running with setup.
-- =============================================================================

-- begin;
--
-- do $cleanup$
-- declare
--   v_email text := '<QA_EMAIL>';
--   v_expected_user_id uuid := null;
--   v_user_id uuid;
--   v_deleted_rooms bigint;
-- begin
--   if v_email = '<QA_EMAIL>' or v_expected_user_id is null then
--     raise exception 'Set both v_email and v_expected_user_id before running';
--   end if;
--
--   select users.id
--     into v_user_id
--     from auth.users as users
--    where lower(users.email) = lower(v_email);
--
--   if v_user_id is null then
--     raise exception 'No auth user found for email %', v_email;
--   end if;
--
--   if v_user_id <> v_expected_user_id then
--     raise exception
--       'Email/UUID mismatch for %. Resolved %, expected %',
--       v_email,
--       v_user_id,
--       v_expected_user_id;
--   end if;
--
--   delete from public.rooms
--    where user_id = v_user_id;
--
--   get diagnostics v_deleted_rooms = row_count;
--
--   raise notice 'Deleted % rooms for % (%)',
--     v_deleted_rooms,
--     v_email,
--     v_user_id;
-- end
-- $cleanup$;
--
-- rollback;
-- -- commit;
