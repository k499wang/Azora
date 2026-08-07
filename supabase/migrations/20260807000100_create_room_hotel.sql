-- Rooms and their decorations.
--
-- Deliberately dumb storage: this records what a user has built, not the rules
-- for how they built it. How objects are earned, how many slots a room has,
-- what a slot is called, when a room rolls over — all of that lives in the app
-- and can change without a migration. `slot` and `option_id` are free text on
-- purpose; they hold whatever keys src/features/room/RoomScene.tsx uses today.

create table public.rooms (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  -- position in the hotel; 1 is the ground floor
  floor int not null default 1,
  -- palette keys resolved client-side, so new looks ship without a migration
  -- and an old room keeps rendering the palette it was built with
  shell text not null default 'cream',
  frame_hue text not null default 'sky',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index rooms_user_floor_idx on public.rooms (user_id, floor);

create trigger rooms_updated_at
before update on public.rooms
for each row execute function public.update_updated_at();

create table public.room_decorations (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  -- which position in the room, e.g. 'day1'; renaming or adding slots is a
  -- client change only
  slot text not null,
  -- which object sits there, e.g. 'checker_rug'
  option_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- one object per slot; swapping is an update of option_id
  unique (room_id, slot)
);

create index room_decorations_user_idx on public.room_decorations (user_id);

create trigger room_decorations_updated_at
before update on public.room_decorations
for each row execute function public.update_updated_at();

alter table public.rooms enable row level security;
alter table public.room_decorations enable row level security;

create policy "rooms_select_own"
on public.rooms for select
to authenticated
using (auth.uid() = user_id);

create policy "rooms_insert_own"
on public.rooms for insert
to authenticated
with check (auth.uid() = user_id);

create policy "rooms_update_own"
on public.rooms for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "rooms_delete_own"
on public.rooms for delete
to authenticated
using (auth.uid() = user_id);

create policy "room_decorations_select_own"
on public.room_decorations for select
to authenticated
using (auth.uid() = user_id);

create policy "room_decorations_insert_own"
on public.room_decorations for insert
to authenticated
with check (auth.uid() = user_id);

create policy "room_decorations_update_own"
on public.room_decorations for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "room_decorations_delete_own"
on public.room_decorations for delete
to authenticated
using (auth.uid() = user_id);
