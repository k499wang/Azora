-- Completions are stamped with the device's calendar day, but the view judged
-- "current" by the server clock in the profile timezone. When the device is
-- already on tomorrow (a clock set ahead, or a trip east before the profile
-- timezone re-syncs), extending the streak moved the run past the server's
-- today and the current streak read 0. A run is current if it reaches at
-- least the server's yesterday, however far ahead the device has written.

create or replace view public.user_streaks_v
with (security_invoker = true) as
with profile_days as (
  select
    p.user_id,
    ((now() at time zone p.timezone)::date) as today_local
  from public.profiles p
  where p.user_id = auth.uid()
),
qualified as (
  select user_id, activity_date
  from public.daily_activity
  where user_id = auth.uid()
    and qualifies_for_streak = true
),
with_gap as (
  select
    user_id,
    activity_date,
    activity_date - (row_number() over (partition by user_id order by activity_date))::int as grp
  from qualified
),
runs as (
  select
    user_id,
    grp,
    min(activity_date) as run_start,
    max(activity_date) as run_end,
    count(*)::int as run_len
  from with_gap
  group by user_id, grp
),
stats as (
  select
    pd.user_id,
    coalesce(
      max(r.run_len) filter (where r.run_end >= pd.today_local - 1),
      0
    ) as current_streak,
    coalesce(max(r.run_len), 0) as longest_streak,
    max(r.run_end) as last_qualified_date
  from profile_days pd
  left join runs r on r.user_id = pd.user_id
  group by pd.user_id
)
select
  user_id,
  current_streak,
  longest_streak,
  last_qualified_date
from stats;

grant select on public.user_streaks_v to authenticated;
