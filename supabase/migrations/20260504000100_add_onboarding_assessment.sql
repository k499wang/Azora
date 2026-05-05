-- Persist onboarding assessment signals so the app can tailor reflection,
-- session difficulty, and reminders without re-asking the user. Each column
-- is nullable so existing rows stay valid.

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists stress_level smallint,
  add column if not exists sleep_quality smallint,
  add column if not exists agreement_responses jsonb,
  add column if not exists experience_level text;

alter table public.profiles
  add constraint profiles_stress_level_range_check
    check (stress_level is null or (stress_level between 1 and 10)) not valid;

alter table public.profiles
  validate constraint profiles_stress_level_range_check;

alter table public.profiles
  add constraint profiles_sleep_quality_range_check
    check (sleep_quality is null or (sleep_quality between 1 and 10)) not valid;

alter table public.profiles
  validate constraint profiles_sleep_quality_range_check;

alter table public.profiles
  add constraint profiles_experience_level_check
    check (experience_level is null or experience_level in ('never', 'little', 'regular')) not valid;

alter table public.profiles
  validate constraint profiles_experience_level_check;

comment on column public.profiles.display_name is
  'Self-reported first name captured during onboarding. Used to personalize copy and reflections.';

comment on column public.profiles.stress_level is
  'Self-reported stress on a 1-10 scale captured during onboarding assessment.';

comment on column public.profiles.sleep_quality is
  'Self-reported morning rested-ness on a 1-10 scale captured during onboarding assessment.';

comment on column public.profiles.agreement_responses is
  'Likert agreement responses keyed by statement id (values: disagree | neutral | agree).';

comment on column public.profiles.experience_level is
  'Prior breathwork/meditation experience reported during onboarding.';
