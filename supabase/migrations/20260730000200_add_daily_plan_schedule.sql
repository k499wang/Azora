alter table public.user_preferences
add column if not exists daily_plan_schedule jsonb;

-- Older accounts may predate creation of their preferences row.
insert into public.user_preferences (user_id)
select user_id
from public.profiles
on conflict (user_id) do nothing;

-- Preserve an existing daily-reminder time for the primary session when it is
-- a valid clock value. Plan display times remain independent of whether that
-- reminder is enabled or notification permission was granted.
with existing_times as (
  select
    user_id,
    case
      when notification_preferences #>> '{dailyReminder,time}'
        ~ '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$'
      then left(notification_preferences #>> '{dailyReminder,time}', 5)
      else '08:00'
    end as session_time
  from public.user_preferences
)
update public.user_preferences as preferences
set daily_plan_schedule = jsonb_build_object(
  'version', 1,
  'timeMode', 'device_local',
  'actions', jsonb_build_object(
    'session', existing_times.session_time,
    'handPicked', '13:00',
    'checkIn',
      case
        when existing_times.session_time < '12:00' then '18:00'
        else '08:00'
      end
  )
)
from existing_times
where preferences.user_id = existing_times.user_id
  and preferences.daily_plan_schedule is null;

alter table public.user_preferences
alter column daily_plan_schedule set default
  '{
    "version": 1,
    "timeMode": "device_local",
    "actions": {
      "session": "08:00",
      "handPicked": "13:00",
      "checkIn": "18:00"
    }
  }'::jsonb,
alter column daily_plan_schedule set not null;

comment on column public.user_preferences.daily_plan_schedule is
  'Versioned device-local display schedule for daily plan actions; independent of notification preferences and permission.';
