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
  let goalsInvalidated = false;
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
    getQueryState: () => ({ isInvalidated: goalsInvalidated }),
    isMutating: () => pending,
    invalidateQueries: (filter) => {
      invalidations.push(filter);
      if (!isWallet(filter.queryKey)) goalsInvalidated = true;
      return Promise.resolve();
    },
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
      if (specifier.endsWith('invalidateStreakQueries')) return { invalidateStreakQueriesWhenSettled() {} };
      if (specifier.endsWith('createdSelfCareGoalsCache')) return { invalidateOtherSelfCareGoalDates() {} };
      if (specifier.endsWith('motionQuiet')) return { whenMotionQuiet: (callback) => callback() };
      if (specifier.endsWith('useWalletQuery')) return { getWalletQueryKey: () => ['wallet', 'user', 'coin'] };
      return {};
    },
  });
  // The toggle's lifecycle lives in its options; its hook only runs them.
  const build = () => name === 'useToggleSelfCareGoalMutation'
    ? exports.toggleSelfCareGoalMutationOptions(client, 'user', '2026-09-20')
    : exports[name]('user', '2026-09-20');
  return {
    mutation: build(),
    newMutation: build,
    get goals() { return goals; },
    get wallet() { return wallet; },
    client,
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
  assert.equal(harness.invalidations.length, 1);
  assert.equal(harness.invalidations[0].refetchType, 'none');
  assert.equal(harness.goals[1].completedToday, true);
  harness.setPending(1);
  harness.mutation.onSettled();
  assert.equal(harness.invalidations.length, 3);
  assert.equal(harness.invalidations[1].refetchType, undefined);
  assert.equal(harness.invalidations[2].queryKey[0], 'wallet');
});

test('ticking and unticking a to-do moves the cached coin balance by its worth', async () => {
  const harness = mutationHarness('useToggleSelfCareGoalMutation', { wallet: 30 });
  await harness.mutation.onMutate({ goalId: 'existing', completed: true });
  assert.equal(harness.wallet, 40);
  await harness.mutation.onMutate({ goalId: 'existing', completed: false });
  assert.equal(harness.wallet, 30);
  await harness.mutation.onMutate({ goalId: 'existing', completed: false });
  assert.equal(harness.wallet, 30);
  harness.goals.push({ id: 'weekly', completedToday: false, recurrence: 'weekly' });
  await harness.mutation.onMutate({ goalId: 'weekly', completed: true });
  assert.equal(harness.wallet, 50);
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


test('a tick before the wallet loads refreshes the canonical balance after success', async () => {
  const harness = mutationHarness('useToggleSelfCareGoalMutation');
  await harness.mutation.onMutate({ goalId: 'existing', completed: true });
  assert.equal(harness.wallet, undefined, 'never invent a zero starting balance');
  harness.mutation.onSuccess();
  harness.mutation.onSettled();
  assert.equal(harness.invalidations.length, 1);
  assert.equal(harness.invalidations[0].queryKey[0], 'wallet');
});

test('quick successful ticks reconcile the wallet once, after the last pending write', async () => {
  const harness = mutationHarness('useToggleSelfCareGoalMutation', { wallet: 30 });
  harness.setPending(2);
  await harness.mutation.onMutate({ goalId: 'existing', completed: true });
  await harness.mutation.onMutate({ goalId: 'other', completed: true });
  harness.mutation.onSuccess();
  harness.mutation.onSettled();
  assert.equal(harness.invalidations.length, 0);
  assert.equal(harness.wallet, 50);
  harness.setPending(1);
  harness.mutation.onSuccess();
  harness.mutation.onSettled();
  assert.equal(harness.invalidations.length, 1);
  assert.equal(harness.invalidations[0].queryKey[0], 'wallet');
});

test('a failed tick removes only its own optimistic coins before background reconciliation', async () => {
  const harness = mutationHarness('useToggleSelfCareGoalMutation', { wallet: 30 });
  const input = { goalId: 'existing', completed: true };
  const context = await harness.mutation.onMutate(input);
  await harness.mutation.onMutate({ goalId: 'other', completed: true });
  // A balance change made elsewhere while the tick was pending.
  harness.client.setQueryData(['wallet', 'user', 'coin'], (current) => current + 25);
  harness.mutation.onError(new Error('offline'), input, context);
  assert.equal(harness.wallet, 65);
  assert.equal(harness.goals[0].completedToday, false);
  assert.equal(harness.goals[1].completedToday, true);
});


test('the last caller reconciles a failure from another mounted list owner', async () => {
  const harness = mutationHarness('useToggleSelfCareGoalMutation', { wallet: 30 });
  const otherOwner = harness.newMutation();
  harness.setPending(2);
  const input = { goalId: 'existing', completed: true };
  const context = await harness.mutation.onMutate(input);
  await otherOwner.onMutate({ goalId: 'other', completed: true });
  harness.mutation.onError(new Error('offline'), input, context);
  harness.mutation.onSettled();
  assert.equal(harness.invalidations.length, 1);
  assert.equal(harness.invalidations[0].refetchType, 'none');
  harness.setPending(1);
  otherOwner.onSuccess();
  otherOwner.onSettled();
  assert.equal(harness.invalidations.length, 3);
  assert.equal(harness.invalidations[1].queryKey[0], 'self-care-goals');
  assert.equal(harness.invalidations[2].queryKey[0], 'wallet');
});
