-- Weekly and one-off to-dos come round less often and tend to be the bigger
-- jobs, so they pay 20; daily and weekday ones pay 10.
--
-- Each completion keeps what it paid, so un-ticking refunds exactly that even
-- if the to-do's repeat was edited in between. Existing rows default to 10,
-- matching the backfill they were credited with. Older app versions never send
-- this column; the before-insert trigger fills it in.
alter table public.self_care_goal_completions
  add column if not exists coins integer not null default 10;

create or replace function public.price_todo_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select case when goals.recurrence in ('weekly', 'once') then 20 else 10 end
  into new.coins
  from public.self_care_goals goals
  where goals.id = new.goal_id;
  new.coins := coalesce(new.coins, 10);
  return new;
end;
$$;

drop trigger if exists self_care_goal_completions_price_coins
  on public.self_care_goal_completions;
create trigger self_care_goal_completions_price_coins
before insert on public.self_care_goal_completions
for each row execute function public.price_todo_completion();

create or replace function public.grant_coins_for_todo_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.wallet_entries (user_id, delta, reason, local_date)
    values (new.user_id, new.coins, 'todo_complete', new.local_date);
    return new;
  end if;

  -- An account deletion cascades through completions after the profile row is
  -- gone; a reversal entry would then violate the wallet's profile key.
  if exists (select 1 from public.profiles where user_id = old.user_id) then
    insert into public.wallet_entries (user_id, delta, reason, local_date)
    values (old.user_id, -old.coins, 'todo_uncomplete', old.local_date);
  end if;
  return old;
end;
$$;
