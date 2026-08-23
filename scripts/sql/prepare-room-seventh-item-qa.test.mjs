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

test('the fixture is dry-run by default and refuses unsafe account state', () => {
  assert.match(setup, /begin;/);
  assert.match(setup, /rollback;\s*-- commit;/);
  assert.match(setup, /v_email text := '<QA_EMAIL>'/);
  assert.match(setup, /v_expected_user_id uuid := null/);
  assert.match(setup, /v_device_timezone text := 'America\/Toronto'/);
  assert.match(setup, /from auth\.users/);
  assert.match(setup, /from public\.profiles/);
  assert.match(setup, /onboarding_completed_at is not null/);
  assert.match(setup, /from public\.breathing_sessions/);
  assert.match(setup, /from public\.breath_hold_sessions/);
  assert.match(setup, /daily_breath_hold_completed = true/);
  assert.match(setup, /from public\.rooms/);
  assert.match(setup, /from public\.room_decorations/);
  assert.doesNotMatch(setup, /delete from/);
});
