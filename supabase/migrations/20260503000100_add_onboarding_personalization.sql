-- Persist onboarding personalization signals on the user's profile so the app
-- can tailor session defaults, plan progression, and reminders without
-- re-asking the user. Each column is nullable so existing rows stay valid.

alter table public.profiles
  add column if not exists age smallint,
  add column if not exists gender text,
  add column if not exists daily_minutes smallint,
  add column if not exists default_technique_id text;

alter table public.profiles
  add constraint profiles_age_range_check
    check (age is null or (age between 13 and 120)) not valid;

alter table public.profiles
  validate constraint profiles_age_range_check;

alter table public.profiles
  add constraint profiles_gender_check
    check (gender is null or gender in ('female', 'male', 'nonbinary', 'prefer_not')) not valid;

alter table public.profiles
  validate constraint profiles_gender_check;

alter table public.profiles
  add constraint profiles_daily_minutes_range_check
    check (daily_minutes is null or (daily_minutes between 1 and 120)) not valid;

alter table public.profiles
  validate constraint profiles_daily_minutes_range_check;

comment on column public.profiles.age is
  'Self-reported age captured during onboarding. Used to tailor plan progression and copy.';

comment on column public.profiles.gender is
  'Self-reported gender identity captured during onboarding. Optional; stored for inclusive copy and future research aggregates.';

comment on column public.profiles.daily_minutes is
  'Daily commitment in minutes captured during the onboarding pact. Drives session length defaults and reminders.';

comment on column public.profiles.default_technique_id is
  'Recommended starting breathing technique chosen by onboarding personalization (matches client `BreathingTechnique.id`).';
