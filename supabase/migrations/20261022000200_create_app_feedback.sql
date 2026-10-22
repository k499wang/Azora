-- Answers to the in-app feedback form Home offers paying Pro members. One row
-- per submission; users only ever insert, the team reads from the dashboard.
--
-- `disappointment` is the Sean Ellis question: how would you feel if you could
-- no longer use Azora?

create table if not exists public.app_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  disappointment text not null check (disappointment in ('very', 'somewhat', 'not')),
  improvement text,
  app_version text,
  created_at timestamptz not null default now()
);

alter table public.app_feedback enable row level security;

create policy "app_feedback_insert_own"
on public.app_feedback for insert to authenticated
with check (auth.uid() = user_id);

create index if not exists app_feedback_created_at_idx
  on public.app_feedback (created_at desc);
