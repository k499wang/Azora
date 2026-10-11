import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(
  readFileSync(new URL('./useTodoClaimRewardPreview.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

function setup(mode = 'quick', dev = true) {
  const slots = [];
  const timers = [];
  let cursor = 0;
  let effects = [];
  let visible = true;
  let alive = true;
  const dependencies = {
    useState(initial) {
      const index = cursor++;
      slots[index] ??= { value: initial };
      return [slots[index].value, (value) => {
        assert.equal(alive, true, 'a closed preview must not update state');
        slots[index].value = typeof value === 'function' ? value(slots[index].value) : value;
      }];
    },
    useWhileVisible(start, deps) {
      const index = cursor++;
      const nextDeps = [...deps, visible];
      if (!slots[index] || nextDeps.some((value, i) => !Object.is(value, slots[index].deps[i]))) {
        effects.push({ index, start, deps: nextDeps });
      }
    },
    startUiTimer(ms, callback) {
      const timer = { ms, callback, active: true };
      timers.push(timer);
      return () => { timer.active = false; };
    },
    EARN_RATES: { todoStep: 10 },
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, __DEV__: dev,
    require(name) {
      assert.ok(['react', '../../hooks/useWhileVisible', '../../lib/ui/uiThreadTimer', '../../lib/wallet/coins'].includes(name),
        `preview must not import a persistence service: ${name}`);
      return dependencies;
    },
  });
  const render = () => {
    cursor = 0;
    const view = exports.useTodoClaimRewardPreview(mode);
    for (const { index, start, deps } of effects) {
      slots[index]?.cleanup?.();
      slots[index] = { deps, cleanup: visible ? start(true) : () => {} };
    }
    effects = [];
    return view;
  };
  return {
    render, timers,
    activeTimers: () => timers.filter((timer) => timer.active),
    fire() {
      const timer = timers.find((entry) => entry.active);
      assert.ok(timer, 'one pending save timer exists');
      timer.active = false;
      timer.callback();
      return render();
    },
    focus(value) { visible = value; return render(); },
    unmount() {
      for (const slot of slots) slot.cleanup?.();
      alive = false;
    },
  };
}

for (const [mode, ms] of [['quick', 100], ['slow', 2500]]) {
  test(`${mode} preview saves after its delay and never celebrates a real day`, async () => {
    const harness = setup(mode);
    const pending = harness.render();
    assert.equal(pending.response, null);
    assert.equal(pending.canRetry, false);
    assert.equal(harness.activeTimers()[0].ms, ms);
    for (let cycle = 0; cycle < 10; cycle++) harness.render();
    assert.equal(harness.timers.length, 1, 'rerenders do not start duplicate saves');
    const saved = harness.fire();
    assert.equal(saved.response.outcome, 'recorded');
    assert.equal(saved.response.coinsAwarded, 10);
    assert.equal(saved.getDayCompleteUnitId(), undefined);
    await saved.retry();
    harness.render();
    assert.equal(harness.activeTimers().length, 0);
    harness.unmount();
  });
}

test('failure preview keeps the reward pending, then succeeds through Retry', async () => {
  const harness = setup('retry');
  harness.render();
  assert.equal(harness.activeTimers()[0].ms, 700);
  const failed = harness.fire();
  assert.equal(failed.response, null);
  assert.equal(failed.failed, true);
  assert.equal(failed.canRetry, true);
  await failed.retry();
  const retrying = harness.render();
  assert.equal(retrying.failed, false);
  assert.equal(retrying.canRetry, false);
  assert.equal(harness.activeTimers()[0].ms, 100);
  assert.equal(harness.fire().response.coinsAwarded, 10);
  harness.unmount();
});

test('ten preview openings each start fresh and cancel timers when closed', () => {
  for (let cycle = 0; cycle < 10; cycle++) {
    const harness = setup('slow');
    assert.equal(harness.render().response, null);
    assert.equal(harness.activeTimers().length, 1);
    harness.focus(false);
    assert.equal(harness.activeTimers().length, 0);
    harness.focus(true);
    assert.equal(harness.activeTimers().length, 1);
    harness.unmount();
    assert.equal(harness.activeTimers().length, 0);
  }
});

test('production builds never simulate claims or start timers', async () => {
  for (const mode of ['quick', 'slow', 'retry']) {
    const harness = setup(mode, false);
    const view = harness.render();
    assert.equal(view.response, null);
    assert.equal(view.failed, false);
    assert.equal(view.canRetry, false);
    assert.equal(view.getDayCompleteUnitId(), undefined);
    await view.retry();
    assert.equal(harness.timers.length, 0);
    harness.unmount();
  }
});
