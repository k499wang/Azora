-- Finishing a routine to-do earns 10 coins; un-ticking it gives them back.
-- The ledger is written here, in the same transaction as the completion, so the
-- balance can never drift from what is ticked and the client never writes twice.
create or replace function public.grant_coins_for_todo_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.wallet_entries (user_id, delta, reason, local_date)
    values (new.user_id, 10, 'todo_complete', new.local_date);
    return new;
  end if;

  -- An account deletion cascades through completions after the profile row is
  -- gone; a reversal entry would then violate the wallet's profile key.
  if exists (select 1 from public.profiles where user_id = old.user_id) then
    insert into public.wallet_entries (user_id, delta, reason, local_date)
    values (old.user_id, -10, 'todo_uncomplete', old.local_date);
  end if;
  return old;
end;
$$;

drop trigger if exists self_care_goal_completions_earn_coins
  on public.self_care_goal_completions;
create trigger self_care_goal_completions_earn_coins
after insert or delete on public.self_care_goal_completions
for each row execute function public.grant_coins_for_todo_completion();

-- Credit every to-do finished before coins existed, once per user.
insert into public.wallet_entries (user_id, delta, reason, local_date)
select completions.user_id, count(*) * 10, 'todo_backfill', current_date
from public.self_care_goal_completions completions
where not exists (
  select 1 from public.wallet_entries entries
  where entries.user_id = completions.user_id and entries.reason = 'todo_backfill'
)
group by completions.user_id;
