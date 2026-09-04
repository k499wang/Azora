-- Personal daily todos are intentionally independent from Azora's canonical
-- exercise dailies. Completing one does not affect streaks, feature usage, or
-- room rewards. Existing app versions simply ignore these additive tables.

create table public.self_care_goals (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  title text not null,
  icon text,
  -- Slots the goal into Home's timeline. Null items are untimed and sink below
  -- the scheduled ones.
  scheduled_time time,
  recurrence text not null default 'daily',
  -- User-controlled order within a day. Fractional so a goal can be dragged
  -- between two neighbours without renumbering the list.
  sort_order numeric not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint self_care_goals_title_length check (
    title = btrim(title)
    and char_length(title) between 1 and 120
  ),
  constraint self_care_goals_recurrence_valid check (
    recurrence in ('daily', 'weekdays', 'once')
  ),
  -- Lets completions carry a composite foreign key, so a completion cannot
  -- name a goal that belongs to someone else.
  constraint self_care_goals_id_user_key unique (id, user_id)
);

create index self_care_goals_user_active_idx
  on public.self_care_goals (user_id, sort_order, created_at)
  where archived_at is null;

create trigger self_care_goals_updated_at
before update on public.self_care_goals
for each row execute function public.update_updated_at();

create table public.self_care_goal_completions (
  goal_id uuid not null,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  local_date date not null,
  completed_at timestamptz not null default now(),
  primary key (goal_id, local_date),
  constraint self_care_goal_completions_goal_fkey
    foreign key (goal_id, user_id)
    references public.self_care_goals (id, user_id) on delete cascade,
  -- A device clock far outside this range is broken, not in another timezone.
  constraint self_care_goal_completions_local_date_range check (
    local_date between date '2020-01-01' and date '2100-01-01'
  )
);

create index self_care_goal_completions_user_date_idx
  on public.self_care_goal_completions (user_id, local_date);

alter table public.self_care_goals enable row level security;
alter table public.self_care_goal_completions enable row level security;

create policy "self_care_goals_select_own"
on public.self_care_goals for select to authenticated
using (auth.uid() = user_id);

create policy "self_care_goals_insert_own"
on public.self_care_goals for insert to authenticated
with check (auth.uid() = user_id);

create policy "self_care_goals_update_own"
on public.self_care_goals for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "self_care_goals_delete_own"
on public.self_care_goals for delete to authenticated
using (auth.uid() = user_id);

create policy "self_care_goal_completions_select_own"
on public.self_care_goal_completions for select to authenticated
using (auth.uid() = user_id);

create policy "self_care_goal_completions_insert_own"
on public.self_care_goal_completions for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.self_care_goals
    where id = goal_id and user_id = auth.uid() and archived_at is null
  )
);

create policy "self_care_goal_completions_delete_own"
on public.self_care_goal_completions for delete to authenticated
using (auth.uid() = user_id);
