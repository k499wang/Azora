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
    /if \(userId != null\) void invalidateStreakQueries\(queryClient, userId\);/,
  );
  assert.doesNotMatch(source, /onSuccess: async/);
});

test('a failed optimistic completion still refreshes its exact list', () => {
  assert.match(source, /queryClient\.invalidateQueries\(\{ queryKey, exact: true \}\)/);
});

function mutationHarness(name) {
  let goals = [
    { id: 'existing', completedToday: false, featuredToday: false, title: 'Existing' },
    { id: 'other', completedToday: false, featuredToday: true, title: 'Other' },
  ];
  let cancellation;
  const client = {
    getQueryData: () => goals,
    setQueryData: (_key, update) => { goals = typeof update === 'function' ? update(goals) : update; },
    cancelQueries: (_filter, options) => { cancellation = options; return Promise.resolve(); },
    invalidateQueries: () => Promise.resolve(),
  };
  const exports = {};
  const compiled = ts.transpileModule(readFileSync(join(here, `${name}.ts`), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  runInNewContext(compiled, {
    exports,
    require: (specifier) => {
      if (specifier === '@tanstack/react-query') return { useQueryClient: () => client, useMutation: (options) => options };
      if (specifier.endsWith('useSelfCareGoalsQuery')) return { getSelfCareGoalsQueryKey: () => ['self-care-goals', 'user', '2026-09-20'] };
      if (specifier.endsWith('selfCareGoal')) return { sortSelfCareGoals: (value) => value };
      return {};
    },
  });
  return {
    mutation: exports[name]('user', '2026-09-20'),
    get goals() { return goals; },
    get cancellation() { return cancellation; },
  };
}

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
