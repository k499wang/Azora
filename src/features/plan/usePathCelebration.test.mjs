import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { planCalendar } from './domain/planCalendar.ts';
import * as celebration from './domain/pathCelebration.ts';

const compiled = ts.transpileModule(
  readFileSync(new URL('./usePathCelebration.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
const flush = () => new Promise((resolve) => setImmediate(resolve));

function mount({ done = 3, finishedToday = true, seen = { stampedDay: 2, wokenDay: 3 },
  reveal = async () => true, reducedMotion = false, loading = false, goldDays = new Set() } = {}) {
  const slots = [];
  const timers = [];
  const owners = new Set();
  const sounds = [];
  const saves = [];
  const reveals = [];
  let now = 0;
  let cursor = 0;
  let effects = [];
  let visible = true;
  let active = true;
  const players = Object.fromEntries(['pathStamp', 'pathGold', 'pathUnlock'].map((kind) => [kind, {
    play() { sounds.push(kind); return !loading; },
    isLoading: () => loading,
  }]));
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], (value) => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useMemo(factory, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || !deps.every((dep, i) => Object.is(dep, previous.deps[i]))) {
        slots[index] = { deps, value: factory() };
      }
      return slots[index].value;
    },
    useCallback(callback, deps) { return react.useMemo(() => callback, deps); },
    useEffect(effect, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (previous && deps.every((dep, i) => Object.is(dep, previous.deps[i]))) return;
      slots[index] = { deps };
      effects.push(() => {
        previous?.cleanup?.();
        slots[index].cleanup = effect();
      });
    },
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, AbortController,
    Date: class extends Date { static now() { return now; } },
    require(name) {
      if (name === 'react') return react;
      if (name === 'react-native-reanimated') return { useReducedMotion: () => reducedMotion };
      if (name.endsWith('/useCompletionSound')) return { useTimedCompletionSound: (kind) => players[kind] };
      if (name.endsWith('/tapHaptics')) return { triggerLightHaptic() {}, triggerSuccessHaptic() {} };
      if (name.endsWith('/motion')) return { duration: { base: 260, slow: 420, slower: 640 } };
      if (name.endsWith('/pathCelebration')) return celebration;
      if (name.endsWith('/planPathSeenPreference')) return {
        savePlanPathSeen(enrollmentId, value) { saves.push({ enrollmentId, value }); seen = value; },
      };
      if (name.endsWith('/uiThreadTimer')) return {
        startUiTimer(ms, callback) {
          const timer = { due: now + ms, callback, cancelled: false };
          timers.push(timer);
          return () => { timer.cancelled = true; };
        },
      };
      if (name.endsWith('/useWhileVisible')) return {
        useWhileVisible(start, deps) {
          react.useEffect(() => {
            const owner = { start, cleanup: visible ? start() : () => {} };
            owners.add(owner);
            return () => { owner.cleanup(); owners.delete(owner); };
          }, deps);
        },
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  const render = () => {
    cursor = 0;
    effects = [];
    const result = exports.usePathCelebration({
      active, enrollmentId: 'enrollment', calendar: planCalendar('night', done, finishedToday),
      seen, goldDays, isPro: true,
      reveal: async (day, signal) => { reveals.push(day); return reveal(day, signal); },
    });
    effects.forEach((run) => run());
    return result;
  };
  return {
    sounds, saves, reveals, render,
    async advance(ms) {
      const end = now + ms;
      await flush();
      for (;;) {
        const timer = timers.filter((value) => !value.cancelled && value.due <= end)
          .sort((a, b) => a.due - b.due)[0];
        if (timer == null) break;
        now = timer.due;
        timer.cancelled = true;
        timer.callback();
        await flush();
      }
      now = end;
      await flush();
    },
    async finishPhase() {
      const result = render();
      assert.ok(result.show?.phase, 'A rendered animation must be waiting');
      result.onPhaseStarted(result.show);
      result.onPhaseFinished(result.show);
      await flush();
      return result.show;
    },
    setActive(value) { active = value; },
    setVisible(value) {
      visible = value;
      for (const owner of owners) {
        owner.cleanup();
        owner.cleanup = visible ? owner.start() : () => {};
      }
    },
    setLoading(value) { loading = value; },
    setProgress(value) { done = value; },
    pendingTimers: () => timers.filter((timer) => !timer.cancelled).length,
    unmount() { slots.forEach((slot) => slot?.cleanup?.()); },
  };
}

test('a delayed render cannot consume the rise or play sound before the landing starts', async () => {
  const hook = mount();
  hook.render();
  await hook.advance(260);
  assert.equal(hook.render().show.phase, 'stampRise');
  await hook.advance(2000);
  assert.equal(hook.render().show.phase, 'stampRise');
  assert.deepEqual(hook.sounds, []);
  assert.deepEqual(hook.saves, []);
  await hook.finishPhase();
  const landing = hook.render();
  assert.equal(landing.show.phase, 'stampLand');
  await hook.advance(2000);
  assert.deepEqual(hook.sounds, []);
  landing.onPhaseStarted(landing.show);
  landing.onPhaseStarted(landing.show);
  assert.deepEqual(hook.sounds, ['pathStamp']);
  assert.deepEqual(hook.saves, []);
  landing.onPhaseFinished(landing.show);
  await flush();
  assert.equal(hook.render().show, null);
  assert.deepEqual(hook.saves.at(-1).value, { stampedDay: 3, wokenDay: 3 });
  hook.unmount();
});

test('stamp and wake each reveal their own coin, including across a week divider', async () => {
  const hook = mount({ done: 7, finishedToday: false, seen: { stampedDay: 6, wokenDay: 7 } });
  hook.render();
  await hook.advance(260);
  assert.deepEqual(hook.reveals, [7]);
  await hook.finishPhase();
  await hook.finishPhase();
  assert.deepEqual(hook.reveals, [7, 8]);
  assert.equal(hook.render().show.phase, 'stampLand');
  await hook.advance(260);
  assert.equal(hook.render().show.phase, 'wakePop');
  await hook.finishPhase();
  assert.deepEqual(hook.sounds, ['pathStamp', 'pathUnlock']);
  assert.deepEqual(hook.saves.at(-1).value, { stampedDay: 7, wokenDay: 8 });
  hook.unmount();
});

test('the trail must finish before the next coin pops, with no second reveal between them', async () => {
  const hook = mount({ finishedToday: false });
  hook.render();
  await hook.advance(260);
  await hook.finishPhase();
  await hook.finishPhase();
  await hook.advance(260);
  assert.equal(hook.render().show.phase, 'wakeTrail');
  await hook.advance(2000);
  assert.equal(hook.render().show.phase, 'wakeTrail');
  await hook.finishPhase();
  assert.equal(hook.render().show.phase, 'wakePop');
  await hook.finishPhase();
  assert.deepEqual(hook.reveals, [3, 4]);
  hook.unmount();
});

test('a failed or disappearing measurement retries without consuming the celebration', async () => {
  let attempts = 0;
  const hook = mount({ reveal: async () => {
    attempts += 1;
    if (attempts === 1) throw new Error('view disappeared');
    return attempts >= 3;
  } });
  hook.render();
  await hook.advance(1100);
  assert.deepEqual(hook.reveals, [3, 3, 3]);
  assert.equal(hook.render().show.phase, 'stampRise');
  assert.deepEqual(hook.saves, []);
  hook.unmount();
});

test('permanent reveal failure draws normally after bounded retries and can retry next visit', async () => {
  let showable = false;
  const hook = mount({ reveal: async () => showable });
  hook.render();
  assert.equal(hook.render().playing, true);
  await hook.advance(5000);
  assert.equal(hook.reveals.length, 3);
  assert.equal(hook.render().show, null);
  assert.equal(hook.render().playing, false);
  assert.deepEqual(hook.saves, []);
  assert.equal(hook.pendingTimers(), 0);
  showable = true;
  hook.setVisible(false);
  hook.setVisible(true);
  await hook.advance(260);
  assert.equal(hook.render().show.phase, 'stampRise');
  hook.unmount();
});

test('a failed wake reveal keeps the completed stamp recorded and the wake for later', async () => {
  const hook = mount({ finishedToday: false, reveal: async (day) => day === 3 });
  hook.render();
  await hook.advance(260);
  await hook.finishPhase();
  await hook.finishPhase();
  await hook.advance(5000);
  assert.equal(hook.render().show, null);
  assert.deepEqual(hook.saves.at(-1).value, { stampedDay: 3, wokenDay: 3 });
  assert.deepEqual(hook.sounds, ['pathStamp']);
  hook.unmount();
});

test('leaving while rendering is frozen rejects late animation callbacks without rerendering', async () => {
  const hook = mount();
  hook.render();
  await hook.advance(260);
  await hook.finishPhase();
  const landing = hook.render();
  hook.setVisible(false);
  landing.onPhaseStarted(landing.show);
  landing.onPhaseFinished(landing.show);
  await hook.advance(5000);
  assert.deepEqual(hook.sounds, []);
  assert.deepEqual(hook.saves, []);
  assert.equal(hook.pendingTimers(), 0);
  hook.unmount();
});

test('inactive owners and unmount cancel reveal retries', async () => {
  const hook = mount({ reveal: async () => false });
  hook.render();
  await hook.advance(100);
  hook.setActive(false);
  hook.render();
  await hook.advance(5000);
  assert.equal(hook.reveals.length, 1);
  assert.equal(hook.pendingTimers(), 0);
  hook.setActive(true);
  hook.render();
  await hook.advance(100);
  hook.unmount();
  await hook.advance(5000);
  assert.equal(hook.reveals.length, 2);
  assert.equal(hook.pendingTimers(), 0);
});

test('gold uses its own landing sound and ten focus cycles do not replay completed work', async () => {
  const hook = mount({ goldDays: new Set([3]) });
  hook.render();
  await hook.advance(260);
  const rise = await hook.finishPhase();
  const landing = hook.render();
  // An old phase cannot acknowledge the new one.
  landing.onPhaseStarted(rise);
  landing.onPhaseFinished(rise);
  assert.deepEqual(hook.sounds, []);
  await hook.finishPhase();
  for (let cycle = 0; cycle < 10; cycle++) {
    hook.render();
    hook.setVisible(false);
    hook.setVisible(true);
    await hook.advance(1000);
    assert.equal(hook.render().show, null);
    assert.equal(hook.pendingTimers(), 0);
  }
  assert.deepEqual(hook.sounds, ['pathGold']);
  hook.unmount();
});

test('first views and reduced motion seed quietly without revealing or playing', async () => {
  for (const options of [{ seen: null }, { reducedMotion: true }]) {
    const hook = mount(options);
    hook.render();
    await hook.advance(5000);
    assert.equal(hook.render().show, null);
    assert.deepEqual(hook.reveals, []);
    assert.deepEqual(hook.sounds, []);
    hook.unmount();
  }
});

test('slow audio preparation has a real deadline and never advances a visual phase', async () => {
  const hook = mount({ loading: true });
  hook.render();
  await hook.advance(999);
  assert.equal(hook.render().show.phase, null);
  await hook.advance(1);
  assert.equal(hook.render().show.phase, 'stampRise');
  assert.equal(hook.pendingTimers(), 1, 'only the hold limit is left running');
  assert.deepEqual(hook.sounds, []);
  await hook.advance(3000);
  assert.equal(hook.render().show.phase, 'stampRise');
  hook.unmount();
});

test('ten full completion cycles leave no phase timers or repeated cues behind', async () => {
  const hook = mount();
  for (let cycle = 0; cycle < 10; cycle++) {
    hook.setProgress(3 + cycle);
    hook.render();
    await hook.advance(260);
    assert.equal(hook.render().show.phase, 'stampRise');
    await hook.finishPhase();
    await hook.finishPhase();
    assert.equal(hook.render().show, null);
    assert.equal(hook.pendingTimers(), 0);
    hook.setVisible(false);
    hook.render();
    hook.setVisible(true);
    await hook.advance(5000);
    assert.equal(hook.render().show, null);
  }
  assert.equal(hook.sounds.length, 10);
  hook.unmount();
});

test('the screen is held from the moment a celebration commits until its last part finishes', async () => {
  const hook = mount({ finishedToday: false });
  hook.render();
  assert.equal(hook.render().playing, true);
  await hook.advance(260);
  await hook.finishPhase();
  await hook.finishPhase();
  await hook.advance(260);
  await hook.finishPhase();
  assert.equal(hook.render().playing, true);
  await hook.finishPhase();
  assert.equal(hook.render().playing, false);
  assert.equal(hook.pendingTimers(), 0);
  hook.unmount();
});

test('nothing pending, a first view and reduced motion never hold the screen', async () => {
  for (const options of [{ seen: { stampedDay: 3, wokenDay: 3 } }, { seen: null }, { reducedMotion: true }]) {
    const hook = mount(options);
    hook.render();
    assert.equal(hook.render().playing, false);
    await hook.advance(5000);
    assert.equal(hook.render().playing, false);
    hook.unmount();
  }
});

test('a celebration still running at the hold limit lets go, ends where it would have and is saved', async () => {
  const hook = mount({ finishedToday: false });
  hook.render();
  await hook.advance(260);
  await hook.finishPhase();
  await hook.advance(celebration.CELEBRATION_HOLD_MAX_MS - 261);
  assert.equal(hook.render().playing, true);
  assert.equal(hook.render().show.phase, 'stampLand');
  await hook.advance(1);
  const ended = hook.render();
  assert.equal(ended.playing, false);
  assert.equal(ended.show, null);
  assert.deepEqual(hook.saves.at(-1).value, { stampedDay: 3, wokenDay: 4 });
  assert.equal(hook.pendingTimers(), 0);
  hook.setVisible(false);
  hook.setVisible(true);
  await hook.advance(5000);
  assert.equal(hook.render().playing, false);
  assert.deepEqual(hook.reveals, [3]);
  hook.unmount();
});

test('leaving, going inactive or unmounting lets go at once, and the unsaved parts replay next visit', async () => {
  const hook = mount();
  hook.render();
  await hook.advance(260);
  await hook.finishPhase();
  assert.equal(hook.render().playing, true);
  hook.setVisible(false);
  assert.equal(hook.render().playing, false);
  assert.equal(hook.pendingTimers(), 0);
  assert.deepEqual(hook.saves, []);
  hook.setVisible(true);
  assert.equal(hook.render().playing, true);
  await hook.advance(260);
  assert.equal(hook.render().show.phase, 'stampRise');
  hook.setActive(false);
  hook.render();
  assert.equal(hook.render().playing, false);
  hook.setActive(true);
  hook.render();
  assert.equal(hook.render().playing, true);
  hook.unmount();
  assert.equal(hook.render().playing, false);
  await hook.advance(5000);
  assert.equal(hook.pendingTimers(), 0);
  assert.deepEqual(hook.saves, []);
});
