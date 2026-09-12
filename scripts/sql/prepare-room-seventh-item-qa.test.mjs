import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { roomProgress } from '../../src/lib/room/roomProgress.ts';

const here = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(here, 'prepare-room-seventh-item-qa.sql'), 'utf8');
const roomScene = readFileSync(
  join(here, '..', '..', 'src', 'features', 'room', 'RoomScene.tsx'),
  'utf8',
);

const setup = sql.slice(0, sql.indexOf('-- POST-TEST VERIFICATION'));
const fixtureRows = [...setup.matchAll(
  /\(v_user_id, v_room_id, '(day[1-7])', '([^']+)',\s+v_today - (\d+)\)/g,
)].map(([, slot, optionId, daysAgo]) => ({
  slot,
  optionId,
  daysAgo: Number(daysAgo),
}));

test('the production QA fixture prepares the real next slot at 6/7', () => {
  assert.deepEqual(fixtureRows, [
    { slot: 'day1', optionId: 'checker_rug', daysAgo: 6 },
    { slot: 'day2', optionId: 'study_desk', daysAgo: 5 },
    { slot: 'day3', optionId: 'bookcase', daysAgo: 4 },
    { slot: 'day4', optionId: 'monstera', daysAgo: 3 },
    { slot: 'day5', optionId: 'gallery_wall', daysAgo: 2 },
    { slot: 'day6', optionId: 'day_window', daysAgo: 1 },
  ]);

  const progress = roomProgress({
    decorations: fixtureRows.map(({ slot, daysAgo }) => ({
      slot,
      earnedLocalDate: `before-today-${daysAgo}`,
    })),
    lastEarnedLocalDate: 'before-today-1',
    todayLocalDate: 'today',
    dailiesComplete: true,
  });

  assert.equal(progress.placedCount, 6);
  assert.equal(progress.nextSlot, 'day7');
  assert.equal(progress.isComplete, false);
  assert.equal(progress.claimedToday, false);
  assert.equal(progress.canClaim, true);
});

test('every seeded option still has authored room artwork', () => {
  for (const { slot, optionId } of fixtureRows) {
    assert.ok(
      roomScene.includes(`"${slot}.${optionId}":`),
      `${slot}.${optionId} is missing from RoomScene`,
    );
  }
});

test('the fixture is dry-run by default and requires an explicit destructive reset', () => {
  assert.match(setup, /begin;/);
  assert.match(setup, /rollback;\s*-- commit;/);
  assert.match(setup, /v_email text := '<QA_EMAIL>'/);
  assert.match(setup, /v_expected_user_id uuid := null/);
  assert.match(setup, /v_device_timezone text := 'America\/Toronto'/);
  assert.match(setup, /v_allow_destructive_reset boolean := false/);
  assert.match(setup, /if not v_allow_destructive_reset then/);
  assert.match(setup, /from auth\.users/);
  assert.match(setup, /from public\.profiles/);
  assert.match(setup, /onboarding_completed_at is not null/);
});

test('destructive reset is scoped to the selected user and local test date', () => {
  assert.match(
    setup,
    /delete from public\.rooms\s+where user_id = v_user_id;/,
  );
  assert.match(
    setup,
    /delete from public\.breathing_sessions\s+where user_id = v_user_id\s+and local_date = v_today;/,
  );
  assert.match(
    setup,
    /delete from public\.breath_hold_sessions\s+where user_id = v_user_id\s+and local_date = v_today;/,
  );

  assert.doesNotMatch(setup, /delete from public\.profiles/);
  assert.doesNotMatch(setup, /delete from auth\.users/);
  assert.doesNotMatch(setup, /delete from public\.daily_activity/);
  assert.doesNotMatch(setup, /delete from public\.heart_rate_sessions/);
});

test('today exercise counters reset without touching heart-rate or XP counters', () => {
  const activityReset = setup.slice(
    setup.indexOf('update public.daily_activity'),
    setup.indexOf('get diagnostics v_reset_daily_activity_rows'),
  );

  for (const reset of [
    'daily_breath_hold_completed = false',
    'breath_hold_count = 0',
    'best_hold_seconds = null',
    'breathing_session_count = 0',
    'breathing_seconds = 0',
    'qualifies_for_streak = false',
  ]) {
    assert.ok(activityReset.includes(reset), `missing activity reset: ${reset}`);
  }

  assert.match(
    activityReset,
    /where user_id = v_user_id\s+and activity_date = v_today;/,
  );
  assert.doesNotMatch(activityReset, /heart_rate_capture_count\s*=/);
  assert.doesNotMatch(activityReset, /xp_earned\s*=/);
  assert.match(setup, /Destructive reset verification failed/);
});

/**
 * The fixture leaves the account one to-do away from the seventh piece: the
 * exercises are seeded done, the to-do ticks are cleared. Ticking one in the
 * app then runs the real earn rule rather than a forced flag.
 */
test('today is seeded complete on exercises but not on to-dos', () => {
  // Every active technique, because the app decides which two count from the
  // day's recommendation and plan.
  assert.match(
    setup,
    /insert into public\.breathing_sessions[\s\S]*from public\.breathing_technique_catalog as catalog\s+where catalog\.active = true;/,
  );
  assert.match(setup, /insert into public\.breath_hold_sessions/);
  assert.match(setup, /daily_breath_hold_completed = true/);

  // Today's ticks go; the to-dos themselves are the account's own.
  assert.match(
    setup,
    /delete from public\.self_care_goal_completions\s+where user_id = v_user_id\s+and local_date = v_today;/,
  );
  assert.doesNotMatch(setup, /delete from public\.self_care_goals\b/);
});

test('the fixture refuses to run for an account with no to-dos to tick', () => {
  assert.match(setup, /if v_active_todos = 0 then/);
  assert.match(setup, /raise exception[\s\S]*no to-dos/);
});

/**
 * The exercises are seeded because they are the only part of the day that costs
 * real time. The to-do list is left for the tester, so the earn still happens
 * through the real path rather than arriving already earned.
 */
test('the to-do list is left outstanding rather than seeded', () => {
  assert.doesNotMatch(setup, /insert into public\.self_care_goal_completions/);
  assert.match(
    setup,
    /\) <> 0 then/,
    'the seeded-day check must assert that no to-do is ticked',
  );
});

test('the seeded day is verified before the fixture reports success', () => {
  const verification = setup.slice(
    setup.indexOf('Seeded-day verification failed'),
  );

  assert.ok(verification.length > 0, 'no seeded-day verification');
  assert.match(
    setup.slice(0, setup.indexOf('Seeded-day verification failed')),
    /insert into public\.breath_hold_sessions/,
    'verification must come after the seeding it checks',
  );
});

/**
 * The fixture seeds a session for every row in the database's technique
 * catalog, and the app picks the day's two techniques from its own mirror of
 * that catalog — kept in step by `techniqueCatalog.test.mjs`. So whichever two
 * the app asks for on the test day, the fixture has already completed.
 */
test('every technique the app can ask for is one the fixture seeds', async () => {
  const { TECHNIQUE_IDS } = await import(
    '../../src/features/exercise/guidedBreathing/techniqueCatalog.ts'
  );

  assert.ok(TECHNIQUE_IDS.length > 0);
  assert.match(
    setup,
    /from public\.breathing_technique_catalog as catalog\s+where catalog\.active = true;/,
    'the seeding must come from the catalog, not a hard-coded list that can drift',
  );
  assert.doesNotMatch(
    setup,
    /technique_id\s*(?:=|in)\s*'/,
    'no technique id may be named in the fixture',
  );
});

test('the fixture writes only columns that exist, and every required one', () => {
  // Guards the three inserts the seeding added. The reset half was already
  // covered; this fails if a migration renames or drops what it writes.
  const inserts = [...setup.matchAll(/insert into public\.(\w+)\s*\(([^)]*)\)/g)].map(
    ([, table, cols]) => ({
      table,
      cols: cols
        .split(',')
        .map((col) => col.trim())
        .filter(Boolean),
    }),
  );

  const seeded = Object.fromEntries(inserts.map(({ table, cols }) => [table, cols]));

  assert.deepEqual(seeded.breathing_sessions, [
    'user_id',
    'technique_id',
    'started_at',
    'ended_at',
    'local_date',
    'timezone',
    'duration_seconds',
    'completed',
  ]);
  assert.deepEqual(seeded.breath_hold_sessions, [
    'user_id',
    'started_at',
    'ended_at',
    'local_date',
    'timezone',
    'hold_seconds',
  ]);
  assert.ok(seeded.daily_activity.includes('daily_breath_hold_completed'));
  assert.ok(seeded.daily_activity.includes('breathing_session_count'));
});
