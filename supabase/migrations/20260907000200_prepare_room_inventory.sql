-- Preserve current rooms while preparing inventory for the future Shop.
-- Old app versions keep writing rooms and room_decorations as before; the
-- triggers below mirror those writes into the new tables.

create table if not exists public.owned_objects (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  option_id text not null,
  acquired_local_date date,
  created_at timestamptz not null default now(),
  unique (user_id, option_id)
);

create table if not exists public.owned_room_shells (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  shell text not null,
  created_at timestamptz not null default now(),
  unique (user_id, shell)
);

create table if not exists public.room_reward_history (
  source_decoration_id uuid primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  room_id uuid not null,
  slot text not null,
  option_id text not null,
  earned_local_date date not null,
  created_at timestamptz not null
);

create index if not exists room_reward_history_user_date_idx
  on public.room_reward_history (user_id, earned_local_date);

alter table public.owned_objects enable row level security;
alter table public.owned_room_shells enable row level security;
alter table public.room_reward_history enable row level security;

drop policy if exists "owned_objects_select_own" on public.owned_objects;
create policy "owned_objects_select_own"
on public.owned_objects for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "owned_room_shells_select_own" on public.owned_room_shells;
create policy "owned_room_shells_select_own"
on public.owned_room_shells for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "room_reward_history_select_own" on public.room_reward_history;
create policy "room_reward_history_select_own"
on public.room_reward_history for select to authenticated
using (auth.uid() = user_id);

grant select on public.owned_objects, public.owned_room_shells,
  public.room_reward_history to authenticated;

create or replace function public.mirror_legacy_decoration_to_inventory()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.owned_objects (user_id, option_id, acquired_local_date, created_at)
  values (new.user_id, new.option_id, new.earned_local_date, new.created_at)
  on conflict (user_id, option_id) do nothing;

  insert into public.room_reward_history (
    source_decoration_id, user_id, room_id, slot, option_id,
    earned_local_date, created_at
  ) values (
    new.id, new.user_id, new.room_id, new.slot, new.option_id,
    new.earned_local_date, new.created_at
  )
  on conflict (source_decoration_id) do nothing;

  return new;
end;
$$;

create or replace function public.mirror_legacy_room_shell_to_inventory()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.owned_room_shells (user_id, shell, created_at)
  values (new.user_id, new.shell, new.created_at)
  on conflict (user_id, shell) do nothing;
  return new;
end;
$$;

create or replace function public.grant_default_room_shell()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.owned_room_shells (user_id, shell, created_at)
  values (new.user_id, 'cream', coalesce(new.created_at, now()))
  on conflict (user_id, shell) do nothing;
  return new;
end;
$$;

revoke all on function public.mirror_legacy_decoration_to_inventory()
  from public, anon, authenticated;
revoke all on function public.mirror_legacy_room_shell_to_inventory()
  from public, anon, authenticated;
revoke all on function public.grant_default_room_shell()
  from public, anon, authenticated;

drop trigger if exists room_decorations_mirror_inventory on public.room_decorations;
create trigger room_decorations_mirror_inventory
after insert or update of option_id on public.room_decorations
for each row execute function public.mirror_legacy_decoration_to_inventory();

drop trigger if exists rooms_mirror_shell_inventory on public.rooms;
create trigger rooms_mirror_shell_inventory
after insert or update of shell on public.rooms
for each row execute function public.mirror_legacy_room_shell_to_inventory();

drop trigger if exists profiles_grant_default_room_shell on public.profiles;
create trigger profiles_grant_default_room_shell
after insert on public.profiles
for each row execute function public.grant_default_room_shell();

-- Backfill after the triggers exist. Existing placements remain unchanged,
-- including duplicate objects and duplicate floor numbers.
insert into public.owned_objects (user_id, option_id, acquired_local_date, created_at)
select user_id, option_id, min(earned_local_date), min(created_at)
from public.room_decorations
group by user_id, option_id
on conflict (user_id, option_id) do nothing;

insert into public.owned_room_shells (user_id, shell, created_at)
select user_id, shell, min(created_at)
from public.rooms
group by user_id, shell
on conflict (user_id, shell) do nothing;

insert into public.owned_room_shells (user_id, shell, created_at)
select user_id, 'cream', created_at
from public.profiles
on conflict (user_id, shell) do nothing;

insert into public.room_reward_history (
  source_decoration_id, user_id, room_id, slot, option_id,
  earned_local_date, created_at
)
select id, user_id, room_id, slot, option_id, earned_local_date, created_at
from public.room_decorations
on conflict (source_decoration_id) do nothing;
