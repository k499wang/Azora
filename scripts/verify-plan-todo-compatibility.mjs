// Runs production plan migrations in an isolated PostgreSQL WASM database.
// Pass the path to a temporary @electric-sql/pglite installation (see README).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const driver = process.argv[2] == null
  ? '@electric-sql/pglite'
  : pathToFileURL(resolve(process.argv[2])).href;
const { PGlite } = await import(driver);
const db = new PGlite();
const today = '2026-10-11';

// Only unrelated platform tables/functions are fixtures. Plan tables,
// constraints, RPCs, permissions and reward/advancement triggers are real.
await db.exec(`
  create role anon;
  create role authenticated;
  create schema auth;
  create schema extensions;
  create function auth.uid() returns uuid language sql as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  create function extensions.gen_random_uuid() returns uuid language sql as $$
    select pg_catalog.gen_random_uuid()
  $$;
  create function public.update_updated_at() returns trigger language plpgsql as $$
    begin new.updated_at := now(); return new; end
  $$;
  create table public.profiles (user_id uuid primary key, timezone text default 'UTC');
  create table public.breathing_sessions (id uuid primary key);
  create table public.mood_check_ins (user_id uuid, local_date date, unique (user_id, local_date));
  create table public.self_care_goal_completions (user_id uuid, local_date date);
  create table public.wallet_entries (user_id uuid, delta int, reason text, local_date date);
  create table public.daily_activity (
    user_id uuid, activity_date date, timezone text, attention_session_count int default 0,
    qualifies_for_streak boolean, updated_at timestamptz default now(),
    primary key (user_id, activity_date)
  );
`);

for (const name of [
  '20260918000100_create_program_enrollments.sql',
  '20260919000200_record_lesson_read.sql',
  '20260922000100_require_daily_plan_set_for_progress.sql',
  '20261003000200_daily_plan_completions_earn_coins.sql',
  '20261003000300_lessons_check_ins_earn_ten_coins.sql',
  '20261011000100_plan_todo_step.sql',
  '20261011000200_restore_attention_counter.sql',
  '20261011000300_revoke_advance_if_ready.sql',
  '20261011000400_todo_tick_counts_for_plan_day.sql',
  '20261011000500_claim_completed_plan_todo_step.sql',
  '20261011000600_preserve_legacy_plan_advancement.sql',
]) {
  if (name === '20261011000600_preserve_legacy_plan_advancement.sql') {
    const rolloutSql = readFileSync(new URL('./sql/verify-plan-todo-rollout.sql', import.meta.url), 'utf8');
    const before = await db.exec(rolloutSql);
    assert.equal(before[0].rows[0].migration_006_present, false);
    assert.equal(before[0].rows[0].older_apps_advance_without_todos, false);
    console.log('PASS: rollout check detects that migrations 001–005 still require the compatibility fix');
  }
  await db.exec(readFileSync(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8'));
}

async function scalar(sql, args = []) {
  const { rows } = await db.query(sql, args);
  return Object.values(rows[0])[0];
}

async function scenario({ adopted = false, final = false, exactLesson = true } = {}) {
  const userId = await scalar('select gen_random_uuid()');
  await db.query('insert into public.profiles (user_id) values ($1)', [userId]);
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
  const day = (number) => ({
    day: number,
    why: 'A small step',
    activities: [{
      activityId: 'attention.54321.2', activityRevision: 1,
      match: { modality: 'attention', scriptId: '54321' },
    }],
    ...(exactLesson ? { lessonActivityId: 'lesson:plan.grows' } : {}),
  });
  // An old client omits the new column entirely.
  const enrollmentId = await scalar(`
    insert into public.program_enrollments
      (user_id, plan_id, preset_revision, resolver_version, enrolled_on, resolved)
    values ($1, 'night', 4, 1, $2, $3) returning id
  `, [userId, today, JSON.stringify({ days: [day(1), day(2)] })]);
  assert.equal(await scalar('select todo_step_from_day from public.program_enrollments where id = $1', [enrollmentId]), null);
  if (adopted) {
    const row = await scalar('select public.adopt_plan_todo_step_compatible()');
    assert.equal(row.todo_step_from_day, 1);
    const repeat = await scalar('select public.adopt_plan_todo_step_compatible()');
    assert.equal(repeat.todo_step_from_day, 1);
  }
  if (final) await db.query('update public.program_enrollments set program_day = 2 where id = $1', [enrollmentId]);
  return { userId, enrollmentId };
}

async function finishVisibleSteps(userId) {
  await db.query('insert into public.mood_check_ins values ($1, $2)', [userId, today]);
  const lesson = await scalar('select public.record_lesson_read($1)', [JSON.stringify({
    lessonId: 'plan.grows', revision: 9, localDate: today,
  })]);
  assert.equal(lesson.outcome, 'recorded');
  return scalar('select public.advance_program_day($1)', [JSON.stringify({
    modality: 'attention', script_id: '54321', local_date: today,
  })]);
}

async function claim() {
  return scalar('select public.claim_plan_todo_step($1)', [JSON.stringify({ localDate: today })]);
}

try {
  for (const adopted of [false, true]) {
    for (const exactLesson of [false, true]) {
      const { userId } = await scenario({ adopted, exactLesson });
      const result = await finishVisibleSteps(userId);
      assert.equal(result.outcome, 'advanced', 'old visible steps must advance with no routine goals/ticks');
      assert.equal(result.enrollment.program_day, 2);
      assert.equal(result.coinsAwarded, 20);
      const retry = await scalar('select public.advance_program_day($1)', [JSON.stringify({
        modality: 'attention', script_id: '54321', local_date: today,
      })]);
      assert.equal(retry.outcome, 'already_advanced_today');
      assert.equal(await scalar('select attention_session_count from public.daily_activity where user_id = $1', [userId]), 1);
      assert.equal((await claim()).outcome, adopted ? 'no_todo_ticked' : 'not_required');
    }
  }
  console.log('PASS: old enrollment inserts, legacy/exact lessons, mixed builds without goals, attention retries');

  for (const order of [
    ['mood', 'lesson', 'reset'], ['mood', 'reset', 'lesson'],
    ['lesson', 'mood', 'reset'], ['lesson', 'reset', 'mood'],
    ['reset', 'mood', 'lesson'], ['reset', 'lesson', 'mood'],
  ]) {
    const { userId, enrollmentId } = await scenario({ adopted: true });
    for (const action of order) {
      if (action === 'mood') {
        await db.query('insert into public.mood_check_ins values ($1, $2)', [userId, today]);
      } else if (action === 'lesson') {
        await scalar('select public.record_lesson_read($1)', [JSON.stringify({
          lessonId: 'plan.grows', revision: 9, localDate: today,
        })]);
      } else {
        // Also exercise the breathing RPC shape used by older app builds.
        await db.query(`update public.program_enrollments set resolved =
          jsonb_set(resolved, '{days,0,activities,0,match}',
            '{"modality":"breathing","techniqueId":"relaxing"}'::jsonb)
          where id = $1`, [enrollmentId]);
        await scalar('select public.advance_program_day($1)', [JSON.stringify({
          modality: 'breathing', technique_id: 'relaxing', local_date: today,
          breathing_session_id: null,
        })]);
      }
    }
    assert.equal(await scalar('select program_day from public.program_enrollments where id = $1', [enrollmentId]), 2, order.join(' → '));
  }
  console.log('PASS: older breathing payload and all six completion orders advance without a to-do');

  for (const final of [false, true]) {
    const { userId, enrollmentId } = await scenario({ adopted: true, final });
    await db.query('insert into public.self_care_goal_completions values ($1, $2)', [userId, today]);
    const result = await finishVisibleSteps(userId);
    assert.equal(result.outcome, final ? 'completed' : 'advanced');
    const first = await claim();
    assert.equal(first.outcome, 'recorded');
    assert.equal(first.programDay, final ? 2 : 1, 'claim must target the day on screen');
    assert.equal(first.enrollmentId, enrollmentId);
    assert.equal(first.coinsAwarded, 10);
    await db.query('delete from public.self_care_goal_completions where user_id = $1', [userId]);
    const retry = await claim();
    assert.equal(retry.outcome, 'recorded', 'un-ticking cannot undo a recorded claim');
    assert.equal(retry.coinsAwarded, 0);
    assert.equal(await scalar("select count(*)::int from public.wallet_entries where user_id = $1 and reason = 'daily_plan_todo_claim'", [userId]), 1);
    assert.equal(await scalar("select count(*)::int from public.program_action_completions where enrollment_id = $1 and activity_id = 'todo:claim'", [enrollmentId]), 1);
    if (final) {
      await db.query("update public.program_enrollments set last_advanced_on = '2026-10-10' where id = $1", [enrollmentId]);
      const laterRetry = await claim();
      assert.equal(laterRetry.outcome, 'recorded');
      assert.equal(laterRetry.coinsAwarded, 0, 'returning to the final day must not pay twice');
    }
  }
  console.log('PASS: ordinary/final day tick before claim, claim retries, un-tick permanence, coins paid once');

  const delayed = await scenario({ adopted: true, final: true });
  await finishVisibleSteps(delayed.userId);
  await db.query("update public.program_enrollments set last_advanced_on = '2026-10-10' where id = $1", [delayed.enrollmentId]);
  await db.query('insert into public.self_care_goal_completions values ($1, $2)', [delayed.userId, today]);
  const delayedClaim = await claim();
  assert.equal(delayedClaim.outcome, 'recorded');
  assert.equal(delayedClaim.programDay, 2);
  assert.equal(delayedClaim.coinsAwarded, 10);
  console.log('PASS: final step can still be claimed on a later day');

  const { userId } = await scenario({ adopted: true });
  const early = await scalar('select public.advance_program_day_if_ready($1, $2)', [userId, today]);
  assert.equal(early.outcome, 'recorded');
  assert.equal(early.remaining, 3, 'the existing exercise, lesson and mood requirements remain');
  await db.query('insert into public.self_care_goal_completions values ($1, $2)', [userId, today]);
  assert.equal((await claim()).outcome, 'recorded');
  const afterClaim = await scalar('select public.advance_program_day_if_ready($1, $2)', [userId, today]);
  assert.equal(afterClaim.remaining, 3, 'a claim alone cannot skip existing requirements');
  const invalid = await scalar('select public.claim_plan_todo_step($1)', [JSON.stringify({ localDate: '2026-13-40' })]);
  assert.equal(invalid.outcome, 'invalid_date');
  for (const role of ['anon', 'authenticated']) {
    assert.equal(await scalar("select has_function_privilege($1, 'public.advance_program_day_if_ready(uuid,date)', 'EXECUTE')", [role]), false);
  }
  for (const rpc of ['advance_program_day(jsonb)', 'record_lesson_read(jsonb)', 'claim_plan_todo_step(jsonb)', 'adopt_plan_todo_step_compatible()']) {
    assert.equal(await scalar('select has_function_privilege($1, $2, $3)', ['authenticated', `public.${rpc}`, 'EXECUTE']), true);
  }
  assert.equal(await scalar("select has_function_privilege('anon', 'public.advance_program_day(jsonb)', 'EXECUTE')"), false);
  console.log('PASS: required steps, malformed dates and client RPC permissions');

  const rolloutSql = readFileSync(new URL('./sql/verify-plan-todo-rollout.sql', import.meta.url), 'utf8');
  const rollout = await db.exec(rolloutSql);
  assert.ok(Object.values(rollout[0].rows[0]).every((value) => value === true));
  assert.equal(Number(rollout[1].rows[0].active_snapshots_with_empty_days), 0);
  assert.equal(Number(rollout[1].rows[0].completed_snapshots_with_empty_days), 0);
  console.log('PASS: read-only deployment verification reports all readiness checks true');
} finally {
  await db.close();
}
