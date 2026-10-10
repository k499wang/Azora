import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(
  readFileSync(new URL('./useClaimPlanTodoStepMutation.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

function harness({ userId = 'user', ticks = Promise.resolve(), response, failure } = {}) {
  const writes = [];
  const invalidations = [];
  const calls = [];
  const client = {
    setQueryData: (key, update) => writes.push([key, update(['lesson:plan.grows'])]),
    invalidateQueries: (options) => {
      invalidations.push(options);
      // Background reconciliation must not hold the reward pending.
      return new Promise(() => {});
    },
  };
  const dependencies = {
    useQueryClient: () => client,
    useMutation: (options) => options,
    selfCareTogglesSettled: () => ticks,
    claimPlanTodoStep: async (request) => {
      calls.push(request);
      if (failure) throw failure;
      return response;
    },
    getProgramDayCompletionsQueryKey: (...parts) => ['completions', ...parts],
    getProgramDayCompletionsQueryKeyPrefix: (id) => ['completions', id],
    getProgramEnrollmentQueryKey: (id) => ['enrollment', id],
    optimisticCoinCredit: () => ({}),
    EARN_RATES: { todoStep: 10 },
  };
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: () => dependencies });
  return { mutation: exports.useClaimPlanTodoStepMutation(userId), writes, calls, invalidations };
}

test('claim waits for pending ticks, then seeds the enrollment and day returned by the server', async () => {
  let settle;
  const ticks = new Promise((resolve) => { settle = resolve; });
  const response = { outcome: 'recorded', enrollmentId: 'canonical-plan', programDay: 7, activityId: 'todo:claim', coinsAwarded: 10 };
  const { mutation, writes, calls, invalidations } = harness({ ticks, response });
  const pending = mutation.mutationFn({ localDate: '2026-10-11' });
  await Promise.resolve();
  assert.equal(calls.length, 0);
  settle();
  assert.equal(await pending, response);
  assert.deepEqual(JSON.parse(JSON.stringify(writes)), [[
    ['completions', 'user', 'canonical-plan', 7], ['lesson:plan.grows', 'todo:claim'],
  ]]);
  assert.equal(invalidations.length, 2);
});

test('refused claims refresh canonical state without manufacturing a completion', async () => {
  const response = { outcome: 'no_todo_ticked', coinsAwarded: 0 };
  const { mutation, writes, invalidations } = harness({ response });
  assert.equal(await mutation.mutationFn({ localDate: '2026-10-11' }), response);
  assert.equal(writes.length, 0);
  assert.equal(invalidations.length, 2);
});

test('claim errors propagate and signed-out claims never reach the backend', async () => {
  const failed = harness({ failure: new Error('offline') });
  await assert.rejects(failed.mutation.mutationFn({ localDate: '2026-10-11' }), /offline/);
  assert.equal(failed.writes.length, 0);
  const signedOut = harness({ userId: null });
  await assert.rejects(signedOut.mutation.mutationFn({ localDate: '2026-10-11' }), /signed-in/);
  assert.equal(signedOut.calls.length, 0);
});
