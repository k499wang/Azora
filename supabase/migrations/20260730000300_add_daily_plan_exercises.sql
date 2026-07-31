alter table public.user_preferences
add column if not exists daily_plan_exercises jsonb;

comment on column public.user_preferences.daily_plan_exercises is
  'Versioned seven-day daytime breathing exercise plan; nullable so older accounts can derive and persist a stable plan client-side.';
