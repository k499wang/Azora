import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { MutationObserver, QueryClient, QueryObserver } from '@tanstack/react-query';
import { reconcileCompletionQueries } from '../tracking/completionQueryReconciliation.ts';

// Load the real key builders and wallet callbacks without native service imports.
function loadMutation(client, saveMoodCheckIn) {
  const modules = new Map();
  function load(url) {
    if (modules.has(url.href)) return modules.get(url.href);
    const exports = {};
    modules.set(url.href, exports);
    const compiled = ts.transpileModule(readFileSync(url, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText;
    vm.runInNewContext(compiled, { exports, require(name) {
      if (name === '@tanstack/react-query') {
        return { useQueryClient: () => client, useMutation: options => options };
      }
      if (name.endsWith('/moodCheckInService')) return { saveMoodCheckIn };
      if (name.endsWith('/completionQueryReconciliation')) return { reconcileCompletionQueries };
      if (name.includes('/services/') || name.includes('/hooks/') || name.endsWith('StructuralSharing')) return {};
      if (name.startsWith('.')) return load(new URL(`${name}.ts`, url));
      throw new Error(`Unexpected import: ${name}`);
    } });
    return exports;
  }
  return load(new URL('./useSaveMoodCheckInMutation.ts', import.meta.url)).useSaveMoodCheckInMutation;
}

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

async function waitFor(predicate) {
  const deadline = Date.now() + 1000;
  while (!predicate()) {
    assert.ok(Date.now() < deadline, 'Timed out waiting for cache reconciliation');
    await new Promise(resolve => setTimeout(resolve, 5));
  }
}

const userId = 'user-1';
const localDate = '2026-10-18';
const moodKey = ['mood-check-in', userId, localDate];
const variables = { localDate, answers: { overall: 4 } };
const checkIn = {
  id: 'saved',
  ...variables,
  scaleRevision: 2,
  tags: [],
  note: null,
  feeling: null,
  score: 75,
  createdAt: '2026-10-18T23:59:00Z',
};
const filters = [
  { queryKey: ['mood-check-ins-recent', userId] },
  { queryKey: ['day-history', userId, localDate], exact: true },
  { queryKey: ['program-enrollment', userId], exact: true },
  { queryKey: ['program-day-completions', userId] },
  { queryKey: ['profile-summary', userId] },
  { queryKey: ['daily-activity-range', userId] },
  { queryKey: ['home-stats', userId] },
];
const dependentKeys = [
  ['mood-check-ins-recent', userId, 7],
  ['mood-check-ins-recent', userId, 30],
  ['day-history', userId, localDate],
  ['program-enrollment', userId],
  ['program-day-completions', userId, 'enrollment-1', 1],
  ['program-day-completions', userId, 'enrollment-2', 2],
  ['profile-summary', userId, localDate],
  ['profile-summary', userId, '2026-10-19'],
  ['daily-activity-range', userId, 7],
  ['daily-activity-range', userId, 30],
  ['home-stats', userId, localDate],
  ['home-stats', userId, '2026-10-19'],
];

test('mutationFn cancels pre-write initial reads, seeds mood without refetch, and reconciles every dependent filter', async t => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  t.after(() => client.clear());
  const oldReads = deferred();
  const calls = new Map();
  const reads = [...dependentKeys, moodKey].map(queryKey => {
    let count = 0;
    const observer = new QueryObserver(client, {
      queryKey,
      staleTime: Infinity,
      queryFn: async () => {
        calls.set(JSON.stringify(queryKey), ++count);
        if (count === 1) {
          await oldReads.promise; // Deliberately ignores AbortSignal.
          return 'pre-write';
        }
        return 'post-write';
      },
    });
    t.after(observer.subscribe(() => {}));
    return observer;
  });
  assert.equal(reads.length, calls.size);

  const untouched = [
    ['mood-check-in', userId, '2026-10-19'],
    [...moodKey, 'detail'],
    ['day-history', userId, '2026-10-19'],
    ['day-history', userId, localDate, 'detail'],
    ['program-enrollment', userId, 'detail'],
    ...dependentKeys.map(key => [key[0], 'user-2', ...key.slice(2)]),
  ];
  for (const key of untouched) client.setQueryData(key, 'untouched');
  const cancelled = [];
  const invalidated = [];
  for (const [method, recorded] of [['cancelQueries', cancelled], ['invalidateQueries', invalidated]]) {
    const original = client[method].bind(client);
    client[method] = (filter, ...args) => {
      recorded.push(JSON.parse(JSON.stringify(filter)));
      return original(filter, ...args);
    };
  }

  const useMutation = loadMutation(client, async () => checkIn);
  // Invoke mutationFn alone: publication must not depend on lifecycle callbacks.
  assert.equal(await useMutation(userId).mutationFn(variables), checkIn);
  assert.deepEqual(cancelled, [{ queryKey: moodKey, exact: true }, ...filters]);
  assert.deepEqual(invalidated, filters);
  await waitFor(() => dependentKeys.every(key => client.getQueryData(key) === 'post-write'));
  oldReads.resolve();
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(client.getQueryData(moodKey).available, true);
  assert.equal(client.getQueryData(moodKey).checkIn, checkIn);
  assert.equal(client.getQueryState(moodKey).isInvalidated, false);
  assert.equal(calls.get(JSON.stringify(moodKey)), 1);
  for (const key of dependentKeys) {
    assert.equal(calls.get(JSON.stringify(key)), 2);
    assert.equal(client.getQueryData(key), 'post-write');
    assert.equal(client.getQueryState(key).isInvalidated, false);
  }
  for (const key of untouched) {
    assert.equal(client.getQueryData(key), 'untouched');
    assert.equal(client.getQueryState(key).isInvalidated, false);
  }
});

test('slow background reads do not block settlement or wallet reconciliation after unmount and account/date changes', async t => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  t.after(() => client.clear());
  const write = deferred();
  const background = deferred();
  const walletKey = ['wallet', userId, 'coin'];
  for (const queryKey of [...dependentKeys, walletKey]) {
    const observer = new QueryObserver(client, {
      queryKey,
      initialData: queryKey === walletKey ? 100 : 'old',
      staleTime: Infinity,
      queryFn: () => background.promise.then(() => queryKey === walletKey ? 110 : 'new'),
    });
    t.after(observer.subscribe(() => {}));
  }
  const useMutation = loadMutation(client, input => {
    assert.equal(input.userId, userId);
    assert.equal(input.localDate, localDate);
    return write.promise;
  });
  const mutation = new MutationObserver(client, useMutation(userId));
  const unsubscribe = mutation.subscribe(() => {});
  let settled = false;
  const pending = mutation.mutate(variables).then(value => { settled = true; return value; });
  unsubscribe();
  new MutationObserver(client, useMutation('user-2'));
  client.setQueryData(['mood-check-in', 'user-2', '2026-10-19'], 'other day');
  await waitFor(() => client.getQueryData(walletKey) === 110);
  write.resolve(checkIn);
  await waitFor(() => settled);
  assert.equal(await pending, checkIn);
  assert.equal(client.getQueryData(moodKey).available, true);
  assert.equal(client.getQueryData(moodKey).checkIn, checkIn);
  assert.equal(client.getQueryData(['mood-check-in', 'user-2', '2026-10-19']), 'other day');
  for (const key of [...dependentKeys, walletKey]) {
    assert.equal(client.getQueryState(key).fetchStatus, 'fetching');
  }
  background.resolve();
  await waitFor(() => [...dependentKeys, walletKey].every(key => client.getQueryState(key).fetchStatus === 'idle'));
  assert.equal(client.getQueryData(walletKey), 110);
});
