import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup({ ready = true, reducedMotion = false } = {}) {
  const slots = [];
  const effects = [];
  const listeners = new Map();
  const nativeWork = new Set();
  let cursor = 0;
  let now = 0;
  let focused = true;
  let armed = ready;
  let reduced = reducedMotion;
  const stable = (create) => {
    const index = cursor++;
    if (!(index in slots)) slots[index] = create();
    return slots[index];
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
    useRef: (value) => stable(() => ({ current: value })),
    useState(initial) {
      const slot = stable(() => ({ value: typeof initial === 'function' ? initial() : initial }));
      return [slot.value, (next) => { slot.value = typeof next === 'function' ? next(slot.value) : next; }];
    },
    useCallback(callback, dependencies) {
      const slot = stable(() => ({}));
      if (!slot.dependencies || !dependencies.every((value, index) => Object.is(value, slot.dependencies[index]))) {
        slot.dependencies = dependencies;
        slot.callback = callback;
      }
      return slot.callback;
    },
    useEffect(callback, dependencies) {
      const slot = stable(() => ({}));
      if (slot.dependencies && dependencies.every((value, index) => Object.is(value, slot.dependencies[index]))) return;
      slot.cleanup?.();
      slot.dependencies = dependencies;
      effects.push(() => { slot.cleanup = callback(); });
    },
  };
  class SharedValue {
    constructor(value) { this.current = value; this.animation = null; }
    get value() {
      const run = this.animation;
      if (!run) return this.current;
      const fraction = Math.min(1, (now - run.started) / run.duration);
      const value = run.from + (run.target - run.from) * fraction;
      if (fraction === 1) {
        this.current = value;
        this.animation = null;
        nativeWork.delete(this);
        run.callback?.(true);
      }
      return value;
    }
    set value(next) {
      const from = this.value;
      nativeWork.delete(this);
      if (typeof next === 'object' && next.timing) {
        this.animation = { ...next, from, started: now };
        nativeWork.add(this);
      } else {
        this.animation = null;
        this.current = next;
      }
    }
  }
  const identity = (value) => value;
  const reanimated = {
    useSharedValue: (initial) => stable(() => new SharedValue(initial)),
    useReducedMotion: () => reduced,
    withTiming: (target, config, callback) => ({ timing: true, target, duration: config.duration, callback }),
    cancelAnimation(value) { value.value = value.value; },
    runOnJS: identity,
    Easing: { linear: identity, cubic: identity, quad: identity, sin: identity, out: identity, in: identity, inOut: identity, bezier: () => identity },
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
      require(name) {
        if (name === 'react') return react;
        if (name === 'react-native') return { AppState: appState };
        if (name === '@react-navigation/native') return { NavigationContext: {} };
        if (name === 'react-native-reanimated') return reanimated;
        if (name.startsWith('.')) return load(new URL(`${name}.ts`, url));
        throw new Error(`Unexpected import: ${name}`);
      },
    });
    return exports;
  };
  const { default: useCleaningPreviewAnimation, CLEANING_PREVIEW_TIMELINE } = load(new URL('./useCleaningPreviewAnimation.ts', import.meta.url));
  return {
    timeline: CLEANING_PREVIEW_TIMELINE,
    nativeWork,
    render() {
      cursor = 0;
      const result = useCleaningPreviewAnimation(armed);
      effects.splice(0).forEach((effect) => effect());
      return result;
    },
    advance(milliseconds) {
      now += milliseconds;
      for (const value of [...nativeWork]) void value.value;
    },
    foreground(active) {
      appState.currentState = active ? 'active' : 'background';
      listeners.get('app')?.forEach((callback) => callback());
    },
    focus(active) {
      focused = active;
      listeners.get(active ? 'focus' : 'blur')?.forEach((callback) => callback());
    },
    setReady(value) { armed = value; return this.render(); },
    setReducedMotion(value) { reduced = value; return this.render(); },
    unmount() { slots.forEach((slot) => slot?.cleanup?.()); },
    listenerCount: () => [...listeners.values()].reduce((count, set) => count + set.size, 0),
  };
}

test('the demo waits for photo decoding and layout before starting', () => {
  const h = setup({ ready: false });
  h.render();
  h.advance(30_000);
  assert.equal(h.nativeWork.size, 0);
  const scene = h.setReady(true);
  assert.equal(h.nativeWork.size, 1);
  h.advance(1000);
  assert.ok(scene.elapsed.value > 0);
  h.unmount();
});

test('the short demo identifies areas, turns pins into tasks, then reveals the tidy example', () => {
  const h = setup();
  const timeline = h.timeline;
  assert.equal(timeline.taskStarts.length, 3);
  assert.equal(timeline.pinStarts.length, timeline.taskStarts.length);
  assert.equal(timeline.scanEnd, timeline.pinStarts[0]);
  const beats = [timeline.scanStart, ...timeline.pinStarts, ...timeline.taskStarts, timeline.focusStart, timeline.wipeStart, timeline.wipeEnd];
  assert.ok(beats.every((beat, index) => index === 0 || beat > beats[index - 1]));
  assert.ok(timeline.taskStarts[2] + timeline.taskTravelDuration <= timeline.focusStart);
  assert.ok(timeline.total >= timeline.wipeEnd);
  assert.ok(timeline.total <= 6500, 'the onboarding example should finish in about six seconds');
});

test('a demo plays once, settles, and starts again only on Replay', () => {
  const h = setup();
  const scene = h.render();
  h.advance(h.timeline.total);
  assert.equal(scene.elapsed.value, h.timeline.total);
  assert.equal(h.nativeWork.size, 0);
  h.foreground(false);
  h.foreground(true);
  assert.equal(h.nativeWork.size, 0);
  scene.replay();
  h.render();
  assert.equal(h.nativeWork.size, 1);
  assert.equal(scene.elapsed.value, 0);
  h.unmount();
});

test('backgrounding, blur, and unmount cancel owned work without stacking animations', () => {
  const h = setup();
  const scene = h.render();
  h.advance(900);
  for (let cycle = 0; cycle < 10; cycle += 1) {
    h.foreground(false);
    const paused = scene.elapsed.value;
    assert.equal(h.nativeWork.size, 0);
    h.advance(1000);
    assert.equal(scene.elapsed.value, paused);
    h.foreground(true);
    assert.equal(h.nativeWork.size, 1);
    h.focus(false);
    assert.equal(h.nativeWork.size, 0);
    h.focus(true);
    assert.equal(h.nativeWork.size, 1);
  }
  h.unmount();
  assert.equal(h.nativeWork.size, 0);
  assert.equal(h.listenerCount(), 0);
});

test('reduced motion creates no scan, pin transfer, or wipe work, including on Replay', () => {
  const h = setup({ reducedMotion: true });
  const scene = h.render();
  assert.equal(scene.reducedMotion, true);
  assert.equal(h.nativeWork.size, 0);
  scene.replay();
  h.render();
  assert.equal(h.nativeWork.size, 0);
  h.unmount();
});

test('unfinished playback resumes from its paused frame with only the remaining duration', () => {
  const h = setup();
  const scene = h.render();
  h.advance(1000);
  h.foreground(false);
  assert.equal(scene.elapsed.value, 1000);
  h.advance(20_000);
  h.foreground(true);
  assert.equal(scene.elapsed.value, 1000);
  h.advance(h.timeline.total - 1000);
  assert.equal(scene.elapsed.value, h.timeline.total);
  assert.equal(h.nativeWork.size, 0);
  h.unmount();
});

test('photos finishing loading in the background do not start work until foreground', () => {
  const h = setup({ ready: false });
  h.foreground(false);
  h.render();
  h.setReady(true);
  assert.equal(h.nativeWork.size, 0);
  h.foreground(true);
  assert.equal(h.nativeWork.size, 1);
  h.unmount();
});

test('enabling reduced motion stops a running demo and repeated mounts leave no work', () => {
  const h = setup();
  h.render();
  h.advance(500);
  h.setReducedMotion(true);
  assert.equal(h.nativeWork.size, 0);
  h.unmount();
  for (let cycle = 0; cycle < 10; cycle += 1) {
    const mounted = setup();
    mounted.render();
    mounted.advance(500);
    mounted.unmount();
    assert.equal(mounted.nativeWork.size, 0);
    assert.equal(mounted.listenerCount(), 0);
  }
});
