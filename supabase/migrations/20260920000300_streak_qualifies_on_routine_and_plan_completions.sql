-- A day of care can be a completed routine to-do, mood check-in, lesson, or
-- existing breathing practice. The derived flag remains the single streak
-- source, so every surface agrees and an undo can remove only its own credit.

create or replace function public.recompute_daily_activity_streak_qualification(
  p_user_id uuid,
  p_local_date date
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_timezone text;
  v_qualifies boolean;
begin
  select timezone into v_timezone
  from public.profiles
  where user_id = p_user_id;

  if v_timezone is null then
    return;
  end if;

  select
    exists (
      select 1
      from public.breath_hold_sessions
      where user_id = p_user_id and local_date = p_local_date
    )
    or exists (
      select 1
      from public.breathing_sessions
      where user_id = p_user_id and local_date = p_local_date
    )
    or exists (
      select 1
      from public.self_care_goal_completions
      where user_id = p_user_id and local_date = p_local_date
    )
    or exists (
      select 1
      from public.mood_check_ins
      where user_id = p_user_id and local_date = p_local_date
    )
    or exists (
      select 1
      from public.program_action_completions
      where user_id = p_user_id
        and local_date = p_local_date
        and activity_id like 'lesson:%'
    )
  into v_qualifies;

  insert into public.daily_activity (
    user_id, activity_date, timezone, qualifies_for_streak
  )
  values (p_user_id, p_local_date, v_timezone, v_qualifies)
  on conflict (user_id, activity_date) do update set
    timezone = excluded.timezone,
    qualifies_for_streak = excluded.qualifies_for_streak,
    updated_at = now();
end;
$$;

create or replace function public.recompute_streak_qualification_after_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and (old.user_id, old.local_date) is distinct from (new.user_id, new.local_date) then
    perform public.recompute_daily_activity_streak_qualification(old.user_id, old.local_date);
  end if;

  perform public.recompute_daily_activity_streak_qualification(
    coalesce(new.user_id, old.user_id),
    coalesce(new.local_date, old.local_date)
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists self_care_goal_completions_streak_qualification
  on public.self_care_goal_completions;
create trigger self_care_goal_completions_streak_qualification
after insert or delete on public.self_care_goal_completions
for each row execute function public.recompute_streak_qualification_after_completion();

drop trigger if exists mood_check_ins_streak_qualification
  on public.mood_check_ins;
create trigger mood_check_ins_streak_qualification
after insert or update or delete on public.mood_check_ins
for each row execute function public.recompute_streak_qualification_after_completion();

drop trigger if exists program_action_completions_streak_qualification
  on public.program_action_completions;
create trigger program_action_completions_streak_qualification
after insert or update or delete on public.program_action_completions
for each row execute function public.recompute_streak_qualification_after_completion();

-- The existing breath-hold cleanup owns the counters. Delegate the final
-- qualification to the shared rule so deleting a breath hold cannot erase a
-- to-do, check-in, or lesson that still earned the day.
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

  update public.daily_activity
  set
    daily_breath_hold_completed = v_count > 0,
    breath_hold_count = v_count,
    best_hold_seconds = v_best,
    updated_at = now()
  where user_id = old.user_id
    and activity_date = old.local_date;

  perform public.recompute_daily_activity_streak_qualification(
    old.user_id,
    old.local_date
  );

  return old;
end;
$$;

-- Existing completions should read by the new rule too, rather than creating
-- a rule boundary on the day this migration is deployed.
with qualifying_dates as (
  select user_id, local_date from public.self_care_goal_completions
  union
  select user_id, local_date from public.mood_check_ins
  union
  select user_id, local_date
  from public.program_action_completions
  where activity_id like 'lesson:%'
)
insert into public.daily_activity (
  user_id, activity_date, timezone, qualifies_for_streak
)
select qualifying_dates.user_id, qualifying_dates.local_date, profiles.timezone, true
from qualifying_dates
join public.profiles on profiles.user_id = qualifying_dates.user_id
on conflict (user_id, activity_date) do update set
  timezone = excluded.timezone,
  qualifies_for_streak = true,
  updated_at = now();
