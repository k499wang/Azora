-- Store onboarding completion on the authenticated user's profile so the root
-- app gate can make a per-account decision across devices and reinstalls.

alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz;

comment on column public.profiles.onboarding_completed_at is
  'When the user completed onboarding for this account. Null means onboarding is still required.';
