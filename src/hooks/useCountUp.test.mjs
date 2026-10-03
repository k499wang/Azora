import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(
  readFileSync(new URL('./useCountUp.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

const FRAME_MS = 16;

/** A one-component React with a fake clock: enough to run the hook's timers. */
function mount(initialTarget) {
  let now = 0;
  let timers = [];
  let frames = [];
  let nextHandle = 1;
  const slots = [];
  let cursor = 0;
  let dirty = false;
  let rendering = false;
  let target = initialTarget;
  let shown;
  const steps = [];

  const react = {
    useState(initial) {
      const key = cursor++;
      if (!(key in slots)) slots[key] = initial;
      return [slots[key], (value) => {
        if (Object.is(slots[key], value)) return;
        slots[key] = value;
        dirty = true;
        if (!rendering) flush();
      }];
    },
    useRef(initial) {
      const key = cursor++;
      if (!(key in slots)) slots[key] = { current: initial };
      return slots[key];
    },
    useEffect(effect, deps) {
      const key = cursor++;
      const previous = slots[key];
      if (previous != null && deps.every((dep, index) => dep === previous.deps[index])) return;
      const record = { deps, cleanup: undefined };
      slots[key] = record;
      pending.push(() => {
        previous?.cleanup?.();
        record.cleanup = effect();
      });
    },
  };
  let pending = [];

  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require: (name) => {
      if (name === 'react') return react;
      if (name === './useWhileVisible') return { useWhileVisible: react.useEffect };
      throw new Error(`Unexpected dependency: ${name}`);
    },
    Date: { now: () => now },
    setTimeout: (fn, ms) => { const handle = nextHandle++; timers.push({ handle, at: now + ms, fn }); return handle; },
    clearTimeout: (handle) => { timers = timers.filter((timer) => timer.handle !== handle); },
    requestAnimationFrame: (fn) => { const handle = nextHandle++; frames.push({ handle, fn }); return handle; },
    cancelAnimationFrame: (handle) => { frames = frames.filter((frame) => frame.handle !== handle); },
  });

  const options = {
    delayMs: 760,
    msPerStep: 50,
    maxDurationMs: 1200,
    onStep: (value, landed) => steps.push({ value, landed }),
  };

  function renderOnce() {
    rendering = true;
    cursor = 0;
    pending = [];
    shown = exports.useCountUp(target, options);
    rendering = false;
    const effects = pending;
    effects.forEach((run) => run());
  }

  function flush() {
    dirty = true;
    while (dirty) {
      dirty = false;
      renderOnce();
    }
  }

  flush();
  return {
    get shown() { return shown; },
    steps,
    render(next) { target = next; flush(); },
    hide() { slots.forEach((slot) => slot?.cleanup?.()); },
    advance(ms) {
      const end = now + ms;
      while (now < end) {
        now = Math.min(end, now + FRAME_MS);
        const due = timers.filter((timer) => timer.at <= now);
        timers = timers.filter((timer) => timer.at > now);
        due.forEach((timer) => timer.fn());
        const queued = frames;
        frames = [];
        queued.forEach((frame) => frame.fn());
      }
    },
  };
}

test('the first known balance lands without counting or feedback', () => {
  const pill = mount(undefined);
  assert.equal(pill.shown, 0);
  pill.render(340);
  assert.equal(pill.shown, 340);
  pill.advance(3000);
  assert.equal(pill.steps.length, 0);
});

test('a gain waits for the coins to arrive, then counts every unit and lands once', () => {
  const pill = mount(100);
  pill.render(110);
  pill.advance(700);
  assert.equal(pill.shown, 100);
  pill.advance(1000);
  assert.equal(pill.shown, 110);
  assert.deepEqual(
    pill.steps.map((step) => step.value),
    [101, 102, 103, 104, 105, 106, 107, 108, 109, 110],
  );
  assert.deepEqual(
    pill.steps.filter((step) => step.landed).map((step) => step.value),
    [110],
  );
});

test('a drop lands at once and stays silent', () => {
  const pill = mount(110);
  pill.render(90);
  assert.equal(pill.shown, 90);
  pill.advance(3000);
  assert.equal(pill.steps.length, 0);
});

test('a second gain mid-count carries on from where the number is', () => {
  const pill = mount(100);
  pill.render(110);
  pill.advance(760 + 250);
  const reached = pill.shown;
  assert.ok(reached > 100 && reached < 110);
  pill.render(130);
  pill.advance(3000);
  assert.equal(pill.shown, 130);
  const values = pill.steps.map((step) => step.value);
  assert.deepEqual(values, Array.from({ length: 30 }, (_, index) => 101 + index));
  assert.deepEqual(pill.steps.filter((step) => step.landed).map((step) => step.value), [130]);
});

test('leaving the screen cancels delayed counting and in-progress feedback', () => {
  for (const elapsed of [100, 1000]) {
    const pill = mount(100);
    pill.render(120);
    pill.advance(elapsed);
    const reached = pill.shown;
    const feedbackCount = pill.steps.length;
    pill.hide();
    pill.advance(3000);
    assert.equal(pill.shown, reached);
    assert.equal(pill.steps.length, feedbackCount);
  }
});
