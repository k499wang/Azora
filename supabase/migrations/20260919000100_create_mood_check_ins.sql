-- One row per user per day: how they said they were doing, and what they rated.
--
-- Additive. Nothing existing is altered or dropped, and every name here is new,
-- so a build that predates this migration keeps working against the same
-- database — it simply never writes a row.
--
-- `answers` is jsonb rather than a column per scale on purpose. The scales are
-- product content: they will be reworded, reordered and added to, and a schema
-- change per edit is how a check-in stops being editable. The client owns the
-- shape, validates it on read, and stores the scale revision alongside it so an
-- old answer keeps meaning what it meant on the day it was given.
create table if not exists public.mood_check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  -- The user's own day, not UTC. Everything else that answers "did they do
  -- today" is keyed this way, and a check-in that disagreed would sit on the
  -- wrong day of their week.
  local_date date not null,
  -- Which set of questions was asked. Answers outlive the wording.
  scale_revision int not null default 1,
  answers jsonb not null,
  -- The derived 0-100 reading, stored rather than recomputed so a chart over a
  -- year does not depend on every historical scale still being in the build.
  score int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One check-in a day. A second answer replaces the first rather than stacking
  -- a second reading onto the same date, which is what would quietly weight a
  -- day where somebody tapped twice.
  unique (user_id, local_date),
  constraint mood_check_ins_score_range check (score between 0 and 100),
  constraint mood_check_ins_local_date_range check (
    local_date between date '2020-01-01' and date '2100-01-01'
  )
);

create index if not exists mood_check_ins_user_date_idx
  on public.mood_check_ins (user_id, local_date desc);

alter table public.mood_check_ins enable row level security;

create policy "mood_check_ins_select_own"
  on public.mood_check_ins for select
  using (auth.uid() = user_id);

create policy "mood_check_ins_insert_own"
  on public.mood_check_ins for insert
  with check (auth.uid() = user_id);

create policy "mood_check_ins_update_own"
  on public.mood_check_ins for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger mood_check_ins_updated_at
before update on public.mood_check_ins
for each row execute function public.update_updated_at();
