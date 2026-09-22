-- The photo-cleanup endpoint is an AI spend boundary. Counters are kept
-- server-only and advanced atomically before an image is sent upstream.
create table public.photo_cleanup_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  window_started_at timestamptz not null,
  window_minutes integer not null check (window_minutes in (60, 1440)),
  request_count integer not null default 0 check (request_count >= 0),
  primary key (user_id, window_started_at, window_minutes)
);

alter table public.photo_cleanup_rate_limits enable row level security;

create or replace function public.consume_photo_cleanup_quota(
  p_user_id uuid,
  p_hourly_limit integer,
  p_daily_limit integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hour_started_at timestamptz := date_trunc('hour', now());
  v_day_started_at timestamptz := date_trunc('day', now());
  v_daily_allowed boolean := false;
  v_hourly_allowed boolean := false;
begin
  if p_hourly_limit < 1 or p_daily_limit < 1 then
    raise exception 'photo cleanup limits must be positive';
  end if;

  insert into public.photo_cleanup_rate_limits (
    user_id, window_started_at, window_minutes, request_count
  ) values (p_user_id, v_day_started_at, 1440, 1)
  on conflict (user_id, window_started_at, window_minutes) do update
    set request_count = photo_cleanup_rate_limits.request_count + 1
    where photo_cleanup_rate_limits.request_count < p_daily_limit
  returning true into v_daily_allowed;

  -- A denied daily request is not sent to the provider, so it must not take an
  -- hourly slot. A denied hourly request may use one daily attempt; that is a
  -- deliberately conservative anti-abuse trade-off that never increases cost.
  if not coalesce(v_daily_allowed, false) then
    return false;
  end if;

  insert into public.photo_cleanup_rate_limits (
    user_id, window_started_at, window_minutes, request_count
  ) values (p_user_id, v_hour_started_at, 60, 1)
  on conflict (user_id, window_started_at, window_minutes) do update
    set request_count = photo_cleanup_rate_limits.request_count + 1
    where photo_cleanup_rate_limits.request_count < p_hourly_limit
  returning true into v_hourly_allowed;

  return coalesce(v_hourly_allowed, false);
end;
$$;

revoke all on function public.consume_photo_cleanup_quota(uuid, integer, integer) from public;
grant execute on function public.consume_photo_cleanup_quota(uuid, integer, integer) to service_role;
