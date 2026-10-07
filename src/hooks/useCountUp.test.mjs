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
function mount(initialTarget, overrides = {}, { deferJS = false } = {}) {
  let now = 0;
  const slots = [];
  let cursor = 0;
  let dirty = false;
  let rendering = false;
  let target = initialTarget;
  let shown;
  const steps = [];
  const queuedJS = [];
  let pendingEffects = [];
  let mounted = true;
  let updatesAfterUnmount = 0;
  // The frame clock the hook counts on: shared values, timed animations and
  // reactions, advanced one frame at a time by `advance`.
  let animations = [];
  const reactions = [];

  function makeShared(initial) {
    const shared = {
      current: initial,
      get value() { return this.current; },
      set value(next) {
        animations = animations.filter((animation) => animation.shared !== shared);
        if (next != null && next.isAnimation) {
          animations.push({ shared, from: this.current, startAt: now, ...next });
        } else {
          this.current = next;
        }
      },
    };
    return shared;
  }

  const reanimated = {
    Easing: { linear: (t) => t },
    cancelAnimation: (shared) => {
      animations = animations.filter((animation) => animation.shared !== shared);
    },
    runOnJS: (fn) => (...args) => {
      if (deferJS) queuedJS.push(() => fn(...args));
      else fn(...args);
    },
    withTiming: (to, { duration }) => ({ isAnimation: true, to, duration, delay: 0 }),
    withDelay: (delay, animation) => ({ ...animation, delay }),
    useSharedValue(initial) {
      const key = cursor++;
      if (!(key in slots)) slots[key] = makeShared(initial);
      return slots[key];
    },
    useAnimatedReaction(prepare, react) {
      const key = cursor++;
      if (!(key in slots)) {
        slots[key] = { prepare, react, last: null, started: false };
        reactions.push(slots[key]);
      } else {
        slots[key].prepare = prepare;
        slots[key].react = react;
      }
    },
  };

  function runFrame() {
    animations.forEach((animation) => {
      const elapsed = now - animation.startAt - animation.delay;
      if (elapsed < 0) return;
      const t = animation.duration === 0 ? 1 : Math.min(1, elapsed / animation.duration);
      animation.shared.current = animation.from + (animation.to - animation.from) * t;
    });
    animations = animations.filter(
      (animation) => now - animation.startAt - animation.delay < animation.duration,
    );
    reactions.forEach((reaction) => {
      const value = reaction.prepare();
      if (!reaction.started) {
        reaction.started = true;
        reaction.last = value;
        return;
      }
      if (value === reaction.last) return;
      const previous = reaction.last;
      reaction.last = value;
      reaction.react(value, previous);
    });
  }

  const react = {
    useCallback: (callback) => callback,
    useState(initial) {
      const key = cursor++;
      if (!(key in slots)) slots[key] = initial;
      return [slots[key], (value) => {
        if (!mounted) {
          updatesAfterUnmount += 1;
          return;
        }
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
  // The screen's focus, as `useWhileVisible` reads it: work runs only while
  // shown, and starts again with `cameIntoView` on return.
  const view = { visible: true, start: null, stop: null };

  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require: (name) => {
      if (name === 'react') return react;
      if (name === 'react-native-reanimated') return reanimated;
      if (name === './useWhileVisible') {
        return {
          useWhileVisible: (start, deps) => react.useEffect(() => {
            view.start = start;
            view.stop = view.visible ? start(false) : null;
            return () => {
              view.stop?.();
              view.stop = null;
            };
          }, deps),
        };
      }
      throw new Error(`Unexpected dependency: ${name}`);
    },
    Date: { now: () => now },
  });

  const options = {
    delayMs: 760,
    msPerStep: 50,
    maxDurationMs: 1200,
    onStep: (value, landed) => steps.push({ value, landed }),
    ...overrides,
  };

  function renderOnce(runEffects = true) {
    rendering = true;
    cursor = 0;
    pending = [];
    shown = exports.useCountUp(target, options);
    rendering = false;
    const effects = pending;
    if (runEffects) effects.forEach((run) => run());
    else pendingEffects.push(...effects);
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
    get queuedCount() { return queuedJS.length; },
    get updatesAfterUnmount() { return updatesAfterUnmount; },
    get animationCount() { return animations.length; },
    steps,
    render(next) { target = next; flush(); },
    renderBeforeEffects(next) { target = next; renderOnce(false); },
    flushEffects() {
      const effects = pendingEffects;
      pendingEffects = [];
      effects.forEach((run) => run());
    },
    flushJS() {
      const callbacks = queuedJS.splice(0);
      callbacks.forEach((run) => run());
    },
    hide() {
      view.visible = false;
      view.stop?.();
      view.stop = null;
    },
    show() {
      view.visible = true;
      view.stop = view.start(true);
    },
    unmount() {
      mounted = false;
      slots.forEach((slot) => slot?.cleanup?.());
    },
    advance(ms) {
      const end = now + ms;
      while (now < end) {
        now = Math.min(end, now + FRAME_MS);
        runFrame();
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
  assert.equal(values[0], 101);
  assert.equal(values.at(-1), 130);
  assert.ok(values.every((value, index) => index === 0 || value > values[index - 1]));
  assert.deepEqual(pill.steps.filter((step) => step.landed).map((step) => step.value), [130]);
});

test('a gain too large to count unit by unit takes no more steps than the count has time for', () => {
  const pill = mount(100);
  pill.render(200);
  pill.advance(3000);
  assert.equal(pill.shown, 200);
  // 1200ms at 50ms a step: 24 renders, not one per frame for the whole count.
  assert.equal(pill.steps.length, 24);
  assert.deepEqual(pill.steps.filter((step) => step.landed).map((step) => step.value), [200]);
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

test('a second gain while the first is still waiting keeps the first start time', () => {
  const pill = mount(100);
  pill.render(110);
  pill.advance(500);
  pill.render(130);
  // Counting starts when the first coins land, not 760ms after the second tick.
  pill.advance(300);
  assert.ok(pill.shown > 100);
  pill.advance(3000);
  assert.equal(pill.shown, 130);
  assert.deepEqual(pill.steps.filter((step) => step.landed).map((step) => step.value), [130]);
});

test('a minimum step length counts in strides, still landing exactly once', () => {
  const pill = mount(100, { minStepMs: 100 });
  pill.render(110);
  pill.advance(3000);
  assert.equal(pill.shown, 110);
  assert.deepEqual(pill.steps.map((step) => step.value), [102, 104, 106, 108, 110]);
  assert.deepEqual(pill.steps.filter((step) => step.landed).map((step) => step.value), [110]);
});

test('a gain made out of view lands on return without counting', () => {
  const pill = mount(100);
  pill.hide();
  pill.render(110);
  pill.show();
  assert.equal(pill.shown, 110);
  pill.advance(3000);
  assert.equal(pill.steps.length, 0);
});

test('a counter that counts nothing lands every gain at once', () => {
  const pill = mount(100, { counts: false });
  pill.render(110);
  assert.equal(pill.shown, 110);
  pill.advance(3000);
  assert.equal(pill.steps.length, 0);
});

test('a gain one counter already counted lands at once on another', () => {
  const seen = { current: undefined };
  const first = mount(100, { seen });
  const second = mount(100, { seen });
  first.render(110);
  first.advance(3000);
  assert.equal(first.shown, 110);
  second.render(110);
  assert.equal(second.shown, 110);
  second.advance(3000);
  assert.equal(second.steps.length, 0);
});

for (const reason of ['screen blur', 'app background']) {
  test(`queued counting callbacks are discarded after ${reason}`, () => {
    const seen = { current: undefined };
    const pill = mount(100, { seen }, { deferJS: true });
    pill.render(110);
    pill.advance(1000);
    assert.ok(pill.queuedCount > 0);
    // Both events close the same visibility gate in useWhileVisible.
    pill.hide();
    assert.equal(pill.animationCount, 0);
    // Another visible counter may update their shared record in the meantime.
    seen.current = 300;
    pill.flushJS();
    assert.equal(pill.shown, 100);
    assert.equal(seen.current, 300);
    assert.equal(pill.steps.length, 0);
  });
}

test('unmount rejects queued state updates, feedback, and shared balance writes', () => {
  const seen = { current: undefined };
  const pill = mount(100, { seen }, { deferJS: true });
  pill.render(110);
  pill.advance(1000);
  assert.ok(pill.queuedCount > 0);
  pill.unmount();
  pill.flushJS();
  assert.equal(pill.animationCount, 0);
  assert.equal(pill.updatesAfterUnmount, 0);
  assert.equal(seen.current, 100);
  assert.equal(pill.steps.length, 0);
});

test('a target drop rejects callbacks even before passive cleanup', () => {
  const seen = { current: undefined };
  const pill = mount(100, { seen }, { deferJS: true });
  pill.render(110);
  pill.advance(1000);
  assert.ok(pill.queuedCount > 0);
  pill.renderBeforeEffects(50);
  pill.flushJS();
  assert.equal(pill.shown, 100);
  assert.equal(seen.current, 100);
  assert.equal(pill.steps.length, 0);
  pill.flushEffects();
  assert.equal(pill.shown, 50);
  assert.equal(seen.current, 50);
  assert.equal(pill.animationCount, 0);
});

test('a new gain rejects queued old steps and preserves the original deadline', () => {
  const pill = mount(100, {}, { deferJS: true });
  pill.render(110);
  pill.advance(1000);
  assert.ok(pill.queuedCount > 0);
  pill.renderBeforeEffects(130);
  pill.flushJS();
  assert.equal(pill.shown, 100);
  assert.equal(pill.steps.length, 0);
  pill.flushEffects();
  pill.advance(100);
  pill.flushJS();
  assert.ok(pill.shown > 100, 'the extended count must not wait another delay');
  pill.advance(2000);
  pill.flushJS();
  assert.equal(pill.shown, 130);
  assert.deepEqual(pill.steps.filter((step) => step.landed).map((step) => step.value), [130]);
});

test('queued callbacks cannot join a later count to the same target across ten visibility cycles', () => {
  const pill = mount(100, {}, { deferJS: true });
  for (let cycle = 0; cycle < 10; cycle += 1) {
    pill.render(100);
    pill.render(110);
    pill.advance(1000);
    assert.ok(pill.queuedCount > 0);
    pill.hide();
    assert.equal(pill.animationCount, 0);
    pill.show();
    assert.equal(pill.shown, 110);
    pill.render(100);
    pill.render(110);
    pill.flushJS();
    assert.equal(pill.shown, 100, 'old generation must not advance the new count');
    assert.equal(pill.steps.length, cycle * 10);
    pill.advance(2000);
    pill.flushJS();
    assert.equal(pill.shown, 110);
    assert.equal(pill.animationCount, 0);
  }
  assert.equal(pill.steps.filter((step) => step.landed).length, 10);
});

test('a missing target cancels counting and rejects queued feedback', () => {
  const pill = mount(100, {}, { deferJS: true });
  pill.render(110);
  pill.advance(1000);
  assert.ok(pill.queuedCount > 0);
  pill.render(undefined);
  pill.flushJS();
  assert.equal(pill.animationCount, 0);
  assert.equal(pill.shown, 100);
  assert.equal(pill.steps.length, 0);
});

test('valid delayed JS callbacks land normally and do not land twice when flushed again', () => {
  const pill = mount(100, {}, { deferJS: true });
  pill.render(110);
  pill.advance(2000);
  assert.equal(pill.shown, 100);
  pill.flushJS();
  pill.flushJS();
  assert.equal(pill.shown, 110);
  assert.deepEqual(pill.steps.map((step) => step.value), [101, 102, 103, 104, 105, 106, 107, 108, 109, 110]);
  assert.deepEqual(pill.steps.filter((step) => step.landed).map((step) => step.value), [110]);
});
