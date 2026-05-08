-- =============================================================================
-- reset-today-all-users.sql
-- ⚠️  DESTRUCTIVE — wipes EVERY user's today.
-- Dev/staging only. Never run against production.
--
-- Wipes today's heart-rate sessions, breath-hold sessions, BPM/IBI samples,
-- and daily_activity counter rows for all users.
--
-- Safety guard: the transaction ends with ROLLBACK by default. The first run
-- shows you what would be deleted without actually deleting anything. When
-- you're sure, change the last line from `rollback;` to `commit;` and re-run.
--
-- "Today" is computed per-row from each row's stored `timezone` column,
-- falling back to UTC. This avoids deleting yesterday's data for users behind
-- your tz, or tomorrow's data for users ahead.
--
-- After running:
--   Every user's app still has stale React Query cache. They'll need to
--   relaunch / refresh before the new state shows.
-- =============================================================================


-- =============================================================================
-- WIPE
--   In Postgres a CTE only scopes to its own statement, so each DELETE
--   re-derives the "today" subquery inline.
-- =============================================================================

begin;

-- 1. IBI samples for today's HR sessions
delete from heart_rate_ibi_samples
 where heart_rate_session_id in (
   select id from heart_rate_sessions
    where local_date = (now() at time zone coalesce(timezone, 'UTC'))::date
 );

-- 2. IBI samples for today's breath-hold sessions
delete from heart_rate_ibi_samples
 where breath_hold_session_id in (
   select id from breath_hold_sessions
    where local_date = (now() at time zone coalesce(timezone, 'UTC'))::date
 );

-- 3. BPM samples for today's HR sessions
delete from heart_rate_samples
 where heart_rate_session_id in (
   select id from heart_rate_sessions
    where local_date = (now() at time zone coalesce(timezone, 'UTC'))::date
 );

-- 4. Today's HR session rows (all users)
delete from heart_rate_sessions
 where local_date = (now() at time zone coalesce(timezone, 'UTC'))::date;

-- 5. Today's breath-hold session rows (all users)
delete from breath_hold_sessions
 where local_date = (now() at time zone coalesce(timezone, 'UTC'))::date;

-- 6. Today's daily_activity counter rows.
-- daily_activity has no timezone column — fall back to the user's most recent
-- session timezone, then UTC.
delete from daily_activity da
 where da.activity_date = (
   now() at time zone coalesce(
     (
       select s.timezone
         from heart_rate_sessions s
        where s.user_id = da.user_id
        order by s.created_at desc
        limit 1
     ),
     (
       select s.timezone
         from breath_hold_sessions s
        where s.user_id = da.user_id
        order by s.created_at desc
        limit 1
     ),
     'UTC'
   )
 )::date;

-- ⚠️  Default is ROLLBACK. Review the row counts in the SQL editor output,
-- then change this line to `commit;` and re-run when you're sure.
rollback;
-- commit;


-- =============================================================================
-- VERIFY (run after a real COMMIT — counts should be 0)
-- =============================================================================

-- select 'heart_rate_sessions'  as tbl, count(*) from heart_rate_sessions
--    where local_date = (now() at time zone coalesce(timezone, 'UTC'))::date
-- union all
-- select 'breath_hold_sessions',         count(*) from breath_hold_sessions
--    where local_date = (now() at time zone coalesce(timezone, 'UTC'))::date
-- union all
-- select 'daily_activity (today UTC)',   count(*) from daily_activity
--    where activity_date = (now() at time zone 'UTC')::date;
