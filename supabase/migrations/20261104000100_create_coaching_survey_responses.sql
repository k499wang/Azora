-- Answers to the coaching survey, for the coach to read before a fit call. One
-- row per submission; users only ever insert, the team reads from the dashboard.

create table if not exists public.coaching_survey_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  help_with text not null,
  different_in_30_days text not null,
  tried_and_obstacles text not null,
  importance smallint not null check (importance between 1 and 5),
  comfortable_paying text not null check (comfortable_paying in ('yes', 'maybe', 'no')),
  name text not null,
  email text not null,
  time_zone text not null,
  agreed_to_share_at timestamptz not null,
  app_version text,
  created_at timestamptz not null default now()
);

alter table public.coaching_survey_responses enable row level security;

create policy "coaching_survey_responses_insert_own"
on public.coaching_survey_responses for insert to authenticated
with check (auth.uid() = user_id);

create index if not exists coaching_survey_responses_created_at_idx
  on public.coaching_survey_responses (created_at desc);
