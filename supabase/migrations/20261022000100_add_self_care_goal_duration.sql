-- How long a to-do takes, so the routine player can time each step. Null means
-- the step is open-ended and the player counts up instead of down.

alter table public.self_care_goals
  add column duration_minutes smallint;

alter table public.self_care_goals
  add constraint self_care_goals_duration_minutes_range check (
    duration_minutes is null
    or duration_minutes between 1 and 180
  );
