-- "Did this feel helpful?" — one answer per technique per day.
--
-- Keyed by technique rather than by session on purpose: the question exists to
-- improve which exercise gets recommended, and that wants a per-technique
-- signal, not a per-session log. It also keeps the results screen from having to
-- thread a session id it does not currently receive.
--
-- The unique key is an upsert target, not a rule — answering again the same day
-- replaces the earlier answer, so a user can change their mind.

create table public.technique_feedback (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  technique_id text not null,
  local_date date not null,
  -- 1 not really, 2 a bit, 3 a lot. Kept as a small ordinal so the scale can be
  -- relabelled in the app without a migration.
  helpfulness smallint not null check (helpfulness between 1 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, technique_id, local_date)
);

create index technique_feedback_user_technique_idx
  on public.technique_feedback (user_id, technique_id);

create trigger technique_feedback_updated_at
before update on public.technique_feedback
for each row execute function public.update_updated_at();

alter table public.technique_feedback enable row level security;

create policy "technique_feedback_select_own"
on public.technique_feedback for select
to authenticated
using (auth.uid() = user_id);

create policy "technique_feedback_insert_own"
on public.technique_feedback for insert
to authenticated
with check (auth.uid() = user_id);

create policy "technique_feedback_update_own"
on public.technique_feedback for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "technique_feedback_delete_own"
on public.technique_feedback for delete
to authenticated
using (auth.uid() = user_id);
