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
  // The rule is that no rows are drawn until the real schedule has landed —
  // not which builder draws them. Home now picks between the plan's rows and
  // the legacy pair, and both sit behind this same guard.
  assert.match(home, /dailyPlanSchedule == null \|\| programDayLoading\s*\?\s*null/);
  assert.match(home, /buildProgramDailyRows\(\{/);
  assert.match(home, /buildDailyRows\(\{/);
  assert.match(home, /scheduleError={dailyPlanScheduleQuery\.isError}/);
});

test('the shared owner delegates order persistence to one focused hook', () => {
  const owner = readFileSync(join(here, '..', '..', '..', 'features', 'selfCare', 'TodoListSection.tsx'), 'utf8');
  assert.match(owner, /const journeyOrder = useTodayJourneyOrder\(\{/);
  assert.match(owner, /const journeyReady = journeyOrder\.ready && dailyRows != null/);
  assert.doesNotMatch(owner, /loadTodayJourneyOrder|saveTodayJourneyOrder/);
  assert.match(owner, /const journeyIds = !journeyReady\s*\? \[\]/);
  assert.doesNotMatch(owner, /\) : dayDone \? \(/);
  assert.match(owner, /<Skeleton key={index} height={GOAL_ROW_HEIGHT}/);
});

test('exercise reorder actions are attached to its focusable control', () => {
  const rows = readFileSync(join(here, '..', 'TodaysDailiesSection.tsx'), 'utf8');
  assert.doesNotMatch(rows, /<View style={styles\.taskRow} \{\.\.\.journeyReorderActions/);
  // The invariant is the pairing, not the label's copy: the same Pressable
  // that declares the accessible name is the one the reorder actions ride on.
  assert.match(
    rows,
    /<Pressable[\s\S]*accessibilityLabel=\{[^\n]*\}[\s\S]*\{\.\.\.journeyReorderActions\(onMove\)\}/,
  );
});
