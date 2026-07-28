-- Capture self-reported acquisition channel during onboarding. Install
-- attribution only sees paid networks, so organic discovery (podcasts,
-- creators, word of mouth, App Store search) is invisible without asking.
-- Written incrementally the moment the user answers, by a writer separate from
-- the seal-step upsert, so a user who abandons before the paywall still counts.

alter table public.profiles
  add column if not exists acquisition_source text;

alter table public.profiles
  add constraint profiles_acquisition_source_check
    check (acquisition_source is null or acquisition_source in (
      'instagram',
      'tiktok',
      'facebook',
      'reddit',
      'app_store_search',
      'google_search',
      'friend_or_family',
      'other',
      'skipped'
    )) not valid;

alter table public.profiles
  validate constraint profiles_acquisition_source_check;

comment on column public.profiles.acquisition_source is
  'Self-reported discovery channel captured during onboarding. Null means never asked (pre-existing users); ''skipped'' means asked and declined.';
