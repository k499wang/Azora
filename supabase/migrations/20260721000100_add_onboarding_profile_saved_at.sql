-- Distinguish a deliberately saved onboarding profile from the blank profile
-- row created at sign-in. This keeps paywall resume reliable even when every
-- optional onboarding answer was skipped and persisted as null.

alter table public.profiles
  add column if not exists onboarding_profile_saved_at timestamptz;

update public.profiles
set onboarding_profile_saved_at = updated_at
where onboarding_profile_saved_at is null
  and nullif(btrim(onboarding_goal), '') is not null;

comment on column public.profiles.onboarding_profile_saved_at is
  'When onboarding answers were saved before the paywall. Null means no resumable onboarding profile has been saved.';
