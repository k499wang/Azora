-- Register the ten breathing exercises added alongside the original five.
--
-- `breathing_sessions.technique_id` has a foreign key onto this table, so
-- until a row exists here `complete_breathing_session` raises
-- 'unknown technique_id' and the session is never persisted. The client logs
-- that rejection in the background, so the user sees a completed session that
-- silently did not count.
--
-- The client mirror of this list is
-- `src/features/exercise/guidedBreathing/techniqueCatalog.ts`, and
-- `techniqueCatalog.test.mjs` fails when the two drift.

insert into public.breathing_technique_catalog (id, display_name)
values
  ('belly', 'Belly Breathing'),
  ('extended-exhale', 'Extended Exhale'),
  ('sitali', 'Cooling Breath'),
  ('triangle', 'Triangle Breathing'),
  ('deep-box', 'Deep Box'),
  ('bhastrika', 'Bellows Breath'),
  ('morning-charge', 'Morning Charge'),
  ('night-settle', 'Night Settle'),
  ('sleep-descent', 'Sleep Descent'),
  ('coherent-6', 'Coherent 6')
on conflict (id) do update set
  display_name = excluded.display_name,
  active = true;
