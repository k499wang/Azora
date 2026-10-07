import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { easeInOutCubic, mix, phase, streakCelebrationMotion as timing } from './streakCelebrationMotion.ts';

const anything = new Proxy(function () {}, {
  get: (_, key) => (key === Symbol.toPrimitive ? () => 0 : anything),
  apply: () => anything,
});
const skia = new Proxy({}, {
  get(_, key) {
    if (key === 'createPicture') return draw => { draw(anything); return 'Picture'; };
    if (key === 'Skia' || typeof key !== 'string' || !/^[A-Z]/.test(key)) return anything;
    return key;
  },
});

function setup(file, reducedMotion = false) {
  const hooks = [];
  const effects = [];
  const timers = new Set();
  const values = [];
  const canceled = new Set();
  let haptics = 0;
  let cursor = 0;
  const react = {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useRef(initial) { const i = cursor++; return hooks[i] ??= { current: initial }; },
    useState(initial) { const i = cursor++; if (!(i in hooks)) hooks[i] = typeof initial === 'function' ? initial() : initial; return [hooks[i], next => { hooks[i] = next; }]; },
    useMemo(factory, deps) {
      const i = cursor++;
      if (!hooks[i]?.deps?.every((v, index) => v === deps[index])) hooks[i] = { deps, value: factory() };
      return hooks[i].value;
    },
    useEffect(callback, deps) {
      const i = cursor++;
      if (hooks[i]?.deps?.every((v, index) => v === deps[index])) return;
      hooks[i]?.cleanup?.();
      hooks[i] = { deps };
      effects.push(() => { hooks[i].cleanup = callback(); });
    },
  };
  const animation = {
    default: { View: 'AnimatedView', Text: 'AnimatedText' },
    useReducedMotion: () => reducedMotion,
    useSharedValue(initial) { const i = cursor++; if (!(i in hooks)) { hooks[i] = { value: initial }; values.push(hooks[i]); } return hooks[i]; },
    useAnimatedStyle: style => style(),
    useDerivedValue: derive => ({ value: derive() }),
    cancelAnimation: value => canceled.add(value),
    interpolateColor: () => 'color',
    withTiming: (to, config) => ({ to, config }), withDelay: (delay, value) => ({ delay, value }),
    withSequence: (...values) => ({ values }), withRepeat: value => ({ repeat: value }),
    Easing: { out: x => x, inOut: x => x, cubic: () => {}, sin: () => {}, linear: () => {} },
  };
  function load(name) {
    const exports = {};
    vm.runInNewContext(ts.transpileModule(readFileSync(new URL(name, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText, {
      exports, React: react,
      require(name) {
        if (name === 'react') return react;
        if (name === 'react-native') return { View: 'View', StyleSheet: { create: x => x } };
        if (name === 'react-native-reanimated') return animation;
        if (name === '@shopify/react-native-skia') return skia;
        if (name.endsWith('/streakCelebrationMotion')) return load('./streakCelebrationMotion.ts');
        if (name.endsWith('/streakFlameArt')) return load('./streakFlameArt.ts');
        if (name.endsWith('/routineFirstCompletion')) return load('./domain/routineFirstCompletion.ts');
        if (name.endsWith('/colors')) return load('../../theme/colors.ts');
        if (name.endsWith('/typography')) return { fonts: {} };
        if (name.endsWith('/uiThreadTimer')) return { startUiTimer(ms, callback) { const timer = { ms, callback }; timers.add(timer); return () => timers.delete(timer); } };
        if (name.endsWith('/tapHaptics')) return { triggerLightHaptic() { haptics++; } };
        return { default: name, Text: 'Text' };
      },
    });
    return exports;
  }
  const component = load(file).default;
  let tree;
  return {
    timers, values, canceled,
    get haptics() { return haptics; },
    timerAt: ms => [...timers].find(timer => timer.ms === ms),
    render(props) { cursor = 0; tree = component(props); effects.splice(0).forEach(effect => effect()); return tree; },
    find(predicate) {
      const visit = node => {
        if (!node || typeof node !== 'object') return undefined;
        if (predicate(node)) return node;
        for (const child of [node.children ?? []].flat(Infinity)) { const found = visit(child); if (found) return found; }
      };
      return visit(tree);
    },
    unmount() { hooks.forEach(hook => hook?.cleanup?.()); },
  };
}

const stepProps = { streakDays: 4, completedDaysAgo: [0, 1], active: true, onIgnite() {}, onContinue() {} };
const continueGate = h => h.find(node => node.props?.pointerEvents !== undefined).props.pointerEvents;

test('landing plays the sound and a haptic, the check gets a haptic, and Continue unlocks after its reveal', () => {
  const h = setup('./StreakExtendStep.tsx');
  let ignited = 0;
  h.render({ ...stepProps, onIgnite: () => ignited++ });
  assert.deepEqual([...h.timers].map(timer => timer.ms).sort((a, b) => a - b),
    [timing.landAt, timing.checkAt, timing.continueAt + timing.continueDuration]);
  h.timerAt(timing.landAt).callback();
  assert.equal(ignited, 1);
  assert.equal(h.haptics, 1);
  h.timerAt(timing.checkAt).callback();
  assert.equal(h.haptics, 2);
  assert.equal(continueGate(h), 'none');
  h.timerAt(timing.continueAt + timing.continueDuration).callback();
  h.render({ ...stepProps, onIgnite: () => ignited++ });
  assert.equal(continueGate(h), 'auto');
});

test('without a completion today there is no check haptic', () => {
  const h = setup('./StreakExtendStep.tsx');
  h.render({ ...stepProps, completedDaysAgo: [1, 2] });
  assert.equal(h.timerAt(timing.checkAt), undefined);
  assert.equal(h.timers.size, 2);
});

test('one linear clock runs to the end, and leaving cancels it with every pending timer', () => {
  const h = setup('./StreakExtendStep.tsx');
  h.render(stepProps);
  const clock = h.values.find(value => value.value?.to === timing.end);
  assert.ok(clock);
  assert.equal(clock.value.config.duration, timing.end);
  h.render({ ...stepProps, active: false });
  assert.equal(h.timers.size, 0);
  assert.ok(h.canceled.has(clock));
});

test('ignition calls the current sound callback, and unmount cancels all remaining work', () => {
  const h = setup('./StreakExtendStep.tsx');
  let previous = 0; let current = 0;
  h.render({ ...stepProps, onIgnite: () => previous++ });
  h.render({ ...stepProps, onIgnite: () => current++ });
  h.timerAt(timing.landAt).callback();
  assert.equal(previous, 0); assert.equal(current, 1);
  h.unmount();
  assert.equal(h.timers.size, 0);
  assert.equal(h.canceled.size, 1);
});

test('reduced motion settles at the end, ready at once, with one sound and one haptic', () => {
  const h = setup('./StreakExtendStep.tsx', true);
  let ignited = 0;
  h.render({ ...stepProps, onIgnite: () => ignited++ });
  assert.equal(h.timers.size, 0);
  assert.ok(h.values.some(value => value.value === timing.end));
  assert.ok(h.values.every(value => typeof value.value === 'number'));
  assert.equal(continueGate(h), 'auto');
  assert.equal(ignited, 1);
  assert.equal(h.haptics, 1);
});

test('eight repeated entrances keep one sound schedule and cancel all work on exit', () => {
  const h = setup('./StreakExtendStep.tsx');
  for (let cycle = 0; cycle < 8; cycle++) {
    h.render(stepProps);
    assert.equal([...h.timers].filter(timer => timer.ms === timing.landAt).length, 1);
    assert.equal(h.timers.size, 3);
    h.render({ ...stepProps, active: false });
    assert.equal(h.timers.size, 0);
  }
  assert.equal(h.values.length, 2);
});

test('flame sway waits for the settle and is cancelled when its owner becomes inactive', () => {
  const h = setup('./StreakFlameHero.tsx');
  const props = { clock: { value: 0 }, active: true, reducedMotion: false };
  h.render(props);
  const [sway] = h.values;
  assert.equal(sway.value.delay, timing.settleAt + timing.settleDuration);
  h.render({ ...props, active: false });
  assert.ok(h.canceled.has(sway));
});

test('flame draws every phase of the timeline, and reduced motion has no sway', () => {
  for (const t of [0, timing.igniteAt, timing.leapAt + 60, timing.leapAt + timing.leapDuration / 2, timing.landAt + 100, timing.stretchAt + 300, timing.settleAt + 100, timing.end]) {
    setup('./StreakFlameHero.tsx').render({ clock: { value: t }, active: true, reducedMotion: false });
  }
  const h = setup('./StreakFlameHero.tsx');
  h.render({ clock: { value: timing.end }, active: true, reducedMotion: true });
  assert.ok(h.values.every(value => value.value === 0));
});

test('week row merges filled days into runs and extends the last run into today', () => {
  const slots = [false, true, true, false, true, true, true].map((filled, index) => ({ label: 'Mo', name: 'Mon', filled, isToday: index === 6 }));
  for (const t of [0, timing.coinAt + 100, timing.extendAt + 40, timing.checkAt + 100, timing.perfectAt + 200, timing.end]) {
    const h = setup('./StreakWeekRow.tsx');
    h.render({ clock: { value: t }, slots });
    h.find(node => node.props?.onLayout).props.onLayout({ nativeEvent: { layout: { width: 350 } } });
    h.render({ clock: { value: t }, slots });
    const pills = [];
    h.find(node => { if (node.type === 'RoundedRect') pills.push(node.props); return false; });
    assert.equal(pills.length, 2);
    assert.equal(pills[0].width, 50 + 30);
    assert.equal(pills[1].x, 4 * 50 + 25 + 28 - 15);
    const extend = easeInOutCubic(phase(t, timing.extendAt, timing.extendDuration));
    assert.equal(pills[1].width.value, mix(5 * 50 + 25 + 28 + 15, 6 * 50 + 25 + 28 + 15, extend) - (4 * 50 + 25 + 28 - 15));
  }
});

test('week row adds the outline only for a perfect week, and a11y lists each day', () => {
  const slots = Array.from({ length: 7 }, (_, index) => ({ label: 'Mo', name: 'Mon', filled: true, isToday: index === 6 }));
  const h = setup('./StreakWeekRow.tsx');
  h.render({ clock: { value: timing.perfectAt + 200 }, slots });
  h.find(node => node.props?.onLayout).props.onLayout({ nativeEvent: { layout: { width: 350 } } });
  const tree = h.render({ clock: { value: timing.perfectAt + 200 }, slots });
  assert.ok(h.find(node => node.props?.start?.value !== undefined));
  assert.match(tree.props.accessibilityLabel, /^This week: Mon done, .*Mon today done$/);
});

test('every timeline curve starts at 0 and lands on 1, and phases clamp', async () => {
  const motion = await import('./streakCelebrationMotion.ts');
  for (const ease of [motion.easeInQuad, motion.easeOutCubic, motion.easeInOutCubic, x => motion.easeOutBack(x, 2)]) {
    assert.ok(Math.abs(ease(0)) < 1e-9);
    assert.ok(Math.abs(ease(1) - 1) < 1e-9);
  }
  assert.equal(phase(timing.landAt - 1, timing.landAt, timing.puddleDuration), 0);
  assert.equal(phase(timing.end, timing.landAt, timing.puddleDuration), 1);
});
