alter table public.user_preferences
drop column if exists reminder_enabled,
drop column if exists reminder_time;
