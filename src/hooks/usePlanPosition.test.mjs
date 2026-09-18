import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as catalogue from '../features/program/domain/programCatalogue.ts';
import * as enrollmentDomain from '../features/program/domain/programEnrollment.ts';

const compiled = ts.transpileModule(
  readFileSync(new URL('./usePlanPosition.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

function state(query, userId = 'user-1') {
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === 'react') return { useMemo: fn => fn() };
      if (name.endsWith('/programCatalogue')) return catalogue;
      if (name.endsWith('/programEnrollment')) return enrollmentDomain;
      if (name === './useTodayLocalDate') return { useTodayLocalDate: () => '2026-09-18' };
      if (name.endsWith('/useProgramEnrollmentQuery')) return { useProgramEnrollmentQuery: () => query };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return exports.usePlanPositionState(userId);
}

test('pending and successful empty enrollment reads produce different screen states', () => {
  assert.equal(state({ isPending: true }).isLoading, true);
  const empty = state({ data: null, isPending: false, isError: false });
  assert.equal(empty.position, null);
  assert.equal(empty.isLoading, false);
  assert.equal(empty.isError, false);
  assert.equal(empty.hasEnrollment, false);
  assert.equal(state({ isPending: true }, null).isLoading, false);
});

test('read errors expose the retry action instead of a permanent spinner', () => {
  const refetch = () => {};
  const failed = state({ isPending: false, isError: true, refetch });
  assert.equal(failed.isLoading, false);
  assert.equal(failed.isError, true);
  assert.equal(failed.refetch, refetch);
});

test('completed enrollment preserves all progress on the final day', () => {
  const built = enrollmentDomain.buildProgramEnrollment({
    enrollmentId: 'finished', planId: 'night', presetRevision: 1, enrolledOn: '2026-09-01',
  });
  const enrollment = { ...built.enrollment, status: 'completed', programDay: 28, lastAdvancedOn: '2026-09-18' };
  const result = state({ data: enrollment, isPending: false });
  assert.equal(result.position.isFinished, true);
  assert.equal(result.position.daysDone, 28);
  assert.equal(result.position.week, 4);
  assert.equal(result.position.totalWeeks, 4);
});

test('an unsupported preset has an enrollment but does not stay loading', () => {
  const result = state({ data: { planId: 'night', presetRevision: 999 }, isPending: false });
  assert.equal(result.hasEnrollment, true);
  assert.equal(result.position, null);
  assert.equal(result.isLoading, false);
});
