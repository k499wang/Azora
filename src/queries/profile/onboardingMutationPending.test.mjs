import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { MutationObserver, QueryClient } from '@tanstack/react-query';

function loadMutation(path, name, client, service = async input => input, diagnostics = async () => ({})) {
  const compiled = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, console: { log() {}, warn() {} },
    require(dependency) {
      if (dependency === '@tanstack/react-query') return { useQueryClient: () => client, useMutation: options => options };
      if (dependency.endsWith('onboardingSaveDiagnostics')) return { buildOnboardingSaveFailureDiagnostics: diagnostics };
      if (dependency.endsWith('onboardingStatusService')) return { saveOnboardingProfile: (_user, input) => service(input) };
      if (dependency.endsWith('dailyPlanScheduleService')) return { updateDailyPlanSchedule: (_user, input) => service(input) };
      if (dependency.endsWith('dailyPlanExercisesService')) return { updateDailyPlanExercises: (_user, input) => service(input) };
      const queryName = dependency.split('/').at(-1);
      const keyName = `get${queryName.slice(3)}Key`;
      return { [keyName]: user => [queryName, user] };
    },
  });
  return exports[name]('user');
}

const cases = [
  ['../dailyPlan/useUpdateDailyPlanScheduleMutation.ts', 'useUpdateDailyPlanScheduleMutation', 'useDailyPlanScheduleQuery', { morning: '09:00' }, 1],
  ['../dailyPlan/useUpdateDailyPlanExercisesMutation.ts', 'useUpdateDailyPlanExercisesMutation', 'useDailyPlanExercisesQuery', { startsOn: '2026-10-21', days: [] }, 0],
  ['./useSaveOnboardingProfileMutation.ts', 'useSaveOnboardingProfileMutation', 'useSavedOnboardingProfileQuery', { displayName: 'Sam', onboardingGoal: 'Calm' }, 3],
];

for (const [path, name, query, input, refreshCount] of cases) {
  test(`${name} publishes its save and settles while background refresh remains pending`, async () => {
    const client = new QueryClient();
    const refreshes = [];
    client.invalidateQueries = options => {
      refreshes.push(options);
      return new Promise(() => {});
    };
    const options = loadMutation(path, name, client);
    const observer = new MutationObserver(client, options);
    await observer.mutate(input);
    assert.equal(observer.getCurrentResult().status, 'success');
    assert.equal(refreshes.length, refreshCount);
    const cached = client.getQueryData([query, 'user']);
    if (name === 'useUpdateDailyPlanExercisesMutation') {
      assert.equal(cached.status, 'available');
      assert.equal(cached.plan, input);
    } else assert.equal(cached, input);
    client.clear();
  });
}

test('profile save reports its original failure while diagnostics remain pending', async () => {
  const client = new QueryClient();
  const failure = new Error('Offline');
  let diagnosticsStarted = false;
  const options = loadMutation('./useSaveOnboardingProfileMutation.ts', 'useSaveOnboardingProfileMutation', client,
    async () => { throw failure; },
    () => { diagnosticsStarted = true; return new Promise(() => {}); });
  const observer = new MutationObserver(client, options);
  await assert.rejects(observer.mutate({ displayName: 'Sam' }), error => error === failure);
  assert.equal(diagnosticsStarted, true);
  assert.equal(observer.getCurrentResult().status, 'error');
  client.clear();
});

test('a diagnostic failure cannot replace the profile save failure', async () => {
  const client = new QueryClient();
  const failure = new Error('Save failed');
  const options = loadMutation('./useSaveOnboardingProfileMutation.ts', 'useSaveOnboardingProfileMutation', client,
    async () => { throw failure; }, async () => { throw new Error('Diagnostics failed'); });
  await assert.rejects(new MutationObserver(client, options).mutate({}), error => error === failure);
  client.clear();
});


test('exercise save cancels a stale read before publishing its canonical plan', async () => {
  const client = new QueryClient();
  const key = ['useDailyPlanExercisesQuery', 'user'];
  const stale = { status: 'available', plan: { startsOn: '2026-10-01' } };
  const saved = { startsOn: '2026-10-21', days: [] };
  let finishRead;
  const read = new Promise(resolve => { finishRead = resolve; });
  const fetching = client.fetchQuery({ queryKey: key, queryFn: () => read }).catch(() => {});
  const options = loadMutation('../dailyPlan/useUpdateDailyPlanExercisesMutation.ts', 'useUpdateDailyPlanExercisesMutation', client);
  const observer = new MutationObserver(client, options);
  const unsubscribe = observer.subscribe(() => {});
  const saving = observer.mutate(saved);
  unsubscribe();
  await saving;
  assert.equal(client.getQueryData(key).plan, saved);
  finishRead(stale);
  await fetching;
  await Promise.resolve();
  assert.equal(client.getQueryData(key).plan, saved);
  assert.equal(client.getQueryState(key).isInvalidated, false);
  assert.equal(client.getQueryState(key).fetchStatus, 'idle');
  client.clear();
});
