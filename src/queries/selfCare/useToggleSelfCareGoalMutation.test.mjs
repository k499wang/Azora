import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'useToggleSelfCareGoalMutation.ts'), 'utf8');

test('a to-do confirmation does not wait for derived streak refreshes', () => {
  assert.match(
    source,
    /if \(userId != null\) invalidateStreakQueriesWhenSettled\(queryClient, userId\);/,
  );
  assert.doesNotMatch(source, /onSuccess: async/);
});

test('a failed optimistic completion still refreshes its exact list', () => {
  assert.match(source, /queryClient\.invalidateQueries\(\{ queryKey, exact: true \}\)/);
});

function mutationHarness(name, { wallet } = {}) {
  let goals = [
    { id: 'existing', completedToday: false, featuredToday: false, title: 'Existing' },
    { id: 'other', completedToday: false, featuredToday: true, title: 'Other' },
  ];
  let cancellation;
  let pending = 1;
  const invalidations = [];
  const isWallet = (key) => key[0] === 'wallet';
  const client = {
    getQueryData: (key) => (isWallet(key) ? wallet : goals),
    setQueryData: (key, update) => {
      if (isWallet(key)) wallet = typeof update === 'function' ? update(wallet) : update;
      else goals = typeof update === 'function' ? update(goals) : update;
    },
    cancelQueries: (filter, options) => {
      if (!isWallet(filter.queryKey)) cancellation = options;
      return Promise.resolve();
    },
    isMutating: () => pending,
    invalidateQueries: (filter) => { invalidations.push(filter); return Promise.resolve(); },
  };
  const exports = {};
  const compiled = ts.transpileModule(readFileSync(join(here, `${name}.ts`), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  runInNewContext(compiled, {
    exports,
    require: (specifier) => {
      if (specifier === 'react') return { useRef: (value) => ({ current: value }) };
      if (specifier === '@tanstack/react-query') return { useQueryClient: () => client, useMutation: (options) => options, useMutationState: () => [] };
      if (specifier.endsWith('useSelfCareGoalsQuery')) return { getSelfCareGoalsQueryKey: () => ['self-care-goals', 'user', '2026-09-20'] };
      if (specifier.endsWith('selfCareGoal')) {
        return {
          sortSelfCareGoals: (value) => value,
          selfCareGoalCoins: (recurrence) => (recurrence === 'weekly' ? 20 : 10),
        };
      }
      if (specifier.endsWith('useWalletQuery')) return { getWalletQueryKey: () => ['wallet', 'user', 'coin'] };
      return {};
    },
  });
  return {
    mutation: exports[name]('user', '2026-09-20'),
    get goals() { return goals; },
    get wallet() { return wallet; },
    get cancellation() { return cancellation; },
    invalidations,
    setPending(value) { pending = value; },
  };
}

test('a failed tick waits for other pending ticks before reconciling server snapshots', async () => {
  const harness = mutationHarness('useToggleSelfCareGoalMutation');
  harness.setPending(2);
  const first = { goalId: 'existing', completed: true };
  const second = { goalId: 'other', completed: true };
  const context = await harness.mutation.onMutate(first);
  await harness.mutation.onMutate(second);
  harness.mutation.onError(new Error('offline'), first, context);
  harness.mutation.onSettled();
  assert.equal(harness.invalidations.length, 0);
  assert.equal(harness.goals[1].completedToday, true);
  harness.setPending(1);
  harness.mutation.onSettled();
  assert.equal(harness.invalidations.length, 2);
  harness.mutation.onSettled();
  assert.equal(harness.invalidations.length, 2);
});

test('ticking and unticking a to-do moves the cached coin balance by its worth', async () => {
  const harness = mutationHarness('useToggleSelfCareGoalMutation', { wallet: [{ delta: 30 }] });
  await harness.mutation.onMutate({ goalId: 'existing', completed: true });
  assert.deepEqual(Array.from(harness.wallet, (entry) => entry.delta), [10, 30]);
  await harness.mutation.onMutate({ goalId: 'existing', completed: false });
  assert.deepEqual(Array.from(harness.wallet, (entry) => entry.delta), [-10, 10, 30]);
  await harness.mutation.onMutate({ goalId: 'existing', completed: false });
  assert.equal(harness.wallet.length, 3);
  harness.goals.push({ id: 'weekly', completedToday: false, recurrence: 'weekly' });
  await harness.mutation.onMutate({ goalId: 'weekly', completed: true });
  assert.equal(harness.wallet[0].delta, 20);
});

test('completion and rollback preserve cached order and untouched row identities', async () => {
  const harness = mutationHarness('useToggleSelfCareGoalMutation');
  // Deliberately retain the cache's current order, including a row added while
  // the request is pending. Completion has no scheduling effect.
  harness.goals.reverse();
  const untouched = harness.goals[0];
  const input = { goalId: 'existing', completed: true };
  const context = await harness.mutation.onMutate(input);
  assert.equal(harness.goals[0], untouched);
  assert.deepEqual(Array.from(harness.goals, (goal) => goal.id), ['other', 'existing']);
  harness.goals.push({ id: 'new', completedToday: false });
  const added = harness.goals[2];
  harness.mutation.onError(new Error('offline'), input, context);
  assert.equal(harness.goals[0], untouched);
  assert.equal(harness.goals[2], added);
  assert.deepEqual(Array.from(harness.goals, (goal) => goal.id), ['other', 'existing', 'new']);
  assert.equal(harness.goals[1].completedToday, false);
});

for (const [name, input, field] of [
  ['useToggleSelfCareGoalMutation', { goalId: 'existing', completed: true }, 'completedToday'],
  ['useSetSelfCareGoalFeaturedMutation', { goalId: 'existing', featured: true }, 'featuredToday'],
]) {
  test(`${name}: failed optimistic edits preserve newly added rows and unrelated changes`, async () => {
    const harness = mutationHarness(name);
    const context = await harness.mutation.onMutate(input);
    assert.equal(harness.goals[0][field], true);
    assert.equal(harness.cancellation.revert, false);
    harness.goals.push({ id: 'new', completedToday: true, featuredToday: false });
    harness.goals[0].title = 'Edited while pending';
    harness.goals[1].completedToday = true;
    harness.mutation.onError(new Error('Request failed'), input, context);
    assert.equal(harness.goals.length, 3);
    assert.equal(harness.goals[0][field], false);
    assert.equal(harness.goals[0].title, 'Edited while pending');
    assert.equal(harness.goals[1].completedToday, true);
    assert.equal(harness.goals[2].id, 'new');
    assert.equal(harness.goals[2].completedToday, true);
  });

  test(`${name}: a rollback does not resurrect a removed goal`, async () => {
    const harness = mutationHarness(name);
    const context = await harness.mutation.onMutate(input);
    harness.goals.splice(0, 1);
    harness.mutation.onError(new Error('Request failed'), input, context);
    assert.equal(harness.goals.length, 1);
    assert.equal(harness.goals[0].id, 'other');
  });
}
