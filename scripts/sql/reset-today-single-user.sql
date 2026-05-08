-- =============================================================================
-- reset-today-single-user.sql
-- Wipes ONE user's today: heart-rate sessions, breath-hold sessions, BPM/IBI
-- samples, and the daily_activity counter row. Use this to re-test the free
-- paywall gate.
--
-- Steps:
--   1. Find your user_id (helper query below).
--   2. Replace BOTH occurrences of <USER_ID> in the transaction below.
--   3. Adjust the timezone literal if you're not in 'America/Toronto'.
--   4. Run the BEGIN..COMMIT block in the Supabase SQL editor.
--
-- After running:
--   The app's React Query cache still holds the old count for ~staleTime.
--   Kill+relaunch the app, or pull-to-refresh Home, before re-testing.
-- =============================================================================


-- ---- helper: confirm your user_id (run separately, copy the UUID) -----------
-- select id, email from auth.users where email = 'k3vinwvng@gmail.com';


-- =============================================================================
-- WIPE
--   In Postgres a CTE only scopes to its own statement, so each DELETE
--   re-derives "today" and the per-table session-id sets inline.
-- =============================================================================

begin;

-- 1. IBI samples linked to today's HR sessions
delete from heart_rate_ibi_samples
 where heart_rate_session_id in (
   select id from heart_rate_sessions
    where user_id = '<USER_ID>'::uuid
      and local_date = (now() at time zone 'America/Toronto')::date
 );

-- 2. IBI samples linked to today's breath-hold sessions
delete from heart_rate_ibi_samples
 where breath_hold_session_id in (
   select id from breath_hold_sessions
    where user_id = '<USER_ID>'::uuid
      and local_date = (now() at time zone 'America/Toronto')::date
 );

-- 3. BPM samples for today's HR sessions
delete from heart_rate_samples
 where heart_rate_session_id in (
   select id from heart_rate_sessions
    where user_id = '<USER_ID>'::uuid
      and local_date = (now() at time zone 'America/Toronto')::date
 );

-- 4. Today's HR session rows
delete from heart_rate_sessions
 where user_id = '<USER_ID>'::uuid
   and local_date = (now() at time zone 'America/Toronto')::date;

-- 5. Today's breath-hold session rows
delete from breath_hold_sessions
 where user_id = '<USER_ID>'::uuid
   and local_date = (now() at time zone 'America/Toronto')::date;

-- 6. Today's daily_activity counter row
delete from daily_activity
 where user_id = '<USER_ID>'::uuid
   and activity_date = (now() at time zone 'America/Toronto')::date;

commit;


-- =============================================================================
-- VERIFY (run after the wipe — all counts should be 0)
-- =============================================================================

-- select 'heart_rate_sessions'  as tbl, count(*) from heart_rate_sessions
--    where user_id = '<USER_ID>'::uuid
--      and local_date = (now() at time zone 'America/Toronto')::date
-- union all
-- select 'breath_hold_sessions',         count(*) from breath_hold_sessions
--    where user_id = '<USER_ID>'::uuid
--      and local_date = (now() at time zone 'America/Toronto')::date
-- union all
-- select 'daily_activity',               count(*) from daily_activity
--    where user_id = '<USER_ID>'::uuid
--      and activity_date = (now() at time zone 'America/Toronto')::date;
