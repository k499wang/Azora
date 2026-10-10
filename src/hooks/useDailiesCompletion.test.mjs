import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import {
  markSeenDailies,
  wasDayCelebrationSeen,
} from '../features/room/dailyProgressSeen.ts';

/**
 * The day is assembled from several files now, so the test assembles them too.
 *
 * Each source in `dayUnits/` owns its own loading and its own rows; this hook
 * only composes them. Compiling the real modules rather than stubbing them is
 * what keeps that honest — a guard moved into a source file is still under
 * test here, where the behaviour it protects is described.
 */
const MODULES = {
  dayUnit: './dayUnits/dayUnit.ts',
  useExerciseDayUnits: './dayUnits/useExerciseDayUnits.ts',
  useMoodDayUnit: './dayUnits/useMoodDayUnit.ts',
  useLessonDayUnit: './dayUnits/useLessonDayUnit.ts',
  useTodoDayUnit: './dayUnits/useTodoDayUnit.ts',
  useDailiesCompletion: './useDailiesCompletion.ts',
};

/** Loads one of ours for real; hands anything else the leaf stubs. */
function loadModule(name, stubs, cache = new Map()) {
  const cached = cache.get(name);
  if (cached != null) return cached;

  const compiled = ts.transpileModule(
    readFileSync(new URL(MODULES[name], import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;

  const exports = {};
  cache.set(name, exports);
  vm.runInNewContext(compiled, {
    exports,
    require: (specifier) => {
      const leaf = specifier.split('/').pop();
      return MODULES[leaf] == null ? stubs : loadModule(leaf, stubs, cache);
    },
  });
  return exports;
}

function completion(
  moodQuery,
  withProgram = true,
  lesson = null,
  lessonRead = false,
  programDay = {},
) {
  const technique = { id: 'breathing', title: 'Breathe' };
  const dependencies = {
    useTodayLocalDate: () => '2026-09-18',
    useDailiesForcedComplete: () => false,
    useProfileQuery: () => ({ isSuccess: true, data: null }),
    useRecommendedTechnique: () => ({ technique, isLoading: false }),
    useTodayProgramDay: () => ({
      isLoading: false,
      day: withProgram ? {
        enrollment: { planId: 'night' },
        programDay: 8,
        activities: [{ activityId: 'exercise', technique, completed: true }],
        lesson,
        completedActivityIds: lessonRead ? ['lesson:sleep.light'] : [],
        ...programDay,
      } : null,
    }),
    lessonRowTitle: () => 'Learn a quick sleeping tip',
    lessonActivityId: (id) => `lesson:${id}`,
    PLAN_TODO_ACTIVITY_ID: 'todo:claim',
    useMoodCheckInQuery: () => ({
      isPending: false, isFetching: false, ...moodQuery,
    }),
    useDailyExercisePlan: () => ({ techniqueId: technique.id, isLoading: false }),
    useCompletedBreathingTechniqueIdsQuery: () => ({
      data: [technique.id], isPending: false, isFetching: false,
    }),
    getTechnique: () => technique,
    resolveExerciseTitle: () => technique.title,
  };
  return loadModule('useDailiesCompletion', dependencies).useDailiesCompletion(
    'user-1',
  );
}

for (const withProgram of [true, false]) {
  const context = withProgram ? 'program' : 'legacy';

  test(`${context}: exhausted mood read retries cannot complete the day`, () => {
    const result = completion({ isError: true }, withProgram);
    assert.equal(result.units.find(unit => unit.id === 'mood')?.completed, false);
    assert.equal(result.dailiesDone, result.dailiesTotal - 1);
    assert.equal(result.allCompleted, false);
    assert.equal(result.isLoading, false);
  });

  test(`${context}: an explicitly unsupported backend omits the check-in`, () => {
    const result = completion({ data: { available: false, checkIn: null } }, withProgram);
    assert.equal(result.units.some(unit => unit.id === 'mood'), false);
    assert.equal(result.allCompleted, true);
  });

  test(`${context}: a successful empty read still requires a check-in`, () => {
    const result = completion({ data: { available: true, checkIn: null } }, withProgram);
    assert.equal(result.units.find(unit => unit.id === 'mood')?.completed, false);
    assert.equal(result.allCompleted, false);
  });

  test(`${context}: a saved check-in completes the remaining daily unit`, () => {
    const result = completion({ data: { available: true, checkIn: { id: 'saved' } } }, withProgram);
    assert.equal(result.units.find(unit => unit.id === 'mood')?.completed, true);
    assert.equal(result.allCompleted, true);
  });
}

test("most days have no lesson, so most days have no lesson row", () => {
  const result = completion({ data: { available: true, checkIn: {} } });
  assert.equal(result.units.some((unit) => unit.kind === 'lesson'), false);
});

test("a day with a lesson asks for one more thing than the day before", () => {
  const without = completion({ data: { available: true, checkIn: {} } });
  const withLesson = completion(
    { data: { available: true, checkIn: {} } },
    true,
    { id: 'sleep.light', title: 'Light is the lever' },
  );
  assert.equal(withLesson.dailiesTotal, without.dailiesTotal + 1);
  const row = withLesson.units.find((unit) => unit.kind === 'lesson');
  // The row says what kind of tip it is, not the lesson's own claim — that is
  // the first thing the lesson itself shows.
  assert.equal(row.title, 'Learn a quick sleeping tip');
  assert.equal(row.completed, false);
  assert.equal(withLesson.allCompleted, false);
});

test("a lesson already read is read, and the day can finish", () => {
  const result = completion(
    { data: { available: true, checkIn: {} } },
    true,
    { id: 'sleep.light', title: 'Light is the lever' },
    true,
  );
  assert.equal(result.units.find((unit) => unit.kind === 'lesson').completed, true);
  assert.equal(result.allCompleted, true);
});

test("a user with no plan is never asked to read a lesson", () => {
  // Lessons are placed by program day, so an account without an enrollment has
  // no day to place one on. The legacy pair of exercises stands alone.
  const result = completion(
    { data: { available: true, checkIn: {} } },
    false,
    { id: 'sleep.light', title: 'Light is the lever' },
  );
  assert.equal(result.units.some((unit) => unit.kind === 'lesson'), false);
});

test("a plan day with no Reset draws no exercise rows, not the legacy pair", () => {
  const result = completion(
    { data: { available: true, checkIn: {} } },
    true,
    { id: 'sleep.light', title: 'Light is the lever' },
    true,
    { activities: [], resolvedActivityCount: 0 },
  );
  assert.equal(result.units.some((unit) => unit.kind === 'exercise'), false);
  assert.deepEqual([...result.units.map((unit) => unit.kind)], ['mood', 'lesson']);
  assert.equal(result.allCompleted, true);
});

test("a plan day whose activities this build cannot draw falls back to the pair", () => {
  const result = completion(
    { data: { available: true, checkIn: {} } },
    true,
    null,
    false,
    { activities: [], resolvedActivityCount: 1 },
  );
  assert.deepEqual(
    [...result.units.filter((unit) => unit.kind === 'exercise').map((unit) => unit.id)],
    ['guided', 'handPicked'],
  );
});

const checkedIn = { data: { available: true, checkIn: {} } };

test("a day that does not ask for the to-do step has no to-do row", () => {
  const before = completion(checkedIn);
  for (const todoStep of [undefined, { required: false, claimed: false }, { required: false, claimed: true }]) {
    const result = completion(checkedIn, true, null, false, { todoStep });
    assert.equal(result.units.some((unit) => unit.kind === 'todo'), false);
    assert.equal(result.dailiesTotal, before.dailiesTotal);
    assert.equal(result.allCompleted, true);
  }
});

test("a user with no plan is never asked for the to-do step", () => {
  const result = completion(checkedIn, false);
  assert.equal(result.units.some((unit) => unit.kind === 'todo'), false);
});

test("a day that asks for the to-do step holds the day until it is claimed", () => {
  const open = completion(checkedIn, true, null, false, { todoStep: { required: true, claimed: false } });
  assert.deepEqual(
    { ...open.units.at(-1) },
    { kind: 'todo', id: 'todo:claim', title: 'Do a to-do', techniqueId: null, completed: false },
  );
  assert.equal(open.allCompleted, false);

  const claimed = completion(checkedIn, true, null, false, { todoStep: { required: true, claimed: true } });
  assert.equal(claimed.units.at(-1).completed, true);
  assert.equal(claimed.allCompleted, true);
});

test("a day celebrated before the step existed is not celebrated again after upgrading", () => {
  // Adoption stamps the day the plan moved to, so the day finished today does
  // not ask for the step and its count, which the celebration is keyed by, holds.
  const celebrated = completion(checkedIn);
  markSeenDailies('2026-09-18', celebrated.dailiesDone);
  const upgraded = completion(checkedIn, true, null, false, { todoStep: { required: false, claimed: false } });
  assert.equal(wasDayCelebrationSeen('2026-09-18', upgraded.dailiesTotal), true);
});
