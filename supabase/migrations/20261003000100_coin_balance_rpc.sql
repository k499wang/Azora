-- The coin balance, summed in Postgres.
--
-- The app used to download every ledger row and add them up on the device.
-- PostgREST returns at most 1000 rows per request, so once an account passed
-- that the balance was the sum of the newest 1000: each new entry pushed the
-- oldest one out and the total stopped moving. Additive; older app versions
-- keep reading the table directly.
create or replace function public.coin_balance()
returns integer
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(sum(delta), 0)::integer
  from public.wallet_entries
  where user_id = auth.uid()
    and currency = 'coin';
$$;

revoke all on function public.coin_balance() from public;
grant execute on function public.coin_balance() to authenticated;
