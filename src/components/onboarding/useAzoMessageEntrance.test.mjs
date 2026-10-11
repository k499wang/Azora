import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup({ reducedMotion = false, deferredSnapshots = false, started = true } = {}) {
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
  let armed = started;
  let stateUpdates = 0;
  let buzzes = 0;
  let lineBuzzes = 0;
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
    linear: (t) => t,
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
      const run = { config, callback: undefined, from: value.read(), started: now };
      return {
        start(callback) {
          animationCallbacks.push(callback);
          run.callback = callback;
          run.from = value.read();
          run.started = now;
          value.running = run;
          nativeWork.add(run);
          run.timer = setTimer(() => {
            value.value = config.toValue;
            value.running = null;
            nativeWork.delete(run);
            callback({ finished: true });
          }, config.duration, 'native');
        },
        stop() {
          if (!run.timer || value.running !== run) return;
          timers.delete(run.timer);
          nativeWork.delete(run);
          value.value = value.read();
          value.running = null;
          const callback = run.callback;
          run.callback = undefined;
          callback?.({ finished: false });
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
        if (name.endsWith('/tapHaptics')) {
          const buzz = () => { buzzes += 1; };
          const lineBuzz = () => { lineBuzzes += 1; };
          return { triggerNotificationHaptic: buzz, triggerMessageHaptic: lineBuzz };
        }
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

  // The entrance's own steps, in the order the hook plays them: each message
  // arrives on a stage, and is then held for the beat that follows it.
  const reading = duration.fill * 3;
  const handover = duration.slow;
  const headlineReading = duration.fill * 3;
  const drop = duration.slow;
  const cardReading = duration.fill;
  const headlineExit = duration.slow;
  const prompt = duration.slow;

  return {
    duration, timers, nativeWork, animationCallbacks,
    read: reading,
    headline: handover,
    headlineRead: headlineReading,
    notification: drop,
    cardRead: cardReading,
    headlineExit,
    prompt,
    total:
      reading + handover + headlineReading + drop + cardReading + headlineExit + prompt,
    render() {
      cursor = 0;
      const result = hook(armed);
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
    setStarted(value) { armed = value; this.render(); },
    flushSnapshots() { snapshots.splice(0).forEach((callback) => callback()); },
    unmount() { slots.forEach((slot) => slot?.cleanup?.()); },
    remount() { this.unmount(); slots.length = 0; return this.render(); },
    stateUpdates: () => stateUpdates,
    buzzes: () => buzzes,
    lineBuzzes: () => lineBuzzes,
    listenerCount: () => [...listeners.values()].reduce((total, set) => total + set.size, 0),
  };
}

test('the greeting hands over to the headline, then one buzz, the prompt, and an enabled invitation', () => {
  const h = setup();
  const opening = h.render();
  assert.equal(opening.phase, 'title');
  assert.equal(opening.ready, false);
  assert.equal(opening.progress.read(), 0);
  assert.equal(opening.arrival.read(), 0);
  assert.equal(h.nativeWork.size, 0);
  assert.equal(h.buzzes(), 0);
  // the greeting arriving is felt as a buzz, not only seen
  assert.equal(h.lineBuzzes(), 1);
  h.advance(h.read - 1);
  assert.equal(h.render().phase, 'title');
  assert.equal(h.lineBuzzes(), 1);
  h.advance(1);
  // the second line lands on its own buzz, with no notification buzz
  assert.equal(h.render().phase, 'headline');
  assert.equal(h.lineBuzzes(), 2);
  assert.equal(h.buzzes(), 0);
  h.advance(h.headline);
  // the headline is left alone to be read, and the copy stands still while it is
  assert.equal(h.render().phase, 'headline');
  assert.equal(opening.progress.read(), 1);
  h.advance(h.headlineRead);
  // the buzz belongs to the banner arriving, so it lands with the slide-in
  assert.equal(h.render().phase, 'notification');
  assert.equal(h.buzzes(), 1);
  assert.equal(h.lineBuzzes(), 2);
  assert.equal(opening.progress.read(), 2);
  h.advance(h.notification);
  // the card is left to be read, still, before the prompt takes over
  assert.equal(h.render().phase, 'notification');
  assert.equal(opening.progress.read(), 3);
  assert.equal(opening.arrival.read(), 0);
  h.advance(h.cardRead);
  // the headline leaves on a step of its own before the prompt follows it in
  assert.equal(h.render().phase, 'prompt');
  assert.equal(h.buzzes(), 1);
  assert.equal(opening.progress.read(), 4);
  h.advance(h.headlineExit);
  assert.equal(h.render().ready, false);
  assert.equal(opening.progress.read(), 5);
  h.advance(h.prompt);
  assert.equal(h.render().ready, true);
  assert.equal(opening.progress.read(), 6);
  assert.equal(opening.arrival.read(), 1);
  assert.equal(h.buzzes(), 1);
  assert.equal(h.lineBuzzes(), 2);
  assert.equal(h.timers.size, 0);
  assert.equal(h.nativeWork.size, 0);
  h.unmount();
  assert.equal(h.listenerCount(), 0);
});

test('backgrounding pauses the remaining title reading time and ignores a cancelled callback', () => {
  const h = setup();
  h.render();
  assert.equal(h.lineBuzzes(), 1);
  const cancelledReading = [...h.timers.values()][0].callback;
  h.advance(600);
  h.foreground(false);
  cancelledReading();
  h.advance(10000);
  assert.equal(h.render().phase, 'title');
  assert.equal(h.nativeWork.size, 0);
  assert.equal(h.timers.size, 0);
  assert.equal(h.buzzes(), 0);
  // coming back does not buzz the line that already arrived
  assert.equal(h.lineBuzzes(), 1);
  h.foreground(true);
  h.advance(h.read - 600 - 1);
  assert.equal(h.render().phase, 'title');
  h.advance(1);
  assert.equal(h.render().phase, 'headline');
  assert.equal(h.buzzes(), 0);
  assert.equal(h.lineBuzzes(), 2);
  h.unmount();
  assert.equal(h.nativeWork.size, 0);
  assert.equal(h.timers.size, 0);
  assert.equal(h.buzzes(), 0);
});

test('the entrance holds until the screen it plays over has painted', () => {
  const h = setup({ started: false });
  const opening = h.render();
  assert.equal(h.nativeWork.size, 0);
  assert.equal(h.timers.size, 0);
  h.advance(10000);
  assert.equal(h.render().phase, 'title');
  assert.equal(opening.progress.read(), 0);
  assert.equal(h.buzzes(), 0);
  assert.equal(h.lineBuzzes(), 0);
  h.setStarted(true);
  assert.equal(h.lineBuzzes(), 1);
  h.advance(h.read);
  assert.equal(h.render().phase, 'headline');
  assert.equal(h.buzzes(), 0);
  assert.equal(h.lineBuzzes(), 2);
  h.advance(h.headline + h.headlineRead + h.notification);
  assert.equal(h.render().phase, 'notification');
  assert.equal(h.buzzes(), 1);
  h.advance(h.cardRead + h.headlineExit + h.prompt);
  assert.equal(h.render().ready, true);
  assert.equal(h.buzzes(), 1);
  h.unmount();
  assert.equal(h.timers.size, 0);
  assert.equal(h.nativeWork.size, 0);
});

test('the buzz belongs to the arrival, so a paused drop never buzzes twice', () => {
  const h = setup({ deferredSnapshots: true });
  const opening = h.render();
  h.advance(h.read + h.headline + h.headlineRead + 100);
  assert.equal(h.buzzes(), 1);
  const pausedAt = opening.progress.read();
  const staleArrival = h.animationCallbacks[2];
  h.foreground(false);
  staleArrival({ finished: true });
  assert.equal(h.buzzes(), 1);
  h.foreground(true);
  h.flushSnapshots();
  assert.equal(opening.progress.read(), pausedAt);
  h.advance(h.notification + h.cardRead + h.headlineExit + h.prompt);
  assert.equal(h.render().ready, true);
  assert.equal(h.buzzes(), 1);
  h.foreground(false);
  h.foreground(true);
  assert.equal(h.buzzes(), 1);
  h.unmount();
});

test('a blur mid-jolt settles the card instead of freezing it part-way', () => {
  const h = setup({ deferredSnapshots: true });
  const opening = h.render();
  h.advance(h.read + h.headline + h.headlineRead + h.notification + 60);
  assert.equal(h.buzzes(), 1);
  assert.equal(opening.arrival.read() > 0, true);
  h.focus(false);
  assert.equal(opening.arrival.read(), 1);
  h.advance(5000);
  assert.equal(h.nativeWork.size, 0);
  h.flushSnapshots();
  h.focus(true);
  h.advance(h.cardRead + h.headlineExit + h.prompt);
  assert.equal(h.render().ready, true);
  assert.equal(opening.arrival.read(), 1);
  assert.equal(h.buzzes(), 1);
  assert.equal(h.nativeWork.size, 0);
  h.unmount();
});

test('blur resumes an unfinished stage from its stopped native value without replaying settled stages', () => {
  const h = setup({ deferredSnapshots: true });
  const opening = h.render();
  h.advance(h.read + h.headline + h.headlineRead + h.notification + h.cardRead + 100);
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
  h.advance(h.headlineExit + h.prompt);
  assert.equal(h.render().ready, true);
  assert.equal(opening.progress.read(), 6);
  assert.equal(h.buzzes(), 1);
  h.unmount();
});

test('reduced motion retains title reading and then reveals a still invitation', () => {
  const h = setup({ reducedMotion: true });
  const opening = h.render();
  h.advance(h.read - 1);
  assert.equal(h.render().phase, 'title');
  assert.equal(h.render().ready, false);
  assert.equal(h.buzzes(), 0);
  h.advance(1);
  assert.equal(h.render().ready, true);
  assert.equal(h.render().progress.read(), 6);
  assert.equal(opening.arrival.read(), 1);
  // nothing animates in, so nothing buzzes
  assert.equal(h.lineBuzzes(), 0);
  assert.equal(h.buzzes(), 1);
  assert.equal(h.nativeWork.size, 0);
  assert.equal(h.timers.size, 0);
  h.unmount();
});

test('enabling reduced motion after the notification lands never repeats its buzz', () => {
  const h = setup();
  h.render();
  h.advance(h.read + h.headline + h.headlineRead + h.notification + 100);
  assert.equal(h.buzzes(), 1);
  h.setReducedMotion(true);
  assert.equal(h.render().ready, true);
  assert.equal(h.render().progress.read(), 6);
  assert.equal(h.buzzes(), 1);
  assert.equal(h.nativeWork.size, 0);
  assert.equal(h.timers.size, 0);
  h.unmount();
});

test('late animation callbacks and snapshots cannot finish an unmounted entrance', () => {
  const h = setup({ deferredSnapshots: true });
  h.render();
  h.advance(h.read + 100);
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
  // the lines were still handing over, so the buzz was never reached
  assert.equal(h.buzzes(), 0);
});

test('duplicate animation completions do not replay a stage or enable the invitation early', () => {
  const h = setup();
  h.render();
  h.advance(h.read + h.headline + h.headlineRead + h.notification);
  const duplicate = h.animationCallbacks[2];
  duplicate({ finished: true });
  assert.equal(h.render().phase, 'notification');
  // the beat the card is read in and the card's landing jolt are the only work
  assert.equal(h.nativeWork.size, 2);
  assert.equal(h.render().ready, false);
  assert.equal(h.buzzes(), 1);
  h.advance(h.cardRead + h.headlineExit + h.prompt);
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
    // the greeting has buzzed on this mount, and no more than once
    assert.equal(h.lineBuzzes(), cycle * 2 + 1);
    h.advance(h.total);
    assert.equal(h.render().ready, true);
    assert.equal(h.buzzes(), cycle + 1);
    assert.equal(h.lineBuzzes(), (cycle + 1) * 2);
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
