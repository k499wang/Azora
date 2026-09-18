import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(
  readFileSync(new URL('./useDailiesCompletion.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

function completion(moodQuery, withProgram = true) {
  const technique = { id: 'breathing', title: 'Breathe' };
  const dependencies = {
    useTodayLocalDate: () => '2026-09-18',
    useDailiesForcedComplete: () => false,
    useProfileQuery: () => ({ isSuccess: true, data: null }),
    useRecommendedTechnique: () => ({ technique, isLoading: false }),
    useTodayProgramDay: () => ({
      isLoading: false,
      day: withProgram ? {
        activities: [{ activityId: 'exercise', technique, completed: true }],
      } : null,
    }),
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
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: () => dependencies });
  return exports.useDailiesCompletion('user-1');
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
