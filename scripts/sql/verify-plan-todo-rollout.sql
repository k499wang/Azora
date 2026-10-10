-- Read-only. Run in Supabase SQL Editor after applying pending migrations.
-- Every boolean in the first result should be true. The second result counts
-- snapshots older apps cannot read if an account switches back to an older
-- build. New easy-start plans intentionally contribute to these counts. This
-- query does not rewrite any history.
with functions as (
  select
    to_regprocedure('public.adopt_plan_todo_step_compatible()') as adopt,
    to_regprocedure('public.advance_program_day_if_ready(uuid,date)') as ready,
    to_regprocedure('public.claim_plan_todo_step(jsonb)') as claim,
    to_regprocedure('public.advance_program_day(jsonb)') as advance,
    to_regprocedure('public.record_lesson_read(jsonb)') as lesson
), definitions as (
  select *, pg_get_functiondef(ready) as ready_sql,
    pg_get_functiondef(claim) as claim_sql
  from functions
)
select
  adopt is not null as migration_006_present,
  ready is not null and position('todo_step_from_day' in ready_sql) = 0
    as older_apps_advance_without_todos,
  claim is not null
    and position('status in (''active'', ''completed'')' in claim_sql) > 0
    and position('v_enrollment.status = ''active''' in claim_sql) > 0
    as final_day_claim_uses_latest_definition,
  coalesce(has_function_privilege('authenticated', adopt, 'EXECUTE'), false)
    as new_app_can_adopt,
  coalesce(has_function_privilege('authenticated', advance, 'EXECUTE'), false)
    as older_apps_can_complete_resets,
  coalesce(has_function_privilege('authenticated', lesson, 'EXECUTE'), false)
    as older_apps_can_complete_lessons,
  coalesce(has_function_privilege('authenticated', claim, 'EXECUTE'), false)
    as new_app_can_claim,
  coalesce(not has_function_privilege('anon', adopt, 'EXECUTE'), false)
    and coalesce(not has_function_privilege('anon', claim, 'EXECUTE'), false)
    as anonymous_cannot_adopt_or_claim,
  not has_column_privilege('authenticated', 'public.program_enrollments', 'program_day', 'UPDATE')
    and not has_column_privilege('authenticated', 'public.program_enrollments', 'resolved', 'UPDATE')
    and not has_column_privilege('authenticated', 'public.program_enrollments', 'todo_step_from_day', 'UPDATE')
    as client_cannot_rewrite_plan_or_progress,
  ready is not null
    and not has_function_privilege('authenticated', ready, 'EXECUTE')
    and not has_function_privilege('anon', ready, 'EXECUTE')
    as internal_advancement_is_restricted
from definitions;

select
  count(*) filter (where status = 'active' and todo_step_from_day is not null)
    as active_adopted_enrollments,
  count(*) filter (where status = 'active' and has_empty_day)
    as active_snapshots_with_empty_days,
  count(*) filter (where status = 'completed' and has_empty_day)
    as completed_snapshots_with_empty_days
from (
  select enrollment.status, enrollment.todo_step_from_day,
    exists (
      select 1
      from jsonb_array_elements(enrollment.resolved->'days') as day
      where jsonb_array_length(day->'activities') = 0
    ) as has_empty_day
  from public.program_enrollments enrollment
) snapshots;
