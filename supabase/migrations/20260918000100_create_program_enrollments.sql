-- Named multi-week plans: one active enrollment per user, and a per-day record
-- of what actually satisfied it.
--
-- Additive. Existing app versions never read these tables and keep the rolling
-- seven-day rotation in `user_preferences.daily_plan_exercises`, which stays
-- exactly as it is — a user on an older build is unaffected, and a user who
-- rolls back keeps their rotation rather than losing a plan.
--
-- The client never writes `program_day`. It is advanced only by
-- `advance_program_day`, which locks the row and re-checks the same rule the
-- client's domain does, so two devices and a retried request cannot skip a day
-- between them.

create table public.program_enrollments (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  -- Which authored plan, at which immutable revision. A correction publishes a
  -- new revision; this row keeps naming the one the user accepted.
  plan_id text not null,
  preset_revision int not null,
  -- What compiled the snapshot below, so a later resolver can tell what made it.
  resolver_version int not null,
  enrolled_on date not null,
  -- The day that is available now, not the last one finished. One-based.
  program_day int not null default 1,
  -- The local date the day last moved. Null until the first day is finished.
  last_advanced_on date,
  status text not null default 'active',
  -- The resolved days, frozen at enrollment: which activity, which revision of
  -- it, and the reason it is there. Re-authoring the catalogue cannot change
  -- what someone is part-way through.
  resolved jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint program_enrollments_status_valid check (
    status in ('active', 'completed', 'abandoned')
  ),
  constraint program_enrollments_program_day_positive check (program_day >= 1),
  constraint program_enrollments_preset_revision_positive check (
    preset_revision >= 1
  ),
  -- A device clock far outside this range is broken, not in another timezone.
  constraint program_enrollments_enrolled_on_range check (
    enrolled_on between date '2020-01-01' and date '2100-01-01'
  ),
  constraint program_enrollments_last_advanced_on_range check (
    last_advanced_on is null
    or last_advanced_on between date '2020-01-01' and date '2100-01-01'
  ),
  -- Lets completions carry a composite foreign key, so a completion cannot name
  -- an enrollment that belongs to someone else.
  constraint program_enrollments_id_user_key unique (id, user_id)
);

-- One active plan at a time. Switching abandons the old row and inserts a new
-- one at day one; finished and abandoned rows stay for history.
create unique index program_enrollments_one_active_idx
  on public.program_enrollments (user_id)
  where status = 'active';

create index program_enrollments_user_status_idx
  on public.program_enrollments (user_id, status, created_at desc);

create trigger program_enrollments_updated_at
before update on public.program_enrollments
for each row execute function public.update_updated_at();

-- What satisfied each piece of a day. A day asks for one exercise in week one
-- and three by the last week, so this is one row per (day, activity) rather than
-- per day, and the day turns over when its last row lands.
-- `breathing_session_id` keeps the proof attached to the session that earned it.
create table public.program_action_completions (
  enrollment_id uuid not null,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  program_day int not null,
  activity_id text not null,
  -- The revision actually performed, which is not necessarily the newest.
  activity_revision int not null,
  local_date date not null,
  breathing_session_id uuid references public.breathing_sessions(id) on delete set null,
  completed_at timestamptz not null default now(),
  primary key (enrollment_id, program_day, activity_id),
  constraint program_action_completions_enrollment_fkey
    foreign key (enrollment_id, user_id)
    references public.program_enrollments (id, user_id) on delete cascade,
  constraint program_action_completions_program_day_positive check (
    program_day >= 1
  ),
  constraint program_action_completions_local_date_range check (
    local_date between date '2020-01-01' and date '2100-01-01'
  )
);

create index program_action_completions_user_date_idx
  on public.program_action_completions (user_id, local_date);

alter table public.program_enrollments enable row level security;
alter table public.program_action_completions enable row level security;

create policy "program_enrollments_select_own"
on public.program_enrollments for select to authenticated
using (auth.uid() = user_id);

create policy "program_enrollments_insert_own"
on public.program_enrollments for insert to authenticated
with check (auth.uid() = user_id);

-- Abandoning a plan is an ordinary update the client may make. Progress is not.
create policy "program_enrollments_update_own"
on public.program_enrollments for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- RLS decides which rows; this decides which columns. Without it the policy
-- above would let a client PATCH `program_day` straight to the last day, and a
-- plan that can be skipped to the end is not a plan. `status` is the only field
-- a client may set, which is how a plan is abandoned. Progress belongs to
-- `advance_program_day`, which updates it as the definer.
revoke update on public.program_enrollments from authenticated;
grant update (status) on public.program_enrollments to authenticated;

create policy "program_action_completions_select_own"
on public.program_action_completions for select to authenticated
using (auth.uid() = user_id);

-- Completions are written only by `advance_program_day`, which runs as definer.
-- No insert policy: a client that could write its own completions could credit a
-- day it never did.

/** The enrollment as the client reads it, so every return path agrees. */
create or replace function public.program_enrollment_json(
  p_row public.program_enrollments
)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select jsonb_build_object(
    'id', p_row.id,
    'plan_id', p_row.plan_id,
    'preset_revision', p_row.preset_revision,
    'resolver_version', p_row.resolver_version,
    'enrolled_on', p_row.enrolled_on,
    'program_day', p_row.program_day,
    'last_advanced_on', p_row.last_advanced_on,
    'status', p_row.status,
    'resolved', p_row.resolved
  );
$$;

/**
 * Advance one day of the active plan, if this completion is the one it asked for.
 *
 * Mirrors `advanceProgramDay` in `src/features/program/domain/programEnrollment.ts`.
 * The client runs that to show the result immediately; this is the same rule
 * under a row lock, and it is the only writer of progress. When the two
 * disagree, this one is right.
 *
 * Returns the canonical enrollment either way — including when it refuses — so
 * the caller always leaves holding the truth and never has to guess whether a
 * refusal meant failure or a day already counted.
 */
create or replace function public.advance_program_day(p_completion jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_local_date date := (p_completion->>'local_date')::date;
  v_technique_id text := nullif(p_completion->>'technique_id', '');
  v_modality text := coalesce(nullif(p_completion->>'modality', ''), 'breathing');
  v_session_id uuid := nullif(p_completion->>'breathing_session_id', '')::uuid;
  v_enrollment public.program_enrollments;
  v_day jsonb;
  v_activity_id text;
  v_activity_revision int;
  v_remaining int;
  v_outcome text;
  v_next_day int;
  v_next_status text;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if v_local_date is null then
    raise exception 'local_date is required';
  end if;

  -- The lock is the whole point: two devices finishing the same session, or one
  -- retrying, must not each read day 4 and each write day 5.
  select * into v_enrollment
  from public.program_enrollments
  where user_id = v_user_id and status = 'active'
  for update;

  if not found then
    return jsonb_build_object('outcome', 'no_active_enrollment');
  end if;

  if v_enrollment.last_advanced_on = v_local_date then
    return jsonb_build_object(
      'outcome', 'already_advanced_today',
      'enrollment', public.program_enrollment_json(v_enrollment)
    );
  end if;

  select day into v_day
  from jsonb_array_elements(v_enrollment.resolved->'days') as day
  where (day->>'day')::int = v_enrollment.program_day
  limit 1;

  if v_day is null then
    return jsonb_build_object(
      'outcome', 'no_current_day',
      'enrollment', public.program_enrollment_json(v_enrollment)
    );
  end if;

  -- The first activity of the day this completion satisfies and that is not
  -- already recorded. Each activity carries its own `match`, written by the
  -- resolver, so this never parses meaning out of an activity id and never
  -- hard-codes a technique. Breathing is the only modality it can check today;
  -- anything else refuses, because crediting work we cannot verify is how a plan
  -- advances without being done.
  select activity->>'activityId', (activity->>'activityRevision')::int
    into v_activity_id, v_activity_revision
  from jsonb_array_elements(v_day->'activities') as activity
  where activity->'match'->>'modality' = v_modality
    and v_modality = 'breathing'
    and v_technique_id is not null
    and activity->'match'->>'techniqueId' = v_technique_id
    and not exists (
      select 1
      from public.program_action_completions done
      where done.enrollment_id = v_enrollment.id
        and done.program_day = v_enrollment.program_day
        and done.activity_id = activity->>'activityId'
    )
  limit 1;

  if v_activity_id is null then
    return jsonb_build_object(
      'outcome', 'completion_does_not_match',
      'enrollment', public.program_enrollment_json(v_enrollment)
    );
  end if;

  insert into public.program_action_completions (
    enrollment_id, user_id, program_day, activity_id, activity_revision,
    local_date, breathing_session_id
  )
  values (
    v_enrollment.id, v_user_id, v_enrollment.program_day,
    v_activity_id, v_activity_revision, v_local_date, v_session_id
  )
  -- Already credited; the day's remaining count below is then unchanged, so a
  -- retry is safe rather than an error.
  on conflict (enrollment_id, program_day, activity_id) do nothing;

  -- What the day still asks for, counted after the write so two devices
  -- finishing the last two activities at once cannot both see work remaining.
  select count(*) into v_remaining
  from jsonb_array_elements(v_day->'activities') as activity
  where not exists (
    select 1
    from public.program_action_completions done
    where done.enrollment_id = v_enrollment.id
      and done.program_day = v_enrollment.program_day
      and done.activity_id = activity->>'activityId'
  );

  if v_remaining > 0 then
    return jsonb_build_object(
      'outcome', 'recorded',
      'remaining', v_remaining,
      'enrollment', public.program_enrollment_json(v_enrollment)
    );
  end if;

  if v_enrollment.program_day >= jsonb_array_length(v_enrollment.resolved->'days')
  then
    v_next_day := v_enrollment.program_day;
    v_next_status := 'completed';
    v_outcome := 'completed';
  else
    v_next_day := v_enrollment.program_day + 1;
    v_next_status := 'active';
    v_outcome := 'advanced';
  end if;

  update public.program_enrollments
  set program_day = v_next_day,
      last_advanced_on = v_local_date,
      status = v_next_status
  where id = v_enrollment.id
  returning * into v_enrollment;

  return jsonb_build_object(
    'outcome', v_outcome,
    'enrollment', public.program_enrollment_json(v_enrollment)
  );
end;
$$;

revoke all on function public.advance_program_day(jsonb) from public;
grant execute on function public.advance_program_day(jsonb) to authenticated;
revoke all on function public.program_enrollment_json(public.program_enrollments) from public;
grant execute on function public.program_enrollment_json(public.program_enrollments) to authenticated;
