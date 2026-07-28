-- Drop the acquisition_source allow-list. Adding or renaming a channel option
-- shouldn't require a migration; the TypeScript `AcquisitionSource` union in
-- src/services/profile/onboardingSurveyService.ts remains the single writer, so
-- the column is still only ever written with a known value.

alter table public.profiles
  drop constraint if exists profiles_acquisition_source_check;
