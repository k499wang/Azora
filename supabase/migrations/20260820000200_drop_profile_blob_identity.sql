-- Removes the onboarding companion columns.
--
-- The mascot they backed was built and then reverted, so nothing reads or
-- writes these any more. `if exists` keeps this safe on an environment where
-- the adding migration was never applied.
alter table profiles
  drop column if exists companion_name,
  drop column if exists companion_color;
