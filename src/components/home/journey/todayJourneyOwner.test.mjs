import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));

test('Home renders one shared reorder controller for exercises and todos', () => {
  const home = readFileSync(join(here, '..', '..', '..', 'screens', 'HomeScreen.tsx'), 'utf8');
  const owner = readFileSync(join(here, '..', '..', '..', 'features', 'selfCare', 'TodoListSection.tsx'), 'utf8');
  assert.doesNotMatch(home, /<TodaysDailiesSection/);
  assert.equal(owner.match(/useJourneyReorder\(\{/g)?.length, 1);
  assert.match(owner, /journeyIds\.map/);
  assert.match(owner, /<DailyTaskRow/);
  assert.match(owner, /<GoalCard/);
});

test('Home does not substitute a fallback while the canonical schedule loads', () => {
  const home = readFileSync(join(here, '..', '..', '..', 'screens', 'HomeScreen.tsx'), 'utf8');
  assert.doesNotMatch(home, /DEFAULT_DAILY_PLAN_SCHEDULE/);
  assert.match(home, /dailyPlanScheduleQuery\.data \?\? null/);
  assert.match(home, /dailyPlanSchedule == null \? null : buildDailyRows/);
  assert.match(home, /scheduleLoading={dailyPlanScheduleQuery\.isPending}/);
  assert.match(home, /scheduleError={dailyPlanScheduleQuery\.isError}/);
});

test('the shared owner waits for every canonical input before creating rows', () => {
  const owner = readFileSync(join(here, '..', '..', '..', 'features', 'selfCare', 'TodoListSection.tsx'), 'utf8');
  assert.match(
    owner,
    /const journeyReady =\s*schedule != null &&\s*dailyRows != null &&\s*goalsQuery\.data != null &&\s*journeyOrderLoaded/,
  );
  assert.match(owner, /const defaultOrder = journeyReady\s*\? defaultTodayJourneyOrder\(schedule\.actions, goals\)\s*:\s*\[\]/);
  assert.match(owner, /dayDone \|\| !journeyReady\s*\? \[\]/);
  assert.match(owner, /<Skeleton key={index} height={GOAL_ROW_HEIGHT}/);
});

test('canonical readiness preserves a saved order before using chronological defaults', () => {
  const owner = readFileSync(join(here, '..', '..', '..', 'features', 'selfCare', 'TodoListSection.tsx'), 'utf8');
  assert.match(owner, /sanitizeTodayJourneyOrder\(storedJourneyOrder, defaultOrder\)/);
  assert.match(owner, /if \(journeyOrder != null\) setStoredJourneyOrder\(journeyOrder\)/);
});
