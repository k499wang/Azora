import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { MutationObserver, QueryClient } from '@tanstack/react-query';
import { cacheCreatedSelfCareGoals } from './createdSelfCareGoalsCache.ts';

test('onboarding publishes todos before save resolves even after its observer leaves', async () => {
  const client = new QueryClient();
  const key = ['self-care-goals', 'user', '2026-09-20'];
  const starter = {
    id: 'starter', title: 'Drink water', icon: 'sparkle', recurrence: 'daily',
    scheduledTime: null, completedToday: false, featuredToday: false,
    createdAt: '2026-09-20T12:00:00Z', updatedAt: '2026-09-20T12:00:00Z',
  };
  let finishSave;
  const save = new Promise((resolve) => { finishSave = resolve; });
  const exports = {};
  const compiled = ts.transpileModule(
    readFileSync(new URL('./useCreateSelfCareGoalsMutation.ts', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === '@tanstack/react-query') return { useQueryClient: () => client, useMutation: (options) => options };
      if (name.endsWith('selfCareService')) return { createSelfCareGoals: () => save };
      if (name.endsWith('createdSelfCareGoalsCache')) return { cacheCreatedSelfCareGoals };
      if (name.endsWith('useSelfCareGoalsQuery')) return { getSelfCareGoalsQueryKey: () => key };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  const options = exports.useCreateSelfCareGoalsMutation('user', key[2]);
  const observer = new MutationObserver(client, options);
  const unsubscribe = observer.subscribe(() => {});
  const pending = observer.mutate([]);
  unsubscribe();
  finishSave({ savedGoals: [starter], goalsForDate: [starter] });
  await pending;
  assert.deepEqual(client.getQueryData(key), [starter]);
  assert.equal(client.getQueryState(key).isInvalidated, false);
  client.clear();
});
