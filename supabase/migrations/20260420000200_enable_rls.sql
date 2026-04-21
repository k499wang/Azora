-- Row-level security for launch user-owned data.

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.breath_hold_sessions enable row level security;
alter table public.breathing_sessions enable row level security;
alter table public.heart_rate_sessions enable row level security;
alter table public.heart_rate_samples enable row level security;
alter table public.daily_activity enable row level security;
alter table public.subscriptions enable row level security;
alter table public.revenuecat_events enable row level security;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (auth.uid() = user_id);

create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (auth.uid() = user_id);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "profiles_delete_own"
on public.profiles for delete
to authenticated
using (auth.uid() = user_id);

create policy "user_preferences_select_own"
on public.user_preferences for select
to authenticated
using (auth.uid() = user_id);

create policy "user_preferences_insert_own"
on public.user_preferences for insert
to authenticated
with check (auth.uid() = user_id);

create policy "user_preferences_update_own"
on public.user_preferences for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user_preferences_delete_own"
on public.user_preferences for delete
to authenticated
using (auth.uid() = user_id);

create policy "breath_hold_sessions_select_own"
on public.breath_hold_sessions for select
to authenticated
using (auth.uid() = user_id);

create policy "breathing_sessions_select_own"
on public.breathing_sessions for select
to authenticated
using (auth.uid() = user_id);

create policy "heart_rate_sessions_select_own"
on public.heart_rate_sessions for select
to authenticated
using (auth.uid() = user_id);

create policy "heart_rate_samples_select_own"
on public.heart_rate_samples for select
to authenticated
using (auth.uid() = user_id);

create policy "daily_activity_select_own"
on public.daily_activity for select
to authenticated
using (auth.uid() = user_id);

create policy "subscriptions_select_own"
on public.subscriptions for select
to authenticated
using (auth.uid() = user_id);

create policy "revenuecat_events_select_own"
on public.revenuecat_events for select
to authenticated
using (auth.uid() = user_id);

-- Subscription and RevenueCat event writes should happen server-side through
-- service-role Edge Functions or trusted back-office jobs, not client policies.
-- Tracking writes should happen through the security-definer completion RPCs
-- so sessions, samples, and daily_activity update atomically.
