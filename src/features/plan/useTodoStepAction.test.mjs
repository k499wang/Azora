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

const recorded = (coinsAwarded = 10, overrides = {}) => ({
  outcome: 'recorded', coinsAwarded, enrollmentId: 'plan', programDay: 7, ...overrides,
});

function harness({ required = true, ticked = true, claimed = false,
  sharedClient = { pending: 0 }, query = {} } = {}) {
  const navigations = [];
  const alerts = [];
  const claims = [];
  const exports = {};
  const refs = [];
  let refIndex = 0;
  const client = { isMutating: () => sharedClient.pending };
  const dependencies = {
    useRef: (current) => refs[refIndex++] ?? (refs[refIndex - 1] = { current }),
    useNavigation: () => ({ navigate: (...args) => navigations.push(args) }),
    useTodayLocalDate: () => '2026-10-11',
    useQuery: () => ({ data: [{ completedToday: ticked }], ...query }),
    useQueryClient: () => client,
    useIsMutating: () => sharedClient.pending,
    getClaimPlanTodoStepMutationKey: (userId) => ['claim-plan-todo-step', userId],
    getSelfCareGoalsQueryOptions: () => ({}),
    todoStepState,
    isLastUnfinishedDayUnit,
    hasPieceToEarn: () => true,
    takeForcedDayComplete: () => false,
    Alert: { alert: (...args) => alerts.push(args) },
    useClaimPlanTodoStepMutation: () => ({
      mutate: (variables, callbacks) => {
        sharedClient.pending++;
        claims.push({ variables, callbacks: {
          ...callbacks,
          onSettled: () => { sharedClient.pending--; callbacks.onSettled(); },
        } });
      },
    }),
  };
  vm.runInNewContext(compiled, { exports, require: () => dependencies });
  const roomClaim = {
    progress: {},
    dailies: { units: [{ id: 'todo:claim', kind: 'todo', completed: false }] },
  };
  function render({ userId = 'user', enrollmentId = 'plan', programDay = 7,
    localDate = '2026-10-11', required: asks = required, claimed: done = claimed } = {}) {
    refIndex = 0;
    dependencies.useTodayLocalDate = () => localDate;
    return exports.useTodoStepAction(userId, {
      isLoading: false,
      day: { programDay, enrollment: { enrollmentId }, todoStep: { required: asks, claimed: done } },
    }, roomClaim);
  }
  return { action: render(), render, navigations, alerts, claims };
}

test('the claim reward waits for a recorded claim and uses the server coin amount', () => {
  for (const coinsAwarded of [10, 0]) {
    const { action, claims, navigations } = harness();
    action.run();
    assert.equal(navigations.length, 0);
    action.run();
    assert.equal(claims.length, 1, 'a pending claim cannot be submitted twice');
    claims[0].callbacks.onSuccess(recorded(coinsAwarded));
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

test('simultaneous claim buttons share pending state and submit once', () => {
  const sharedClient = { pending: 0 };
  const home = harness({ sharedClient });
  const nextStep = harness({ sharedClient });
  home.action.run();
  nextStep.action.run();
  assert.equal(home.claims.length, 1);
  assert.equal(nextStep.claims.length, 0, 'a second mounted owner cannot race the first');
  assert.equal(nextStep.render().isLoading, true);
  home.claims[0].callbacks.onError(new Error('offline'));
  home.claims[0].callbacks.onSettled();
  nextStep.render().run();
  assert.equal(nextStep.claims.length, 1, 'another owner can retry after settlement');
});

test('a different server-selected plan or day earns coins without celebrating the stale day', () => {
  for (const response of [recorded(10, { enrollmentId: 'new-plan' }), recorded(10, { programDay: 8 })]) {
    const { action, claims, navigations } = harness();
    action.run();
    claims[0].callbacks.onSuccess(response);
    assert.equal(navigations[0][1].coins, 10);
    assert.equal(navigations[0][1].dayCompleteUnitId, undefined);
  }
});

test('a date or displayed plan change during the claim cannot hand off the previous day', () => {
  for (const changes of [{ localDate: '2026-10-12' }, { enrollmentId: 'new-plan' }, { programDay: 8 }]) {
    const { action, claims, navigations, render } = harness();
    action.run();
    render(changes);
    claims[0].callbacks.onSuccess(recorded());
    assert.equal(navigations[0][1].dayCompleteUnitId, undefined);
  }
  const signedOut = harness();
  signedOut.action.run();
  signedOut.render({ userId: null });
  signedOut.claims[0].callbacks.onSuccess(recorded());
  assert.equal(signedOut.navigations.length, 0);
});

test('a claimed step remains complete after unticking; failed goal reads still open Routine', () => {
  const claimed = harness({ claimed: true, ticked: false });
  assert.equal(claimed.action.state, 'claimed');
  claimed.action.run();
  assert.equal(claimed.claims.length, 0);
  const failed = harness({ query: { data: undefined, isError: true } });
  assert.equal(failed.action.isLoading, false);
  failed.action.run();
  assert.equal(failed.navigations[0][0], 'MainTabs');
});
