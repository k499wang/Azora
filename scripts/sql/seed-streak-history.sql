-- =============================================================================
-- seed-streak-history.sql
-- Gives ONE user a synthetic run of consecutive qualifying days, so the day-2
-- (and day-N) streak flow can be tested in minutes instead of by waiting.
--
-- What it writes: public.daily_activity rows with qualifies_for_streak = true
-- for yesterday, the day before it, and so on. That table is the only input to
-- public.user_streaks_v, so the app's streak reads follow immediately.
--
-- It deliberately does NOT touch profiles.timezone. The whole point of the
-- streak fix is that this column must match the device calendar, and the app's
-- identity sync now keeps it that way. To prove that half, corrupt the column
-- on purpose (see VERIFY-TIMEZONE) and cold-restart.
--
-- Steps:
--   1. Replace <QA_EMAIL> below (every occurrence).
--   2. Set the run length in `generate_series(1, <DAYS>)`.
--   3. Run the SEED block. It ends in ROLLBACK by default, so the editor
--      prints the rows it would write without writing them.
--   4. Happy with the output? Change `rollback;` to `commit;` and re-run.
--   5. COLD RESTART the app: React Query holds the old summary for its 10 min
--      staleTime, so a warm app will not re-read the seeded rows.
--   6. Check the day-2 flow. With a 3-day seed the pill reads 3, then the
--      day's first routine to-do opens the popup at 4 and the pill follows it
--      to 4. Popup and pill must agree — a popup one ahead of a zero pill is
--      the bug this script exists to catch.
-- =============================================================================


-- ---- helper: confirm your user_id and the timezone the view will read ------
-- select u.id, u.email, p.timezone
--   from auth.users u join public.profiles p on p.user_id = u.id
--  where u.email = '<QA_EMAIL>';


-- =============================================================================
-- SEED — a run of qualifying days ending yesterday.
--   Dates come from the profile's own timezone, the same value the streak view
--   uses for "today", so the seeded run lines up with the app's calendar.
-- =============================================================================

begin;

with me as (
  select p.user_id,
         p.timezone,
         (now() at time zone p.timezone)::date as today
    from public.profiles p
    join auth.users u on u.id = p.user_id
   where u.email = '<QA_EMAIL>'
)
insert into public.daily_activity (
  user_id, activity_date, timezone, qualifies_for_streak
)
select me.user_id, me.today - g.days_ago, me.timezone, true
  from me, generate_series(1, 3) as g(days_ago)
on conflict (user_id, activity_date) do update set
  timezone = excluded.timezone,
  qualifies_for_streak = true,
  updated_at = now();

-- The rows this user now holds, newest first. Should show the seeded run with
-- qualifies_for_streak = true, ending yesterday.
select activity_date, qualifies_for_streak
  from public.daily_activity
 where user_id = (
   select p.user_id
     from public.profiles p
     join auth.users u on u.id = p.user_id
    where u.email = '<QA_EMAIL>'
 )
 order by activity_date desc
 limit 14;

-- Dry run: nothing is written until this becomes `commit;`.
rollback;
-- commit;


-- =============================================================================
-- VERIFY — what the app's streak reads will show, without opening the app.
--   A faithful copy of public.user_streaks_v with the auth.uid() filter
--   replaced by the email lookup, so the SQL editor can run it. `runs.run_end`
--   is the whole story: current_streak counts a run that ends today or
--   yesterday, and a run that ends after today counts as nothing.
-- =============================================================================

-- with me as (
--   select p.user_id, p.timezone, (now() at time zone p.timezone)::date as today
--     from public.profiles p
--     join auth.users u on u.id = p.user_id
--    where u.email = '<QA_EMAIL>'
-- ),
-- qualified as (
--   select d.user_id, d.activity_date
--     from public.daily_activity d
--     join me on me.user_id = d.user_id
--    where d.qualifies_for_streak = true
-- ),
-- with_gap as (
--   select user_id, activity_date,
--          activity_date - (row_number() over (partition by user_id order by activity_date))::int as grp
--     from qualified
-- ),
-- runs as (
--   select user_id, grp, max(activity_date) as run_end, count(*)::int as run_len
--     from with_gap group by user_id, grp
-- )
-- select me.today as today_local,
--        coalesce(max(r.run_len) filter (
--          where r.run_end = me.today or r.run_end = me.today - 1
--        ), 0) as current_streak,
--        coalesce(max(r.run_len), 0) as longest_streak,
--        max(r.run_end) as last_qualified_date
--   from me left join runs r on r.user_id = me.user_id
--  group by me.today;


-- =============================================================================
-- VERIFY-TIMEZONE — prove the profile follows the device on the next launch.
--   1. Corrupt it on purpose, the way a stale database default would:
--        update public.profiles set timezone = 'Pacific/Honolulu'
--         where user_id = '<USER_ID>'::uuid;
--   2. Cold restart the app. Identity sync runs ensureUserProfile.
--   3. Read it back. It must be your device's zone, not the corrupted one:
--        select timezone from public.profiles where user_id = '<USER_ID>'::uuid;
-- =============================================================================


-- =============================================================================
-- TEARDOWN — remove the synthetic qualifying rows.
--   Scoped to the same user and to the seeded date range. A real session on
--   one of those dates is indistinguishable from a seeded row, so only run
--   this against a QA account.
-- =============================================================================

-- begin;
-- delete from public.daily_activity
--  where user_id = (
--    select p.user_id
--      from public.profiles p
--      join auth.users u on u.id = p.user_id
--     where u.email = '<QA_EMAIL>'
--  )
--    and activity_date >= (
--      select (now() at time zone p.timezone)::date - 3
--        from public.profiles p
--        join auth.users u on u.id = p.user_id
--       where u.email = '<QA_EMAIL>'
--    )
--    and activity_date < (
--      select (now() at time zone p.timezone)::date
--        from public.profiles p
--        join auth.users u on u.id = p.user_id
--       where u.email = '<QA_EMAIL>'
--    );
-- rollback;
-- -- commit;
