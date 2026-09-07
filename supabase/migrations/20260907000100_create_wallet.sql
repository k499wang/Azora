-- A deliberately small, client-managed coin ledger.
-- This migration is additive: older app versions ignore it and keep using the
-- existing room reward flow unchanged.
create table if not exists public.wallet_entries (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  currency text not null default 'coin',
  delta integer not null check (delta <> 0),
  reason text not null,
  local_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists wallet_entries_user_currency_idx
  on public.wallet_entries (user_id, currency, created_at desc);

alter table public.wallet_entries enable row level security;

drop policy if exists "wallet_entries_select_own" on public.wallet_entries;
create policy "wallet_entries_select_own"
on public.wallet_entries for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "wallet_entries_insert_own" on public.wallet_entries;
create policy "wallet_entries_insert_own"
on public.wallet_entries for insert
to authenticated
with check (auth.uid() = user_id);

grant select, insert on public.wallet_entries to authenticated;

-- No update or delete policy: corrections are new compensating entries, so the
-- balance stays explainable without an operation/RPC subsystem.
