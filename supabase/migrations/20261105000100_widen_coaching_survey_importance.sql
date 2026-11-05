-- The importance question became a 1-9 slider, one step per bar.

alter table public.coaching_survey_responses
  drop constraint coaching_survey_responses_importance_check;

alter table public.coaching_survey_responses
  add constraint coaching_survey_responses_importance_check
  check (importance between 1 and 9);
