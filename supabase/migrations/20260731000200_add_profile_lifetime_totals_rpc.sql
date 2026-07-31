-- Lifetime profile totals aggregated in Postgres so the client does not have to
-- download every session row to sum them.

create or replace function public.profile_lifetime_totals()
returns table (
  total_breaths bigint,
  total_sessions bigint,
  total_hold_seconds bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce((
      select sum(coalesce(rounds_completed, 0))
      from public.breathing_sessions
      where user_id = auth.uid()
    ), 0)::bigint as total_breaths,
    (
      coalesce((
        select count(*)
        from public.breathing_sessions
        where user_id = auth.uid()
      ), 0)
      +
      coalesce((
        select count(*)
        from public.breath_hold_sessions
        where user_id = auth.uid()
      ), 0)
    )::bigint as total_sessions,
    coalesce((
      select sum(hold_seconds)
      from public.breath_hold_sessions
      where user_id = auth.uid()
    ), 0)::bigint as total_hold_seconds;
$$;

grant execute on function public.profile_lifetime_totals() to authenticated;
