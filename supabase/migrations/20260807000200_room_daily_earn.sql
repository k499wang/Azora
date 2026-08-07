-- Records the local date the client earned a decoration on.
--
-- Data, not a rule. How often objects are earned, and what has to happen first,
-- stays in the app where it can change without a migration — this column only
-- stores what the client said, the same way `daily_activity.activity_date` does.
--
-- `created_at` cannot stand in for it: it is a UTC timestamp, so someone in
-- Auckland finishing at 1am local sits on the previous UTC date and someone in
-- Honolulu finishing at 9pm local sits on the next one. Evening is when people
-- actually practice, so "have I earned today?" would read wrong for a large
-- share of users during the hours they use the app.

alter table public.room_decorations
  add column earned_local_date date;

update public.room_decorations
set earned_local_date = created_at::date
where earned_local_date is null;

alter table public.room_decorations
  alter column earned_local_date set not null;
