-- Non-Pro users get one successful photo cleanup for life. The edge function
-- writes the row with the service role only after a usable plan is delivered.
create table public.photo_cleanup_free_uses (
  user_id uuid primary key references auth.users(id) on delete cascade,
  used_at timestamptz not null default now()
);

alter table public.photo_cleanup_free_uses enable row level security;

create policy "photo_cleanup_free_uses_select_own"
  on public.photo_cleanup_free_uses for select
  using (auth.uid() = user_id);
