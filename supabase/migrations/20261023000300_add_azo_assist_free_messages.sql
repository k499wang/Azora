-- Non-Pro users get a few lifetime Azo answers (chat or plan) before the
-- paywall. The azo-assist edge function counts one only after a usable answer.
create table public.azo_assist_free_messages (
  user_id uuid primary key references auth.users(id) on delete cascade,
  used_count integer not null default 0 check (used_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.azo_assist_free_messages enable row level security;

create policy "azo_assist_free_messages_select_own"
  on public.azo_assist_free_messages for select
  using (auth.uid() = user_id);

create or replace function public.record_azo_assist_free_message(p_user_id uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  insert into public.azo_assist_free_messages (user_id, used_count)
  values (p_user_id, 1)
  on conflict (user_id) do update
    set used_count = azo_assist_free_messages.used_count + 1,
        updated_at = now()
  returning used_count;
$$;

revoke all on function public.record_azo_assist_free_message(uuid) from public;
grant execute on function public.record_azo_assist_free_message(uuid) to service_role;
