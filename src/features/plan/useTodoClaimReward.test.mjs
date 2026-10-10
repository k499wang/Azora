import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { programDayForDate } from '../program/domain/programEnrollment.ts';

const compiled = ts.transpileModule(
  readFileSync(new URL('./useTodoClaimReward.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;
const request = {
  userId: 'user', localDate: '2026-10-11', enrollmentId: 'plan',
  programDay: 7, dayCompleteUnitId: 'todo:claim',
};
const recorded = (coinsAwarded = 10, overrides = {}) => ({
  outcome: 'recorded', coinsAwarded, enrollmentId: 'plan', programDay: 7, ...overrides,
});

function setup({ userId = 'user', date = request.localDate, sharedPending = 0 } = {}) {
  const slots = [];
  const effects = [];
  const claims = [];
  const exports = {};
  let cursor = 0;
  let dirty = false;
  let alive = true;
  let queryPending = false;
  let enrollment = { enrollmentId: 'plan', programDay: 7, status: 'active', lastAdvancedOn: null };
  let view;
  const slot = (initial) => {
    const index = cursor++;
    if (!(index in slots)) slots[index] = initial();
    return slots[index];
  };
  const mutateAsync = (variables) => {
    sharedPending++;
    return new Promise((resolve, reject) => claims.push({
      variables,
      resolve(value) { sharedPending--; resolve(value); },
      reject(error) { sharedPending--; reject(error); },
    }));
  };
  const dependencies = {
    useRef: (current) => slot(() => ({ current })),
    useState(initial) {
      const state = slot(() => ({ value: initial }));
      return [state.value, (value) => {
        assert.equal(alive, true, 'a closed result must not update React state');
        state.value = value; dirty = true;
      }];
    },
    useEffect(callback, deps) {
      const state = slot(() => ({}));
      if (state.deps && state.deps.length === deps.length && deps.every((value, i) => Object.is(value, state.deps[i]))) return;
      state.deps = deps;
      effects.push(() => { state.cleanup?.(); state.cleanup = callback(); });
    },
    useQueryClient: () => ({
      isMutating: () => sharedPending,
      getQueryData: () => enrollment,
    }),
    useIsMutating: () => sharedPending,
    getClaimPlanTodoStepMutationKey: (id) => ['claim-plan-todo-step', id],
    useTodayLocalDate: () => date,
    useProgramEnrollmentQuery: () => ({ data: enrollment, isPending: queryPending }),
    getProgramEnrollmentQueryKey: (id) => ['program-enrollment', id],
    useClaimPlanTodoStepMutation: () => ({ mutateAsync }),
    programDayForDate,
    formatLocalDate: () => date,
  };
  dependencies.useAuthStore = (select) => select(dependencies.useAuthStore.getState());
  dependencies.useAuthStore.getState = () => ({ user: userId == null ? null : { id: userId } });
  vm.runInNewContext(compiled, { exports, require: () => dependencies });
  const render = () => {
    dirty = false; cursor = 0;
    view = exports.useTodoClaimReward(request);
    while (effects.length) effects.shift()();
    return view;
  };
  const flush = async () => {
    await new Promise((resolve) => setImmediate(resolve));
    render();
    if (dirty) render();
    return view;
  };
  render();
  return {
    claims, render, flush, view: () => view,
    owner(id) { userId = id; },
    date(value) { date = value; },
    plan(value) { enrollment = { ...enrollment, ...value }; },
    sharedPending(value) { sharedPending = value; },
    queryPending(value) { queryPending = value; },
    unmount() {
      for (const state of slots) state?.cleanup?.();
      alive = false;
    },
  };
}

test('the result starts one claim while slow responses show no fabricated reward', async () => {
  for (const coins of [10, 0]) {
    const harness = setup();
    assert.equal(harness.claims.length, 1);
    assert.equal(harness.view().response, null);
    assert.equal(harness.view().getDayCompleteUnitId(), undefined);
    for (let render = 0; render < 10; render++) harness.render();
    harness.view().retry(); harness.view().retry();
    assert.equal(harness.claims.length, 1);
    harness.claims[0].resolve(recorded(coins));
    const view = await harness.flush();
    assert.equal(view.response.coinsAwarded, coins);
    assert.equal(view.getDayCompleteUnitId(), 'todo:claim');
    view.retry();
    assert.equal(harness.claims.length, 1, 'confirmed claims cannot be resubmitted');
    harness.unmount();
  }
});

test('refusals and failures stay on the result with a single safe retry', async () => {
  for (const outcome of ['not_required', 'no_todo_ticked', 'no_active_enrollment', 'invalid_date', 'unavailable', 'offline']) {
    const harness = setup();
    if (outcome === 'offline') harness.claims[0].reject(new Error('offline'));
    else harness.claims[0].resolve({ outcome, coinsAwarded: 0 });
    let view = await harness.flush();
    assert.equal(view.failed, true, outcome);
    assert.equal(view.response, null);
    assert.equal(view.getDayCompleteUnitId(), undefined);
    view.retry(); view.retry();
    assert.equal(harness.claims.length, 2);
    view = harness.render();
    assert.equal(view.failed, false);
    harness.claims[1].resolve(recorded(0));
    view = await harness.flush();
    assert.equal(view.response.coinsAwarded, 0);
    harness.unmount();
  }
});

test('Back/unmount discards late successful and failed responses over ten cycles', async () => {
  for (let cycle = 0; cycle < 10; cycle++) {
    const harness = setup();
    harness.unmount();
    if (cycle % 2) harness.claims[0].reject(new Error('offline'));
    else harness.claims[0].resolve(recorded());
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(harness.view().response, null);
  }
});

test('shared pending claims wait instead of racing a second write', async () => {
  const harness = setup({ sharedPending: 1 });
  assert.equal(harness.claims.length, 0);
  assert.equal(harness.view().failed, false);
  harness.sharedPending(0);
  harness.render();
  assert.equal(harness.claims.length, 1);
  harness.claims[0].resolve(recorded(0));
  assert.equal((await harness.flush()).response.coinsAwarded, 0);
});

test('account/date/plan changes block initial claims and stale retries', async () => {
  for (const change of [
    (harness) => harness.owner(null),
    (harness) => harness.owner('other-user'),
    (harness) => harness.date('2026-10-12'),
    (harness) => harness.plan({ enrollmentId: 'new-plan' }),
    (harness) => harness.plan({ programDay: 8 }),
  ]) {
    const harness = setup();
    harness.claims[0].reject(new Error('offline'));
    await harness.flush();
    change(harness);
    const view = harness.render();
    assert.equal(view.canRetry, false);
    view.retry();
    assert.equal(harness.claims.length, 1);
    assert.equal(view.getDayCompleteUnitId(), undefined);
  }
  for (const options of [{ userId: null }, { userId: 'other-user' }, { date: '2026-10-12' }]) {
    const harness = setup(options);
    assert.equal(harness.claims.length, 0);
    assert.equal(harness.view().failed, true);
  }
});

test('handoff uses the server day and rechecks canonical identity at Continue', async () => {
  for (const overrides of [{ enrollmentId: 'new-plan' }, { programDay: 8 }]) {
    const harness = setup();
    harness.claims[0].resolve(recorded(10, overrides));
    const view = await harness.flush();
    assert.equal(view.response.coinsAwarded, 10);
    assert.equal(view.getDayCompleteUnitId(), undefined);
  }
  for (const change of [
    (harness) => harness.owner('other-user'),
    (harness) => harness.date('2026-10-12'),
    (harness) => harness.plan({ enrollmentId: 'new-plan' }),
    (harness) => harness.plan({ programDay: 8 }),
  ]) {
    const harness = setup();
    harness.claims[0].resolve(recorded());
    const view = await harness.flush();
    assert.equal(view.getDayCompleteUnitId(), 'todo:claim');
    change(harness);
    assert.equal(view.getDayCompleteUnitId(), undefined, 'recheck works even before another render');
  }
  const harness = setup();
  harness.plan({ programDay: 8, lastAdvancedOn: request.localDate });
  harness.claims[0].resolve(recorded());
  assert.equal((await harness.flush()).getDayCompleteUnitId(), 'todo:claim', 'normal server advancement preserves today');
});

test('an account switch during the request never shows another account the reward', async () => {
  const harness = setup();
  harness.owner('other-user');
  harness.render();
  harness.claims[0].resolve(recorded());
  const view = await harness.flush();
  assert.equal(view.response, null);
  assert.equal(view.failed, true);
  assert.equal(view.getDayCompleteUnitId(), undefined);
});
