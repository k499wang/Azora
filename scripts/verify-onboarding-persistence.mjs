// Run the actual profile/preference services against an isolated PostgreSQL
// database with production migrations and RLS. The small query adapter replaces
// PostgREST transport only; it is not a live Supabase or native-app test.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';
import * as recovery from '../src/services/profile/onboardingProfileRecovery.ts';
import * as scheduleRules from '../src/services/dailyPlan/dailyPlanScheduleCore.ts';
import * as scheduleTypes from '../src/services/dailyPlan/types.ts';
import * as exerciseRules from '../src/features/exercise/guidedBreathing/domain/dailyExercisePlan.ts';

const driver = process.argv[2] == null
  ? '@electric-sql/pglite'
  : pathToFileURL(resolve(process.argv[2])).href;
const { PGlite } = await import(driver);
const db = new PGlite();
const userId = '00000000-0000-4000-8000-000000000001';
const otherUserId = '00000000-0000-4000-8000-000000000002';
const plain = (value) => JSON.parse(JSON.stringify(value));

function service(path, dependencies = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports,
    Intl,
    require(name) {
      if (name === '../supabase' || name === '../supabase/client') {
        return { requireSupabaseClient: () => client };
      }
      assert.ok(name in dependencies, `Unexpected import: ${name}`);
      return dependencies[name];
    },
  });
  return exports;
}

function identifier(value) {
  assert.match(value, /^[a-z_]+$/);
  return `"${value}"`;
}

// Only the select/equality/upsert operations used by these services are modeled.
const client = {
  from(table) {
    assert.ok(['profiles', 'user_preferences'].includes(table));
    let columns;
    let filter;
    let payload;
    const query = {
      select(value) { columns = value.split(',').map((name) => identifier(name.trim())).join(','); return this; },
      eq(column, value) { filter = { column, value }; return this; },
      upsert(value, options) {
        assert.equal(options.onConflict, 'user_id');
        payload = value;
        return this;
      },
      async execute() {
        try {
          if (payload) {
            const keys = Object.keys(payload);
            const values = Object.values(payload).map((value) =>
              value != null && typeof value === 'object' ? JSON.stringify(value) : value);
            const update = keys.filter((key) => key !== 'user_id')
              .map((key) => `${identifier(key)} = excluded.${identifier(key)}`).join(',');
            await db.query(`insert into public.${identifier(table)} (${keys.map(identifier).join(',')})
              values (${keys.map((_, index) => `$${index + 1}`).join(',')})
              on conflict (user_id) ${update ? `do update set ${update}` : 'do nothing'}`, values);
            return { data: null, error: null };
          }
          assert.ok(columns && filter);
          const { rows } = await db.query(`select ${columns} from public.${identifier(table)} where ${identifier(filter.column)} = $1`, [filter.value]);
          assert.ok(rows.length <= 1);
          return { data: rows[0] ?? null, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      maybeSingle() { return this.execute(); },
      then(onFulfilled, onRejected) { return this.execute().then(onFulfilled, onRejected); },
    };
    return query;
  },
};

try {
  // Supabase normally provides auth.uid(), roles and default schema grants.
  // Only those platform primitives are fixtures; tables/policies are migrated.
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create schema extensions;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function extensions.gen_random_uuid() returns uuid language sql as
      $$ select gen_random_uuid() $$;
    grant usage on schema public, auth to anon, authenticated;
    alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
  `);

  for (const name of [
    '20260420000100_create_launch_schema.sql',
    '20260420000200_enable_rls.sql',
    '20260425000100_add_profile_onboarding_completion.sql',
    '20260503000100_add_onboarding_personalization.sql',
    '20260504000100_add_onboarding_assessment.sql',
    '20260516000100_add_notification_preferences.sql',
    '20260728000100_add_onboarding_attribution.sql',
    '20260730000200_add_daily_plan_schedule.sql',
    '20260730000300_add_daily_plan_exercises.sql',
  ]) {
    const sql = readFileSync(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8');
    // PGlite has core gen_random_uuid(), but no pgcrypto extension package.
    await db.exec(sql.replace('create extension if not exists pgcrypto with schema extensions;', ''));
  }
  await db.query('insert into auth.users (id) values ($1), ($2)', [userId, otherUserId]);
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${userId}';`);

  const bootstrap = service('../src/services/profile/profileBootstrapService.ts');
  const profile = service('../src/services/profile/onboardingStatusService.ts', {
    './profileBootstrapService': bootstrap,
    './onboardingProfileRecovery': recovery,
  });
  const survey = service('../src/services/profile/onboardingSurveyService.ts');
  const schedule = service('../src/services/dailyPlan/dailyPlanScheduleService.ts', {
    './dailyPlanScheduleCore': scheduleRules,
    './types': scheduleTypes,
  });
  const exercises = service('../src/services/dailyPlan/dailyPlanExercisesService.ts', {
    '../../features/exercise/guidedBreathing/domain/dailyExercisePlan': exerciseRules,
  });

  assert.equal(await profile.getOnboardingStatus(userId), false);
  assert.equal(await profile.getSavedOnboardingProfile(userId), null);
  await survey.saveOnboardingSurveyAnswers(userId, { acquisitionSource: 'app_store_search' });
  const chosenSchedule = {
    version: 1, timeMode: 'device_local',
    actions: { session: '21:30', handPicked: '13:15', windDown: '22:15' },
  };
  const chosenExercises = exerciseRules.buildGrowthAreaSevenDayExercisePlanV2({
    primaryTechniqueId: 'relaxing', growthAreaAxis: 'recovery', startsOn: '2026-10-14',
  });
  await schedule.updateDailyPlanSchedule(userId, chosenSchedule);
  await exercises.updateDailyPlanExercises(userId, chosenExercises);
  assert.equal(await profile.getSavedOnboardingProfile(userId), null, 'preferences alone must not mark the profile ready to resume');

  const input = {
    onboardingGoal: 'Sleep better', displayName: 'Persistence check', age: 30,
    gender: null, dailyMinutes: 5, defaultTechniqueId: 'relaxing',
    stressLevel: 7, sleepQuality: 3, agreementResponses: { legacy_statement: 'agree' },
  };
  await profile.saveOnboardingProfile(userId, input);
  assert.deepEqual(plain(await profile.getSavedOnboardingProfile(userId)), input);
  assert.deepEqual(await schedule.getDailyPlanSchedule(userId), chosenSchedule);
  const exerciseRead = await exercises.getDailyPlanExercises(userId);
  assert.deepEqual(exerciseRead.plan, chosenExercises);
  assert.equal((await db.query('select acquisition_source from public.profiles where user_id = $1', [userId])).rows[0].acquisition_source, 'app_store_search');
  assert.equal(await profile.getOnboardingStatus(userId), false);
  await profile.markOnboardingCompleted(userId);
  assert.equal(await profile.getOnboardingStatus(userId), true);
  assert.deepEqual(plain(await profile.getSavedOnboardingProfile(userId)), input);
  await profile.saveOnboardingProfile(userId, input);
  assert.equal(await profile.getOnboardingStatus(userId), true, 'retrying profile save must preserve completion');
  assert.equal((await db.query('select count(*)::int as count from public.profiles')).rows[0].count, 1);
  console.log('PASS real profile, survey, schedule and exercise services round-trip through PostgreSQL; retry preserves completion and acquisition source.');

  await assert.rejects(profile.saveOnboardingProfile(userId, { ...input, stressLevel: 11 }), /profiles_stress_level_range_check/);
  assert.deepEqual(plain(await profile.getSavedOnboardingProfile(userId)), input, 'invalid writes must not corrupt an existing profile');
  await db.exec(`set request.jwt.claim.sub = '${otherUserId}';`);
  assert.equal(await profile.getSavedOnboardingProfile(userId), null);
  await assert.rejects(profile.saveOnboardingProfile(userId, input), /row-level security/);
  await assert.rejects(schedule.updateDailyPlanSchedule(userId, chosenSchedule), /row-level security/);
  await db.exec("set role anon; set request.jwt.claim.sub = '';");
  assert.equal(await profile.getSavedOnboardingProfile(userId), null);
  await assert.rejects(profile.saveOnboardingProfile(userId, input), /row-level security/);
  console.log('PASS database constraints reject invalid scores; RLS blocks cross-user and anonymous profile access and writes.');
} finally {
  await db.close();
}
