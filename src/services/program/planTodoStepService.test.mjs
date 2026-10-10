import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(
  readFileSync(new URL('./planTodoStepService.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } },
).outputText;

function service(answer) {
  const calls = [];
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === '../supabase/client') {
        return {
          requireSupabaseClient: () => ({
            async rpc(fn, args) { calls.push([fn, args]); return answer(); },
          }),
        };
      }
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return { claim: exports.claimPlanTodoStep, calls };
}

test('a claim sends only the local date and reads back the day the server chose', async () => {
  const { claim, calls } = service(async () => ({
    data: { outcome: 'recorded', coinsAwarded: 10, enrollmentId: 'plan', programDay: 4, activityId: 'todo:claim' },
    error: null,
  }));
  const response = await claim({ localDate: '2026-10-11' });
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [['claim_plan_todo_step', { p_claim: { localDate: '2026-10-11' } }]]);
  assert.deepEqual({ ...response }, { outcome: 'recorded', coinsAwarded: 10, enrollmentId: 'plan', programDay: 4, activityId: 'todo:claim' });
});

test('a repeated claim is recorded again and pays nothing', async () => {
  const { claim } = service(async () => ({
    data: { outcome: 'recorded', coinsAwarded: 0, programDay: 4, activityId: 'todo:claim' },
    error: null,
  }));
  const response = await claim({ localDate: '2026-10-11' });
  assert.equal(response.outcome, 'recorded');
  assert.equal(response.coinsAwarded, 0);
});

test('refusals come back as outcomes, not errors', async () => {
  for (const outcome of ['not_required', 'no_todo_ticked', 'no_active_enrollment', 'invalid_date']) {
    const { claim } = service(async () => ({ data: { outcome, programDay: 4 }, error: null }));
    const response = await claim({ localDate: '2026-10-11' });
    assert.equal(response.outcome, outcome);
    assert.equal(response.coinsAwarded, 0);
    assert.equal(response.activityId, null);
  }
});

test('a backend without the claim function is unavailable, not an error', async () => {
  for (const code of ['PGRST202', '42883']) {
    const { claim } = service(async () => ({ data: null, error: { code } }));
    assert.equal((await claim({ localDate: '2026-10-11' })).outcome, 'unavailable');
  }
});

test('other failures remain errors', async () => {
  const { claim } = service(async () => ({ data: null, error: new Error('offline') }));
  await assert.rejects(claim({ localDate: '2026-10-11' }), /offline/);
});
