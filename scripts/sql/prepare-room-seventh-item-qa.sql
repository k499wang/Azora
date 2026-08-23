-- =============================================================================
-- prepare-room-seventh-item-qa.sql
-- Prepares ONE dedicated QA account at room progress 6/7 so the production
-- app can exercise the real final-daily -> seventh-item -> completed-room ->
-- next-room -> Hotel flow.
--
-- This is an operational fixture, not a migration. Run it only from the
-- Supabase SQL editor with a dedicated QA account that has completed onboarding.
-- It deliberately does not seed daily completion: complete the three real
-- dailies in the app so the production reward path is part of the test.
--
-- Before running:
--   1. Force-quit the app so it cannot write room data during setup.
--   2. Set v_email, v_expected_user_id, and v_device_timezone below.
--      The timezone must match the test device's current IANA timezone.
--   3. Run with ROLLBACK first and review the NOTICE output.
--   4. Change the final ROLLBACK to COMMIT and run again to apply the fixture.
--   5. Relaunch the app so its five-minute React Query cache cannot hide it.
--
-- Safety:
--   - email and UUID must resolve to the same auth user
--   - the user must have a profile with completed onboarding
--   - any existing room or decoration history aborts the transaction
--   - any breathing or breath-hold completion on the test device's local date
--     aborts the transaction, preserving the real first/second/third unlock
--   - verification failures abort the transaction
-- =============================================================================

begin;

do $fixture$
declare
  -- Replace all three values before running.
  v_email text := '<QA_EMAIL>';
  v_expected_user_id uuid := null;
  v_device_timezone text := 'America/Toronto';

  v_user_id uuid;
  v_room_id uuid := extensions.gen_random_uuid();
  v_today date;
  v_decoration_count bigint;
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

  if exists (
    select 1
      from public.breathing_sessions
     where user_id = v_user_id
       and local_date = v_today
  ) then
    raise exception
      'User % already has a breathing session on %; use a clean QA day/account',
      v_user_id,
      v_today;
  end if;

  if exists (
    select 1
      from public.breath_hold_sessions
     where user_id = v_user_id
       and local_date = v_today
  ) then
    raise exception
      'User % already has a breath-hold session on %; use a clean QA day/account',
      v_user_id,
      v_today;
  end if;

  if exists (
    select 1
      from public.daily_activity
     where user_id = v_user_id
       and activity_date = v_today
       and daily_breath_hold_completed = true
  ) then
    raise exception
      'User % already completed the daily breath hold on %; use a clean QA day/account',
      v_user_id,
      v_today;
  end if;

  if exists (
    select 1
      from public.rooms
     where user_id = v_user_id
  ) or exists (
    select 1
      from public.room_decorations
     where user_id = v_user_id
  ) then
    raise exception
      'User % already has room history; refusing to overwrite it',
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

  raise notice 'QA room fixture verified';
  raise notice 'email: %', v_email;
  raise notice 'user_id: %', v_user_id;
  raise notice 'room_id: %', v_room_id;
  raise notice 'device-local today: % (%)', v_today, v_device_timezone;
  raise notice 'progress: 6/7; next slot: day7; last earned: %',
    v_last_earned_local_date;
end
$fixture$;

-- Dry-run default. Review the NOTICE output above, then change this to COMMIT
-- and rerun the whole transaction when the target and state are correct.
rollback;
-- commit;


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
-- Cleanup removes every room belonging to this dedicated QA account. Its
-- decorations are removed by ON DELETE CASCADE; profile and daily/session data
-- are preserved. Do not use this against a real account with room history.
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
--   raise notice 'Deleted % QA rooms for % (%)',
--     v_deleted_rooms,
--     v_email,
--     v_user_id;
-- end
-- $cleanup$;
--
-- rollback;
-- -- commit;
