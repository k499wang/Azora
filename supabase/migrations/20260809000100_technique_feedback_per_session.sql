-- "Did this feel helpful?" moves from one answer per technique per day to one
-- answer per session.
--
-- The per-day key meant redoing an exercise the same day showed the answer you
-- already gave, which reads as the app ignoring you. The session key is built by
-- the app from the technique and the moment the session ended, so it is stable
-- across a re-render but new for every session.
--
-- Existing rows are backfilled with their old key, which keeps them unique.

alter table public.technique_feedback
  add column session_key text;

update public.technique_feedback
set session_key = technique_id || ':' || local_date::text
where session_key is null;

alter table public.technique_feedback
  alter column session_key set not null;

alter table public.technique_feedback
  drop constraint technique_feedback_user_id_technique_id_local_date_key;

alter table public.technique_feedback
  add constraint technique_feedback_user_session_key
  unique (user_id, session_key);
