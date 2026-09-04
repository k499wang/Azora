-- One to-do a day can be singled out as the task of the day. Stored as the
-- local date it was picked for rather than a flag, so yesterday's pick does not
-- carry into today and nothing has to sweep it clear overnight.

alter table public.self_care_goals
  add column featured_on date;

-- At most one task of the day per user per day. Handing the title to another
-- to-do therefore has to clear the current holder before it sets the new one.
create unique index self_care_goals_featured_on_idx
  on public.self_care_goals (user_id, featured_on)
  where featured_on is not null;

-- A device clock far outside this range is broken, not in another timezone.
-- Matches the range the completions table already checks.
alter table public.self_care_goals
  add constraint self_care_goals_featured_on_range check (
    featured_on is null
    or featured_on between date '2020-01-01' and date '2100-01-01'
  );
