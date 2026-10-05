import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(readFileSync(new URL('./useCompleteAttentionSessionMutation.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

function mutation({ counted = true, outcome = 'recorded' } = {}) {
  const events = [];
  const client = {
    setQueryData: (...args) => events.push(['cache', ...args]),
    cancelQueries: async () => {},
    invalidateQueries: async () => {},
  };
  const exports = {};
  vm.runInNewContext(compiled, { exports, require(name) {
    if (name === '@tanstack/react-query') return { useQueryClient: () => client, useMutation: options => options };
    if (name.endsWith('/programEnrollmentService')) return {
      advanceProgramDayRemote: async () => ({ outcome, enrollment: null }),
      recordAttentionSessionRemote: async () => { events.push(['record']); return counted; },
    };
    if (name.endsWith('/completionQueryReconciliation')) return { reconcileCompletionQueries: async (_, keys) => events.push(['reconcile', keys]) };
    if (name.endsWith('/optimisticCoinCredit')) return { optimisticCoinCredit: () => ({}) };
    // Query-key helpers keep their argument identity without loading React hooks.
    return new Proxy({}, { get: (_, key) => (...args) => [key, ...args] });
  } });
  return { run: exports.useCompleteAttentionSessionMutation('user').mutationFn, events };
}
const variables = { activityId: 'reset:54321', scriptId: '54321', localDate: '2026-10-05', planDay: null, coins: 0 };

test('unrecorded attention completion returns false and skips canonical reconciliation', async () => {
  const app = mutation({ counted: false });
  assert.equal(await app.run(variables), false);
  assert.deepEqual(app.events.map(event => event[0]), ['record']);
});

test('recorded attention completion returns true after canonical reconciliation', async () => {
  const app = mutation();
  assert.equal(await app.run(variables), true);
  assert.deepEqual(app.events.map(event => event[0]), ['record', 'reconcile']);
  assert.equal(app.events[1][1].length, 4);
});

test('a credited plan completion returns true without recording a second attention session', async () => {
  const app = mutation({ counted: false });
  assert.equal(await app.run({ ...variables, planDay: { enrollmentId: 'enrollment', programDay: 2 } }), true);
  assert.deepEqual(app.events.map(event => event[0]), ['cache', 'reconcile']);
});
