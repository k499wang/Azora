import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { todoStepState } from '../program/domain/programTodoStep.ts';
import { isLastUnfinishedDayUnit } from '../../hooks/dayUnits/dayUnit.ts';

const compiled = ts.transpileModule(
  readFileSync(new URL('./useTodoStepAction.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

function harness({ required = true, ticked = true } = {}) {
  const navigations = [];
  const alerts = [];
  const claims = [];
  const exports = {};
  const dependencies = {
    useRef: (current) => ({ current }),
    useNavigation: () => ({ navigate: (...args) => navigations.push(args) }),
    useTodayLocalDate: () => '2026-10-11',
    useQuery: () => ({ data: [{ completedToday: ticked }] }),
    getSelfCareGoalsQueryOptions: () => ({}),
    todoStepState,
    isLastUnfinishedDayUnit,
    hasPieceToEarn: () => true,
    takeForcedDayComplete: () => false,
    Alert: { alert: (...args) => alerts.push(args) },
    useClaimPlanTodoStepMutation: () => ({
      mutate: (variables, callbacks) => claims.push({ variables, callbacks }),
    }),
  };
  vm.runInNewContext(compiled, { exports, require: () => dependencies });
  const action = exports.useTodoStepAction('user', {
    isLoading: false,
    day: { enrollment: { enrollmentId: 'plan' }, todoStep: { required, claimed: false } },
  }, {
    progress: {},
    dailies: { units: [{ id: 'todo:claim', kind: 'todo', completed: false }] },
  });
  return { action, navigations, alerts, claims };
}

test('the claim reward waits for a recorded claim and uses the server coin amount', () => {
  for (const coinsAwarded of [10, 0]) {
    const { action, claims, navigations } = harness();
    action.run();
    assert.equal(navigations.length, 0);
    action.run();
    assert.equal(claims.length, 1, 'a pending claim cannot be submitted twice');
    claims[0].callbacks.onSuccess({ outcome: 'recorded', coinsAwarded });
    assert.deepEqual(JSON.parse(JSON.stringify(navigations)), [[
      'ActivityReward', { kind: 'todo', coins: coinsAwarded, dayCompleteUnitId: 'todo:claim' },
    ]]);
  }
});

test('refused claims never show coins or hand a completed day to Home', () => {
  for (const outcome of ['not_required', 'no_todo_ticked', 'no_active_enrollment', 'invalid_date', 'unavailable']) {
    const { action, claims, navigations, alerts } = harness();
    action.run();
    claims[0].callbacks.onSuccess({ outcome, coinsAwarded: 0 });
    claims[0].callbacks.onSettled();
    assert.equal(navigations.length, 0, outcome);
    assert.equal(alerts.length, 1, outcome);
    action.run();
    assert.equal(claims.length, 2, 'the user can retry after a refusal');
  }
});

test('a failed claim allows retry without showing a reward', () => {
  const { action, claims, navigations, alerts } = harness();
  action.run();
  claims[0].callbacks.onError(new Error('offline'));
  claims[0].callbacks.onSettled();
  assert.equal(navigations.length, 0);
  assert.equal(alerts.length, 1);
  action.run();
  assert.equal(claims.length, 2);
});

test('an unticked step opens Routine and an unrequired step does nothing', () => {
  const open = harness({ ticked: false });
  open.action.run();
  assert.equal(open.claims.length, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(open.navigations)), [
    ['MainTabs', { screen: 'Plan' }, { pop: true }],
  ]);
  const absent = harness({ required: false });
  absent.action.run();
  assert.equal(absent.claims.length, 0);
  assert.equal(absent.navigations.length, 0);
});
