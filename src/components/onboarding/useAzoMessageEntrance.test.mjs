import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup({ reducedMotion = false, deferredSnapshots = false } = {}) {
  const slots = [];
  const effects = [];
  const listeners = new Map();
  const timers = new Map();
  const nativeWork = new Set();
  const snapshots = [];
  const animationCallbacks = [];
  let cursor = 0;
  let now = 0;
  let nextTimer = 0;
  let focused = true;
  let reduced = reducedMotion;
  let stateUpdates = 0;
  let buzzes = 0;
  const stable = (create) => {
    const index = cursor++;
    if (!(index in slots)) slots[index] = create();
    return slots[index];
  };
  const setTimer = (callback, delay, kind = 'js') => {
    const id = ++nextTimer;
    timers.set(id, { callback, due: now + delay, kind });
    return id;
  };
  const subscribe = (event, callback) => {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(callback);
    return () => listeners.get(event).delete(callback);
  };
  const appState = {
    currentState: 'active',
    addEventListener: (_, callback) => ({ remove: subscribe('app', callback) }),
  };
  const navigation = { isFocused: () => focused, addListener: subscribe };
  const react = {
    useContext: () => navigation,
    useRef: (initial) => stable(() => ({ current: initial })),
    useState(initial) {
      const slot = stable(() => ({ value: typeof initial === 'function' ? initial() : initial }));
      return [slot.value, (next) => { slot.value = next; stateUpdates += 1; }];
    },
    useEffect(callback, dependencies) {
      const slot = stable(() => ({}));
      if (slot.dependencies && dependencies.every((value, index) => Object.is(value, slot.dependencies[index]))) return;
      slot.cleanup?.();
      slot.dependencies = dependencies;
      effects.push(() => { slot.cleanup = callback(); });
    },
  };
  const easing = {
    cubic: (t) => t ** 3,
    quad: (t) => t ** 2,
    sin: (t) => 1 - Math.cos(t * Math.PI / 2),
    in: (fn) => fn,
    out: (fn) => (t) => 1 - fn(1 - t),
    inOut: (fn) => fn,
    bezier: () => (t) => t,
  };
  class Value {
    constructor(value) { this.value = value; this.running = null; }
    read() {
      if (!this.running) return this.value;
      const run = this.running;
      const fraction = Math.min(1, (now - run.started) / run.config.duration);
      return run.from + (run.config.toValue - run.from) * run.config.easing(fraction);
    }
    setValue(value) { this.value = value; }
    stopAnimation(callback) {
      this.value = this.read();
      if (this.running) {
        const run = this.running;
        timers.delete(run.timer);
        nativeWork.delete(run);
        this.running = null;
        run.callback({ finished: false });
      }
      const value = this.value;
      if (deferredSnapshots) snapshots.push(() => callback(value));
      else callback(value);
    }
  }
  const Animated = {
    Value,
    timing(value, config) {
      return {
        start(callback) {
          animationCallbacks.push(callback);
          const run = { config, callback, from: value.read(), started: now };
          value.running = run;
          nativeWork.add(run);
          run.timer = setTimer(() => {
            value.value = config.toValue;
            value.running = null;
            nativeWork.delete(run);
            callback({ finished: true });
          }, config.duration, 'native');
        },
      };
    },
  };
  const cache = new Map();
  const load = (url) => {
    if (cache.has(url.href)) return cache.get(url.href);
    const exports = {};
    cache.set(url.href, exports);
    vm.runInNewContext(ts.transpileModule(readFileSync(url, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText, {
      exports,
      Date: { now: () => now },
      setTimeout: setTimer,
      clearTimeout: (id) => timers.delete(id),
      require(name) {
        if (name === 'react') return react;
        if (name === 'react-native') return { Animated, Easing: easing, AppState: appState };
        if (name === 'react-native-reanimated') return { useReducedMotion: () => reduced, Easing: easing };
        if (name === '@react-navigation/native') return { NavigationContext: {} };
        if (name.endsWith('/tapHaptics')) return { triggerSuccessHaptic: () => { buzzes += 1; } };
        if (name.endsWith('/uiThreadTimer')) return {
          startUiTimer(delay, callback) {
            let cancelled = false;
            const id = setTimer(() => { if (!cancelled) callback(); }, delay, 'ui-timer');
            return () => { cancelled = true; timers.delete(id); };
          },
        };
        if (name.startsWith('.')) return load(new URL(`${name}.ts`, url));
        throw new Error(`Unexpected import: ${name}`);
      },
    });
    return exports;
  };
  const hook = load(new URL('./useAzoMessageEntrance.ts', import.meta.url)).useAzoMessageEntrance;
  const duration = load(new URL('../../theme/motion.ts', import.meta.url)).duration;

  return {
    duration, timers, nativeWork, animationCallbacks,
    render() {
      cursor = 0;
      const result = hook();
      effects.splice(0).forEach((effect) => effect());
      return result;
    },
    advance(milliseconds) {
      const until = now + milliseconds;
      while (true) {
        const next = [...timers.entries()].sort((a, b) => a[1].due - b[1].due)[0];
        if (!next || next[1].due > until) break;
        now = next[1].due;
        timers.delete(next[0]);
        next[1].callback();
      }
      now = until;
    },
    foreground(value) {
      appState.currentState = value ? 'active' : 'background';
      listeners.get('app')?.forEach((callback) => callback());
    },
    focus(value) {
      focused = value;
      listeners.get(value ? 'focus' : 'blur')?.forEach((callback) => callback());
    },
    setReducedMotion(value) { reduced = value; this.render(); },
    flushSnapshots() { snapshots.splice(0).forEach((callback) => callback()); },
    unmount() { slots.forEach((slot) => slot?.cleanup?.()); },
    remount() { this.unmount(); slots.length = 0; return this.render(); },
    stateUpdates: () => stateUpdates,
    buzzes: () => buzzes,
    listenerCount: () => [...listeners.values()].reduce((total, set) => total + set.size, 0),
  };
}

test('title reading precedes notification, one buzz, prompt, and enabled invitation', () => {
  const h = setup();
  const opening = h.render();
  assert.equal(opening.phase, 'title');
  assert.equal(opening.ready, false);
  assert.equal(opening.progress.read(), 0);
  assert.equal(h.nativeWork.size, 0);
  assert.equal(h.buzzes(), 0);
  h.advance(h.duration.fill * 2 - 1);
  assert.equal(h.render().phase, 'title');
  h.advance(1);
  assert.equal(h.render().phase, 'notification');
  assert.equal(h.buzzes(), 0);
  h.advance(h.duration.slow);
  assert.equal(h.render().phase, 'prompt');
  assert.equal(h.buzzes(), 1);
  assert.equal(opening.progress.read(), 1);
  assert.equal(h.render().ready, false);
  h.advance(h.duration.slow);
  assert.equal(h.render().ready, true);
  assert.equal(opening.progress.read(), 2);
  assert.equal(h.buzzes(), 1);
  assert.equal(h.timers.size, 0);
  assert.equal(h.nativeWork.size, 0);
  h.unmount();
  assert.equal(h.listenerCount(), 0);
});

test('backgrounding pauses the remaining title reading time and ignores a cancelled callback', () => {
  const h = setup();
  h.render();
  const cancelledReading = [...h.timers.values()][0].callback;
  h.advance(600);
  h.foreground(false);
  cancelledReading();
  h.advance(10000);
  assert.equal(h.render().phase, 'title');
  assert.equal(h.nativeWork.size, 0);
  assert.equal(h.timers.size, 0);
  assert.equal(h.buzzes(), 0);
  h.foreground(true);
  h.advance(h.duration.fill * 2 - 600 - 1);
  assert.equal(h.render().phase, 'title');
  h.advance(1);
  assert.equal(h.render().phase, 'notification');
  h.unmount();
  assert.equal(h.nativeWork.size, 0);
  assert.equal(h.timers.size, 0);
  assert.equal(h.buzzes(), 0);
});

test('a paused notification buzzes only when its resumed drop actually lands', () => {
  const h = setup({ deferredSnapshots: true });
  const opening = h.render();
  h.advance(h.duration.fill * 2 + 100);
  const pausedAt = opening.progress.read();
  const staleArrival = h.animationCallbacks[0];
  h.foreground(false);
  staleArrival({ finished: true });
  assert.equal(h.buzzes(), 0);
  h.foreground(true);
  h.flushSnapshots();
  assert.equal(opening.progress.read(), pausedAt);
  h.advance(h.duration.slow * 2);
  assert.equal(h.render().ready, true);
  assert.equal(h.buzzes(), 1);
  h.foreground(false);
  h.foreground(true);
  assert.equal(h.buzzes(), 1);
  h.unmount();
});

test('blur resumes an unfinished stage from its stopped native value without replaying settled stages', () => {
  const h = setup({ deferredSnapshots: true });
  const opening = h.render();
  h.advance(h.duration.fill * 2 + h.duration.slow + 100);
  assert.equal(h.render().phase, 'prompt');
  assert.equal(h.buzzes(), 1);
  const pausedAt = opening.progress.read();
  h.focus(false);
  h.advance(5000);
  h.focus(true);
  assert.equal(h.nativeWork.size, 0);
  h.focus(false);
  h.focus(true);
  h.flushSnapshots();
  assert.equal(h.nativeWork.size, 1);
  assert.equal(opening.progress.read(), pausedAt);
  assert.equal(h.render().phase, 'prompt');
  h.advance(h.duration.slow * 2);
  assert.equal(h.render().ready, true);
  assert.equal(opening.progress.read(), 2);
  assert.equal(h.buzzes(), 1);
  h.unmount();
});

test('reduced motion retains title reading and then reveals a still invitation', () => {
  const h = setup({ reducedMotion: true });
  h.render();
  h.advance(h.duration.fill * 2 - 1);
  assert.equal(h.render().phase, 'title');
  assert.equal(h.render().ready, false);
  assert.equal(h.buzzes(), 0);
  h.advance(1);
  assert.equal(h.render().ready, true);
  assert.equal(h.render().progress.read(), 2);
  assert.equal(h.buzzes(), 1);
  assert.equal(h.nativeWork.size, 0);
  assert.equal(h.timers.size, 0);
  h.unmount();
});

test('enabling reduced motion after the notification lands never repeats its buzz', () => {
  const h = setup();
  h.render();
  h.advance(h.duration.fill * 2 + h.duration.slow + 100);
  assert.equal(h.buzzes(), 1);
  h.setReducedMotion(true);
  assert.equal(h.render().ready, true);
  assert.equal(h.render().progress.read(), 2);
  assert.equal(h.buzzes(), 1);
  assert.equal(h.nativeWork.size, 0);
  assert.equal(h.timers.size, 0);
  h.unmount();
});

test('late animation callbacks and snapshots cannot finish an unmounted entrance', () => {
  const h = setup({ deferredSnapshots: true });
  h.render();
  h.advance(h.duration.fill * 2 + 100);
  const lateAnimation = h.animationCallbacks[0];
  h.unmount();
  const updates = h.stateUpdates();
  lateAnimation({ finished: true });
  h.flushSnapshots();
  h.advance(10000);
  assert.equal(h.stateUpdates(), updates);
  assert.equal(h.nativeWork.size, 0);
  assert.equal(h.timers.size, 0);
  assert.equal(h.listenerCount(), 0);
  assert.equal(h.buzzes(), 0);
});

test('duplicate animation completions do not replay a stage or enable the invitation early', () => {
  const h = setup();
  h.render();
  h.advance(h.duration.fill * 2 + h.duration.slow);
  const duplicate = h.animationCallbacks[0];
  duplicate({ finished: true });
  assert.equal(h.render().phase, 'prompt');
  assert.equal(h.nativeWork.size, 1);
  assert.equal(h.render().ready, false);
  assert.equal(h.buzzes(), 1);
  h.advance(h.duration.slow);
  assert.equal(h.render().ready, true);
  const updates = h.stateUpdates();
  h.animationCallbacks.at(-1)({ finished: true });
  assert.equal(h.stateUpdates(), updates);
  assert.equal(h.buzzes(), 1);
  h.unmount();
});

test('ten mounts replay fresh while teardown leaves no timers, native work, or listeners', () => {
  const h = setup();
  for (let cycle = 0; cycle < 10; cycle += 1) {
    const opening = cycle === 0 ? h.render() : h.remount();
    assert.equal(opening.phase, 'title');
    assert.equal(opening.progress.read(), 0);
    assert.equal(h.listenerCount(), 3);
    assert.equal(h.buzzes(), cycle);
    h.advance(h.duration.fill * 2 + h.duration.slow * 2);
    assert.equal(h.render().ready, true);
    assert.equal(h.buzzes(), cycle + 1);
    h.focus(false);
    h.focus(true);
    assert.equal(h.timers.size, 0);
    assert.equal(h.nativeWork.size, 0);
    assert.equal(h.buzzes(), cycle + 1);
    h.unmount();
    assert.equal(h.listenerCount(), 0);
    assert.equal(h.timers.size, 0);
    assert.equal(h.nativeWork.size, 0);
  }
});
