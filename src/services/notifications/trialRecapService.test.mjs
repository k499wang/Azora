import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(
  readFileSync(new URL('./trialRecapService.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

function service(answers) {
  const calls = {};
  const exports = {};
  const from = (table) => {
    const call = (calls[table] = []);
    const builder = {
      select(...args) { call.push(['select', ...args]); return builder; },
      eq(...args) { call.push(['eq', ...args]); return builder; },
      gte(...args) { call.push(['gte', ...args]); return builder; },
      not(...args) { call.push(['not', ...args]); return builder; },
      then(resolve) { resolve(answers[table]); },
    };
    return builder;
  };
  vm.runInNewContext(compiled, {
    exports, Promise, Date,
    require(name) {
      if (name === '../supabase') return { requireSupabaseClient: () => ({ from }) };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return { get: exports.getTrialRecapCounts, calls };
}

const ok = (count) => ({ count, error: null });

test('counts cover 7 days before the trial ends, for this user, without to-do claim rows', async () => {
  const { get, calls } = service({
    program_action_completions: ok(4),
    self_care_goal_completions: ok(12),
    mood_check_ins: ok(2),
  });
  const counts = await get('user-1', '2026-11-10T12:00:00.000Z');
  assert.deepEqual({ ...counts }, { planSteps: 4, todos: 12, checkIns: 2 });
  const plan = JSON.parse(JSON.stringify(calls.program_action_completions));
  assert.deepEqual(plan.slice(1), [
    ['eq', 'user_id', 'user-1'],
    ['gte', 'completed_at', '2026-11-03T12:00:00.000Z'],
    ['not', 'activity_id', 'like', 'todo:%'],
  ]);
  assert.deepEqual(plan[0][2], { count: 'exact', head: true });
  assert.deepEqual(JSON.parse(JSON.stringify(calls.mood_check_ins)).slice(1), [
    ['eq', 'user_id', 'user-1'],
    ['gte', 'created_at', '2026-11-03T12:00:00.000Z'],
  ]);
});

test('a failed count rejects, so the reminder falls back to the plain text', async () => {
  const failure = new Error('offline');
  const { get } = service({
    program_action_completions: ok(4),
    self_care_goal_completions: { count: null, error: failure },
    mood_check_ins: ok(2),
  });
  await assert.rejects(get('user-1', '2026-11-10T12:00:00.000Z'), failure);
});
