// Runs production plan migrations in an isolated PostgreSQL WASM database.
// Pass the path to a temporary @electric-sql/pglite installation (see README).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import ts from 'typescript';

const driver = process.argv[2] == null
  ? '@electric-sql/pglite'
  : pathToFileURL(resolve(process.argv[2])).href;
const { PGlite } = await import(driver);
const db = new PGlite();
const today = '2026-10-11';

// Run the actual historical parsers, rather than copying their validation.
// These commits represent the pre-light-day and empty-day-aware clients;
// repository history is evidence of behavior, not proof of a shipped binary.
function historicalEnrollmentService(commit) {
  const source = execFileSync('git', ['show', `${commit}:src/services/program/programEnrollmentService.ts`], {
    cwd: new URL('..', import.meta.url), encoding: 'utf8',
  });
  return enrollmentService(source);
}

function enrollmentService(source) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { exports, require: () => ({}) });
  return exports;
}
const preLightDayClient = historicalEnrollmentService('e616ff12');
const emptyDayAwareClient = historicalEnrollmentService('f263b7ec');
const currentClient = enrollmentService(readFileSync(new URL('../src/services/program/programEnrollmentService.ts', import.meta.url), 'utf8'));

// Resolve real new enrollments through the app's catalogue and domain code.
// Keep the documented harness command usable without requiring its own loader.
const currentPlans = JSON.parse(execFileSync(process.execPath, [
  '--disable-warning=ExperimentalWarning', '--disable-warning=MODULE_TYPELESS_PACKAGE_JSON',
  '--loader', new URL('./resolve-extensionless-ts.mjs', import.meta.url).href,
  '--input-type=module', '--eval', `
    import { allProgramPresets, latestProgramPreset } from './src/features/program/domain/programCatalogue.ts';
    import { buildProgramEnrollment } from './src/features/program/domain/programEnrollment.ts';
    import { LESSON_REVISION } from './src/features/lessons/domain/lessonCatalogue.ts';
    const plans = [...new Set(allProgramPresets().map(preset => preset.planId))].flatMap(planId =>
      (planId === 'pressure' ? ['stress', 'overthinking', 'anger'] : [undefined]).map(pressureLessonTrack => {
        const result = buildProgramEnrollment({ enrollmentId: '', planId,
          presetRevision: latestProgramPreset(planId).revision, pressureLessonTrack, enrolledOn: '${today}' });
        if (result.status !== 'enrolled') throw new Error('Cannot resolve ' + planId);
        return { ...result.enrollment, pressureLessonTrack, lessonRevision: LESSON_REVISION };
      }));
    console.log(JSON.stringify(plans));
  `,
], { cwd: new URL('..', import.meta.url), encoding: 'utf8' }));

// Existing profile, breathing, mood, routine, wallet and daily-activity tables
// are minimal fixtures. Plan/room tables, constraints, RPCs, RLS and their
// reward/advancement triggers are loaded from production migrations.
await db.exec(`
  create role anon;
  create role authenticated;
  -- Supabase supplies schema access and default table grants separately from
  -- these migrations. Model those platform defaults so real RLS is exercised.
  grant usage on schema public to authenticated;
  alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
  create schema auth;
  create schema extensions;
  grant usage on schema auth, extensions to authenticated;
  create function auth.uid() returns uuid language sql as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  create function extensions.gen_random_uuid() returns uuid language sql as $$
    select pg_catalog.gen_random_uuid()
  $$;
  create function public.update_updated_at() returns trigger language plpgsql as $$
    begin new.updated_at := now(); return new; end
  $$;
  create table public.profiles (user_id uuid primary key, timezone text default 'UTC', created_at timestamptz default now());
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
  '20260807000100_create_room_hotel.sql',
  '20260807000200_room_daily_earn.sql',
  '20260907000200_prepare_room_inventory.sql',
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

async function scenario({ adopted = false, final = false, exactLesson = true, resetFree = false } = {}) {
  const userId = await scalar('select gen_random_uuid()');
  await db.query('insert into public.profiles (user_id) values ($1)', [userId]);
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
  const day = (number) => ({
    day: number,
    why: 'A small step',
    activities: resetFree && number === 1 ? [] : [{
      activityId: 'attention.54321.2', activityRevision: 1,
      match: { modality: 'attention', scriptId: '54321' },
    }],
    ...(exactLesson ? { lessonActivityId: 'lesson:plan.grows' } : {}),
  });
  // An old client omits the new column entirely.
  const enrollmentId = await asAuthenticated(() => scalar(`
    insert into public.program_enrollments
      (user_id, plan_id, preset_revision, resolver_version, enrolled_on, resolved)
    values ($1, 'night', 4, 1, $2, $3) returning id
  `, [userId, today, JSON.stringify({ days: [day(1), day(2)] })]));
  assert.equal(await scalar('select todo_step_from_day from public.program_enrollments where id = $1', [enrollmentId]), null);
  if (adopted) {
    const row = await asAuthenticated(() => scalar('select public.adopt_plan_todo_step_compatible()'));
    assert.equal(row.todo_step_from_day, 1);
    const repeat = await asAuthenticated(() => scalar('select public.adopt_plan_todo_step_compatible()'));
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

async function asAuthenticated(work) {
  await db.exec('set role authenticated');
  try { return await work(); } finally { await db.exec('reset role'); }
}

try {
  // Updating an existing active plan changes only its adoption marker.
  const partial = await scenario();
  await db.query(`update public.program_enrollments
    set program_day = 2, last_advanced_on = date '2026-10-10' where id = $1`, [partial.enrollmentId]);
  await asAuthenticated(() => scalar('select public.advance_program_day($1)', [JSON.stringify({
    modality: 'attention', script_id: '54321', local_date: today,
  })]));
  const savedPartial = await scalar('select to_jsonb(e) from public.program_enrollments e where id = $1', [partial.enrollmentId]);
  const savedCompletions = await scalar(`select jsonb_agg(to_jsonb(c)) from public.program_action_completions c where enrollment_id = $1`, [partial.enrollmentId]);
  const savedWallet = await scalar('select sum(delta)::int from public.wallet_entries where user_id = $1', [partial.userId]);
  const adoptedPartial = await asAuthenticated(() => scalar('select public.adopt_plan_todo_step_compatible()'));
  assert.equal(adoptedPartial.todo_step_from_day, 2);
  for (const field of ['id', 'program_day', 'preset_revision', 'resolver_version', 'enrolled_on', 'last_advanced_on', 'status', 'resolved']) {
    assert.deepEqual(adoptedPartial[field], savedPartial[field], `adoption preserves ${field}`);
  }
  assert.deepEqual(await scalar(`select jsonb_agg(to_jsonb(c)) from public.program_action_completions c where enrollment_id = $1`, [partial.enrollmentId]), savedCompletions);
  assert.equal(await scalar('select sum(delta)::int from public.wallet_entries where user_id = $1', [partial.userId]), savedWallet);
  const repeatPartial = await asAuthenticated(() => scalar('select public.adopt_plan_todo_step_compatible()'));
  assert.deepEqual(repeatPartial, adoptedPartial);

  // An old app finished day 1 before updating: do not add a claim to that day.
  const alreadyFinished = await scenario();
  assert.equal((await finishVisibleSteps(alreadyFinished.userId)).outcome, 'advanced');
  const adoptedFinishedDay = await asAuthenticated(() => scalar('select public.adopt_plan_todo_step_compatible()'));
  assert.equal(adoptedFinishedDay.program_day, 2);
  assert.equal(adoptedFinishedDay.todo_step_from_day, 2);
  await db.query('insert into public.self_care_goal_completions values ($1, $2)', [alreadyFinished.userId, today]);
  assert.equal((await claim()).outcome, 'not_required', 'adoption cannot reopen the day already finished today');
  const nextDate = '2026-10-12';
  await db.query('insert into public.self_care_goal_completions values ($1, $2)', [alreadyFinished.userId, nextDate]);
  const nextClaim = await asAuthenticated(() => scalar('select public.claim_plan_todo_step($1)', [JSON.stringify({ localDate: nextDate })]));
  assert.equal(nextClaim.outcome, 'recorded');
  assert.equal(nextClaim.programDay, 2);
  assert.equal(nextClaim.coinsAwarded, 10);

  const finishedPlan = await scenario({ final: true });
  assert.equal((await finishVisibleSteps(finishedPlan.userId)).outcome, 'completed');
  assert.equal(await asAuthenticated(() => scalar('select public.adopt_plan_todo_step_compatible()')), null);
  assert.equal(await scalar('select todo_step_from_day from public.program_enrollments where id = $1', [finishedPlan.enrollmentId]), null);
  console.log('PASS: existing-plan adoption preserves snapshot/progress/completions/coins, skips finished days and completed plans, and supports the next day');

  const legacy = await scenario({ adopted: true });
  const before = await scalar('select to_jsonb(e) from public.program_enrollments e where id = $1', [legacy.enrollmentId]);
  const olderRead = preLightDayClient.sanitizeEnrollmentRow(before);
  assert.ok(olderRead);
  assert.equal(olderRead.resolved.days.length, before.resolved.days.length);
  assert.equal(olderRead.resolved.days[0].activities[0].activityId, 'attention.54321.2');
  assert.equal(olderRead.todoStepFromDay, undefined, 'old parser ignores the additive column');
  const finish = await asAuthenticated(() => finishVisibleSteps(legacy.userId));
  assert.equal(finish.outcome, 'advanced');
  const after = await scalar('select to_jsonb(e) from public.program_enrollments e where id = $1', [legacy.enrollmentId]);
  assert.deepEqual(after.resolved, before.resolved, 'advancement must preserve the frozen snapshot');
  assert.equal(preLightDayClient.sanitizeEnrollmentRow(after).programDay, 2);
  const roomId = await asAuthenticated(() => scalar(`insert into public.rooms (user_id) values ($1) returning id`, [legacy.userId]));
  await asAuthenticated(() => db.query(`insert into public.room_decorations
    (user_id, room_id, slot, option_id, earned_local_date) values ($1, $2, 'day1', 'checker_rug', $3)`,
    [legacy.userId, roomId, today]));
  assert.equal(await asAuthenticated(() => scalar('select count(*)::int from public.room_decorations')), 1);
  assert.equal(await asAuthenticated(() => scalar('select count(*)::int from public.owned_objects')), 1);
  assert.equal(await asAuthenticated(() => scalar('select count(*)::int from public.room_reward_history')), 1);
  const other = await scenario();
  assert.equal(await asAuthenticated(() => scalar('select count(*)::int from public.room_decorations')), 0, 'room rewards remain private');
  assert.equal(await asAuthenticated(() => scalar('select count(*)::int from public.program_enrollments where id = $1', [legacy.enrollmentId])), 0);
  await assert.rejects(asAuthenticated(() => db.query('select public.advance_program_day_if_ready($1, $2)', [other.userId, today])), /permission denied/);
  await assert.rejects(asAuthenticated(() => db.query('update public.program_enrollments set program_day = 2 where id = $1', [other.enrollmentId])), /permission denied/);
  await assert.rejects(asAuthenticated(() => db.query('update public.program_enrollments set resolved = resolved where id = $1', [other.enrollmentId])), /permission denied/);
  await assert.rejects(asAuthenticated(() => db.query(`insert into public.program_action_completions
    (enrollment_id, user_id, program_day, activity_id, activity_revision, local_date)
    values ($1, $2, 1, 'todo:claim', 1, $3)`, [other.enrollmentId, other.userId, today])), /row-level security/);
  console.log('PASS: historical parser reload, authenticated legacy advancement, frozen snapshot, room reward mirroring and RLS');

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

  for (const moodFirst of [true, false]) {
    const { userId, enrollmentId } = await scenario({ adopted: true, resetFree: true });
    const snapshot = await scalar('select to_jsonb(e) from public.program_enrollments e where id = $1', [enrollmentId]);
    assert.equal(preLightDayClient.sanitizeEnrollmentRow(snapshot), null,
      'opening a new light-day plan in the old parser is unsupported');
    const readable = emptyDayAwareClient.sanitizeEnrollmentRow(snapshot);
    assert.ok(readable, 'the empty-day-aware parser retains the enrollment');
    assert.equal(readable.resolved.days[0].activities.length, 0);
    const saveMood = () => db.query('insert into public.mood_check_ins values ($1, $2)', [userId, today]);
    const saveLesson = () => scalar('select public.record_lesson_read($1)', [JSON.stringify({
      lessonId: 'plan.grows', revision: 9, localDate: today,
    })]);
    if (moodFirst) await saveMood(); else await saveLesson();
    assert.equal(await scalar('select program_day from public.program_enrollments where id = $1', [enrollmentId]), 1);
    if (moodFirst) await saveLesson(); else await saveMood();
    assert.equal(await scalar('select program_day from public.program_enrollments where id = $1', [enrollmentId]), 2);
    await db.query('insert into public.self_care_goal_completions values ($1, $2)', [userId, today]);
    const todo = await claim();
    assert.equal(todo.outcome, 'recorded');
    assert.equal(todo.programDay, 1);
    assert.equal(todo.coinsAwarded, 10);
  }
  console.log('PASS: Reset-free day one advances through mood and lesson in either order and claims its to-do');

  let verifiedDays = 0;
  for (const plan of currentPlans) {
    const context = `${plan.planId}/${plan.pressureLessonTrack ?? 'default'}`;
    const userId = await scalar('select gen_random_uuid()');
    await db.query('insert into public.profiles (user_id) values ($1)', [userId]);
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
    const enrollmentId = await asAuthenticated(() => scalar(`
      insert into public.program_enrollments
        (user_id, plan_id, preset_revision, resolver_version, enrolled_on, resolved)
      values ($1, $2, $3, $4, $5, $6) returning id
    `, [userId, plan.planId, plan.presetRevision, plan.resolverVersion, today, JSON.stringify(plan.resolved)]));
    await asAuthenticated(() => scalar('select public.adopt_plan_todo_step_compatible()'));
    let roomId;
    for (const day of plan.resolved.days) {
      const localDate = new Date(Date.parse(`${today}T00:00:00Z`) + (day.day - 1) * 86400000).toISOString().slice(0, 10);
      const claimDay = () => asAuthenticated(() => scalar('select public.claim_plan_todo_step($1)', [JSON.stringify({ localDate })]));
      assert.equal((await claimDay()).outcome, 'no_todo_ticked', `${context} day ${day.day} requires today's tick`);
      await db.query('insert into public.self_care_goal_completions values ($1, $2)', [userId, localDate]);
      const claimFirst = day.day % 2 === 0 && day.day < plan.resolved.days.length;
      if (claimFirst) assert.equal((await claimDay()).coinsAwarded, 10);

      const saveMood = () => db.query('insert into public.mood_check_ins values ($1, $2)', [userId, localDate]);
      const saveLesson = () => asAuthenticated(() => scalar('select public.record_lesson_read($1)', [JSON.stringify({
        lessonId: day.lessonActivityId.slice('lesson:'.length), revision: plan.lessonRevision, localDate,
      })]));
      const saveResets = async () => {
        for (const { match } of day.activities) {
          await asAuthenticated(() => scalar('select public.advance_program_day($1)', [JSON.stringify({
            modality: match.modality, technique_id: match.techniqueId,
            script_id: match.scriptId, local_date: localDate,
          })]));
        }
      };
      const order = day.day % 3 === 0 ? [saveResets, saveLesson, saveMood]
        : day.day % 3 === 1 ? [saveMood, saveResets, saveLesson]
          : [saveLesson, saveMood, saveResets];
      const requiredActions = order.filter(action => action !== saveResets || day.activities.length > 0);
      for (const [index, action] of requiredActions.entries()) {
        await action();
        if (index < requiredActions.length - 1) {
          assert.equal(await scalar('select program_day from public.program_enrollments where id = $1', [enrollmentId]), day.day,
            `${context} day ${day.day} cannot advance before all its visible steps finish`);
        }
      }
      const row = await scalar('select to_jsonb(e) from public.program_enrollments e where id = $1', [enrollmentId]);
      const final = day.day === plan.resolved.days.length;
      assert.equal(row.program_day, final ? day.day : day.day + 1, `${context} day ${day.day} advances once`);
      assert.equal(row.status, final ? 'completed' : 'active', context);
      assert.equal(row.last_advanced_on, localDate);
      assert.deepEqual(row.resolved, plan.resolved, `${context} retains its exact snapshot after advancing`);
      assert.ok(currentClient.sanitizeEnrollmentRow(row), `${context} reload remains readable`);
      const todo = await claimDay();
      assert.equal(todo.outcome, 'recorded', context);
      assert.equal(todo.programDay, day.day, 'Claim still belongs to the day on screen after advancement');
      assert.equal(todo.coinsAwarded, claimFirst ? 0 : 10);
      await db.query('delete from public.self_care_goal_completions where user_id = $1 and local_date = $2', [userId, localDate]);
      const retry = await claimDay();
      assert.equal(retry.outcome, 'recorded');
      assert.equal(retry.coinsAwarded, 0, 'An un-tick and retry never revoke or pay a claim twice');

      if (day.day % 7 === 1) {
        roomId = await asAuthenticated(() => scalar('insert into public.rooms (user_id, floor) values ($1, $2) returning id',
          [userId, Math.ceil(day.day / 7)]));
      }
      await asAuthenticated(() => db.query(`insert into public.room_decorations
        (user_id, room_id, slot, option_id, earned_local_date) values ($1, $2, $3, 'checker_rug', $4)`,
        [userId, roomId, `day${(day.day - 1) % 7 + 1}`, localDate]));
      verifiedDays++;
    }
    const length = plan.resolved.days.length;
    assert.equal(await scalar("select count(*)::int from public.program_action_completions where enrollment_id = $1 and activity_id = 'todo:claim'", [enrollmentId]), length);
    assert.equal(await scalar("select sum(delta)::int from public.wallet_entries where user_id = $1 and reason = 'daily_plan_todo_claim'", [userId]), length * 10);
    assert.equal(await asAuthenticated(() => scalar('select count(*)::int from public.room_reward_history')), length);
    assert.equal(await asAuthenticated(() => scalar('select count(*)::int from public.room_decorations')), length);
  }
  console.log(`PASS: all ${currentPlans.length} current plan/track snapshots complete ${verifiedDays} actual days, with authenticated RPCs, alternating completion/claim order, reload, single-payment retries and room rewards`);
  console.log('LIMITATION CONFIRMED: pre-light-day parser rejects new empty-day snapshots; empty-day-aware parser accepts them');
} finally {
  await db.close();
}
