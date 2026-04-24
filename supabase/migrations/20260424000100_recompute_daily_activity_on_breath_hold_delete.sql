-- Phase 3 edge case: when a breath-hold session is deleted, recompute that
-- day's daily_activity so streak state stays truthful.
--
-- Without this, deleting the only breath-hold of a day would leave
-- daily_breath_hold_completed = true and qualifies_for_streak = true, and
-- user_streaks_v would continue to count the day.

create or replace function public.recompute_daily_activity_after_breath_hold_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_best int;
begin
  select count(*)::int, max(hold_seconds)
    into v_count, v_best
  from public.breath_hold_sessions
  where user_id = old.user_id
    and local_date = old.local_date;

  if v_count = 0 then
    update public.daily_activity
    set
      daily_breath_hold_completed = false,
      breath_hold_count = 0,
      best_hold_seconds = null,
      qualifies_for_streak = false,
      updated_at = now()
    where user_id = old.user_id
      and activity_date = old.local_date;
  else
    update public.daily_activity
    set
      daily_breath_hold_completed = true,
      breath_hold_count = v_count,
      best_hold_seconds = v_best,
      qualifies_for_streak = true,
      updated_at = now()
    where user_id = old.user_id
      and activity_date = old.local_date;
  end if;

  return old;
end;
$$;

alter function public.recompute_daily_activity_after_breath_hold_delete()
  owner to postgres;

revoke all on function public.recompute_daily_activity_after_breath_hold_delete()
  from public;

drop trigger if exists breath_hold_sessions_recompute_daily_activity
  on public.breath_hold_sessions;

create trigger breath_hold_sessions_recompute_daily_activity
after delete on public.breath_hold_sessions
for each row execute function public.recompute_daily_activity_after_breath_hold_delete();
