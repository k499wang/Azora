-- Every onboarding answer, one row per question, latest answer wins. Questions
-- change often, so answers are keyed by the flow's step/state id rather than
-- given a column each: adding or removing a question needs no migration.
--
-- Older app builds never touch this table, and the onboarding columns on
-- `profiles` are still written as before. Keep it that way: only ever add
-- columns here — never rename, drop, or tighten one while old builds are live.

create table if not exists public.onboarding_answers (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  answer jsonb not null,
  app_version text,
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

alter table public.onboarding_answers enable row level security;

create policy "onboarding_answers_select_own"
on public.onboarding_answers for select to authenticated
using (auth.uid() = user_id);

create policy "onboarding_answers_insert_own"
on public.onboarding_answers for insert to authenticated
with check (auth.uid() = user_id);

create policy "onboarding_answers_update_own"
on public.onboarding_answers for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists onboarding_answers_question_idx
  on public.onboarding_answers (question_id);
