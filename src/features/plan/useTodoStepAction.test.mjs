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

function harness({ required = true, ticked = true, claimed = false,
  sharedClient = { pending: 0 }, query = {}, units = [{ id: 'todo:claim', kind: 'todo', completed: false }] } = {}) {
  const navigations = [];
  const exports = {};
  const refs = [];
  let refIndex = 0;
  let refocus;
  const dependencies = {
    useRef: (current) => refs[refIndex++] ?? (refs[refIndex - 1] = { current }),
    useWhileVisible: (start) => { refocus = start; },
    useNavigation: () => ({ navigate: (...args) => navigations.push(args) }),
    useTodayLocalDate: () => '2026-10-11',
    useQuery: () => ({ data: [{ completedToday: ticked }], ...query }),
    useQueryClient: () => ({ isMutating: () => sharedClient.pending }),
    useIsMutating: () => sharedClient.pending,
    getClaimPlanTodoStepMutationKey: (userId) => ['claim-plan-todo-step', userId],
    getSelfCareGoalsQueryOptions: () => ({}),
    todoStepState,
    isLastUnfinishedDayUnit,
    hasPieceToEarn: () => true,
    takeForcedDayComplete: () => false,
  };
  vm.runInNewContext(compiled, { exports, require: () => dependencies });
  function render({ userId = 'user', enrollmentId = 'plan', programDay = 7,
    localDate = '2026-10-11', required: asks = required, claimed: done = claimed } = {}) {
    refIndex = 0;
    dependencies.useTodayLocalDate = () => localDate;
    return exports.useTodoStepAction(userId, {
      isLoading: false,
      day: { programDay, enrollment: { enrollmentId }, todoStep: { required: asks, claimed: done } },
    }, { progress: {}, dailies: { units } });
  }
  const action = render();
  refocus();
  return { action, render, navigations, focus: () => refocus() };
}

test('Claim opens the result immediately with its request, without inventing coins', () => {
  const { action, navigations } = harness();
  action.run();
  assert.deepEqual(JSON.parse(JSON.stringify(navigations)), [[
    'ActivityReward', { kind: 'todo', claim: {
      userId: 'user', localDate: '2026-10-11', enrollmentId: 'plan', programDay: 7,
      dayCompleteUnitId: 'todo:claim',
    } },
  ]]);
  action.run();
  assert.equal(navigations.length, 1, 'rapid taps open only one result');
});

test('returning from a failed claim permits opening the result again', () => {
  const { action, navigations, focus } = harness();
  action.run();
  focus();
  action.run();
  assert.equal(navigations.length, 2);
});

test('only the last unfinished unit carries a potential day celebration', () => {
  const { action, navigations } = harness({ units: [
    { id: 'lesson:one', kind: 'lesson', completed: false },
    { id: 'todo:claim', kind: 'todo', completed: false },
  ] });
  action.run();
  assert.equal(navigations[0][1].claim.dayCompleteUnitId, undefined);
});

test('an unticked step opens Routine and an unrequired or claimed step does nothing', () => {
  const open = harness({ ticked: false });
  open.action.run();
  assert.deepEqual(JSON.parse(JSON.stringify(open.navigations)), [
    ['MainTabs', { screen: 'Plan' }, { pop: true }],
  ]);
  for (const options of [{ required: false }, { claimed: true, ticked: false }]) {
    const absent = harness(options);
    absent.action.run();
    assert.equal(absent.navigations.length, 0);
  }
});

test('an in-flight claim blocks other mounted buttons until it settles', () => {
  const sharedClient = { pending: 1 };
  const home = harness({ sharedClient });
  home.action.run();
  assert.equal(home.navigations.length, 0);
  assert.equal(home.action.isLoading, true);
  sharedClient.pending = 0;
  home.render().run();
  assert.equal(home.navigations.length, 1);
});

test('failed goal reads still open Routine; signed-out users cannot open a claim', () => {
  const failed = harness({ query: { data: undefined, isError: true } });
  assert.equal(failed.action.isLoading, false);
  failed.action.run();
  assert.equal(failed.navigations[0][0], 'MainTabs');
  const signedOut = harness();
  signedOut.render({ userId: null }).run();
  assert.equal(signedOut.navigations.length, 0);
});
