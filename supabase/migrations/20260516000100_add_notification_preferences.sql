alter table public.user_preferences
add column if not exists notification_preferences jsonb not null default '{}'::jsonb;

comment on column public.user_preferences.notification_preferences is
  'Typed app notification settings. v1 stores local notification preferences for morning/evening daily reminders and trial-ending reminders.';
