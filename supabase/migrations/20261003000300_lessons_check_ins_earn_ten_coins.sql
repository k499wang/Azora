-- Lessons and the daily mood check-in pay 10 coins; plan exercises keep 20.
-- Lesson completions are the plan rows whose activity id starts with `lesson:`.
-- Only future inserts are affected; existing wallet history is unchanged.
create or replace function public.grant_coins_for_daily_plan_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.wallet_entries (user_id, delta, reason, local_date)
  values (
    new.user_id,
    case
      when tg_table_name = 'mood_check_ins' then 10
      -- Read through jsonb: `mood_check_ins` has no activity_id column, and a
      -- direct field reference fails on that table even in an untaken branch.
      when to_jsonb(new)->>'activity_id' like 'lesson:%' then 10
      else 20
    end,
    case when tg_table_name = 'mood_check_ins'
      then 'daily_mood_complete' else 'daily_plan_activity_complete' end,
    new.local_date
  );
  return new;
end;
$$;
