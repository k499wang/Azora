import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { MutationObserver, QueryClient } from '@tanstack/react-query';

const compiled = ts.transpileModule(
  readFileSync(new URL('./useClaimPlanTodoStepMutation.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

const toggleExports = {};
vm.runInNewContext(ts.transpileModule(
  readFileSync(new URL('../selfCare/useToggleSelfCareGoalMutation.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText, { exports: toggleExports, require: () => ({}) });

function harness({ userId = 'user', ticks, response, failure } = {}) {
  const writes = [];
  const invalidations = [];
  const calls = [];
  const client = new QueryClient();
  const walletKey = ['wallet', userId];
  client.setQueryData(walletKey, 100);
  client.setQueryData(['completions', userId, 'canonical-plan', 7], ['lesson:plan.grows']);
  const setQueryData = client.setQueryData.bind(client);
  client.setQueryData = (key, update) => {
    const data = setQueryData(key, update);
    writes.push([key, data]);
    return data;
  };
  client.invalidateQueries = (options) => {
      invalidations.push(options);
      // Background reconciliation must not hold the reward pending.
      return new Promise(() => {});
  };
  const dependencies = {
    useQueryClient: () => client,
    useMutation: (options) => options,
    selfCareTogglesSettled: (queryClient, id) =>
      ticks ?? toggleExports.selfCareTogglesSettled(queryClient, id),
    claimPlanTodoStep: async (request) => {
      calls.push(request);
      if (failure) throw failure;
      return response;
    },
    getProgramDayCompletionsQueryKey: (...parts) => ['completions', ...parts],
    getProgramDayCompletionsQueryKeyPrefix: (id) => ['completions', id],
    getProgramEnrollmentQueryKey: (id) => ['enrollment', id],
    getWalletQueryKey: () => walletKey,
  };
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: () => dependencies });
  const mutation = exports.useClaimPlanTodoStepMutation(userId);
  return {
    mutation, writes, calls, invalidations, client, walletKey,
    observer: new MutationObserver(client, mutation),
  };
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

test('only the canonical coin award changes a loaded wallet, without waiting for refetch', async () => {
  for (const coinsAwarded of [10, 0]) {
    const response = { outcome: 'recorded', coinsAwarded, enrollmentId: 'canonical-plan', programDay: 7, activityId: 'todo:claim' };
    let settle;
    const ticks = new Promise((resolve) => { settle = resolve; });
    const { observer, client, walletKey, invalidations, mutation } = harness({ response, ticks });
    const pending = observer.mutate({ localDate: '2026-10-11' });
    assert.equal(client.isMutating({ mutationKey: mutation.mutationKey, exact: true }), 1);
    assert.equal(client.getQueryData(walletKey), 100, 'waiting for a tick earns no claim coins');
    settle();
    await pending;
    assert.equal(client.isMutating({ mutationKey: mutation.mutationKey, exact: true }), 0);
    assert.equal(client.getQueryData(walletKey), 100 + coinsAwarded);
    assert.ok(invalidations.some(({ queryKey }) => queryKey === walletKey));
  }
});

test('refused and failed claims never manufacture wallet coins', async () => {
  for (const outcome of ['not_required', 'no_todo_ticked', 'no_active_enrollment', 'invalid_date', 'unavailable']) {
    const { observer, client, walletKey } = harness({ response: { outcome, coinsAwarded: 0 } });
    await observer.mutate({ localDate: '2026-10-11' });
    assert.equal(client.getQueryData(walletKey), 100, outcome);
  }
  const { observer, client, walletKey, invalidations } = harness({ failure: new Error('offline') });
  await assert.rejects(observer.mutate({ localDate: '2026-10-11' }), /offline/);
  assert.equal(client.getQueryData(walletKey), 100);
  assert.deepEqual(JSON.parse(JSON.stringify(invalidations)), [
    { queryKey: ['completions', 'user'] },
    { queryKey: ['enrollment', 'user'], exact: true },
    { queryKey: ['wallet', 'user'], exact: true },
  ], 'a lost response reconciles a possibly committed claim without blocking the error');
});

test('a cold wallet remains unloaded, and repeated completions are unioned once', async () => {
  const response = { outcome: 'recorded', coinsAwarded: 0, enrollmentId: 'canonical-plan', programDay: 7, activityId: 'todo:claim' };
  const { observer, client, walletKey } = harness({ response });
  client.removeQueries({ queryKey: walletKey });
  await observer.mutate({ localDate: '2026-10-11' });
  await observer.mutate({ localDate: '2026-10-11' });
  assert.equal(client.getQueryData(walletKey), undefined);
  assert.deepEqual([...client.getQueryData(['completions', 'user', 'canonical-plan', 7])], ['lesson:plan.grows', 'todo:claim']);
});

test('real pending to-do toggles, including failures, settle before the server checks the claim', async () => {
  for (const fails of [false, true]) {
    const response = fails
      ? { outcome: 'no_todo_ticked', coinsAwarded: 0 }
      : { outcome: 'recorded', coinsAwarded: 10 };
    const { observer, client, calls, walletKey } = harness({ response });
    let settleTick;
    const tick = new MutationObserver(client, {
      mutationKey: ['toggle-self-care-goal', 'user', '2026-10-11'],
      mutationFn: () => new Promise((resolve, reject) => {
        settleTick = () => fails ? reject(new Error('tick failed')) : resolve();
      }),
    });
    const ticking = tick.mutate({}).catch(() => {});
    const claiming = observer.mutate({ localDate: '2026-10-11' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(calls.length, 0);
    settleTick();
    await ticking;
    await claiming;
    assert.equal(calls.length, 1);
    assert.equal(client.getQueryData(walletKey), fails ? 100 : 110);
  }
});
