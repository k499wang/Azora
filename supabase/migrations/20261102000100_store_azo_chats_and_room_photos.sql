-- Keeps what people send Azo and the room photos behind photo cleanup plans.
-- Only the edge functions (service role) write these; people can read their own.
create table public.azo_chat_messages (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'azo')),
  text text not null,
  todos jsonb,
  changes jsonb,
  created_at timestamptz not null default now()
);

create index azo_chat_messages_user_created_idx
  on public.azo_chat_messages (user_id, created_at desc);

alter table public.azo_chat_messages enable row level security;

create policy "azo_chat_messages_select_own"
  on public.azo_chat_messages for select
  using (auth.uid() = user_id);

create table public.photo_cleanup_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  plan jsonb not null,
  created_at timestamptz not null default now()
);

create index photo_cleanup_photos_user_created_idx
  on public.photo_cleanup_photos (user_id, created_at desc);

alter table public.photo_cleanup_photos enable row level security;

create policy "photo_cleanup_photos_select_own"
  on public.photo_cleanup_photos for select
  using (auth.uid() = user_id);

-- Private: no storage policies, so only the service role reads or writes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('room-photos', 'room-photos', false, 7340032, array['image/jpeg'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
