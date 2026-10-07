import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup(file, reducedMotion = false) {
  const hooks = [];
  const effects = [];
  const timers = new Set();
  const values = [];
  const canceled = new Set();
  let cursor = 0;
  const react = {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useRef(initial) { const i = cursor++; return hooks[i] ??= { current: initial }; },
    useState(initial) { const i = cursor++; if (!(i in hooks)) hooks[i] = typeof initial === 'function' ? initial() : initial; return [hooks[i], next => { hooks[i] = next; }]; },
    useEffect(callback, deps) {
      const i = cursor++;
      if (hooks[i]?.deps?.every((v, index) => v === deps[index])) return;
      hooks[i]?.cleanup?.();
      hooks[i] = { deps };
      effects.push(() => { hooks[i].cleanup = callback(); });
    },
  };
  const animation = {
    default: { View: 'AnimatedView' },
    useReducedMotion: () => reducedMotion,
    useSharedValue(initial) { const i = cursor++; if (!(i in hooks)) { hooks[i] = { value: initial }; values.push(hooks[i]); } return hooks[i]; },
    useAnimatedStyle: () => ({}),
    cancelAnimation: value => canceled.add(value),
    withTiming: to => ({ to }), withDelay: (delay, value) => ({ delay, value }),
    withSequence: (...values) => ({ values }), withSpring: to => ({ to }),
    Easing: { out: x => x, cubic: () => {} },
  };
  function load(name) {
    const exports = {};
    vm.runInNewContext(ts.transpileModule(readFileSync(new URL(name, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText, {
      exports, React: react,
      require(name) {
        if (name === 'react') return react;
        if (name === 'react-native') return { View: 'View', StyleSheet: { create: x => x, absoluteFillObject: {} } };
        if (name === 'react-native-reanimated') return animation;
        if (name === 'react-native-svg') return { default: 'Svg', Path: 'Path' };
        if (name.endsWith('/streakCelebrationMotion')) return load('./streakCelebrationMotion.ts');
        if (name.endsWith('/routineFirstCompletion')) return load('./domain/routineFirstCompletion.ts');
        if (name.endsWith('/typography')) return { fonts: {} };
        if (name.endsWith('/uiThreadTimer')) return { startUiTimer(ms, callback) { const timer = { ms, callback }; timers.add(timer); return () => timers.delete(timer); } };
        if (name.endsWith('/tapHaptics')) return { triggerHeavyHaptic() {}, triggerLightHaptic() {} };
        return { default: name, Text: 'Text' };
      },
    });
    return exports;
  }
  const component = load(file).default;
  return {
    timers, values, canceled,
    render(props) { cursor = 0; const tree = component(props); effects.splice(0).forEach(effect => effect()); return tree; },
    unmount() { hooks.forEach(hook => hook?.cleanup?.()); },
  };
}

const stepProps = { streakDays: 4, completedDaysAgo: [0, 1], active: true, onIgnite() {}, onContinue() {} };

test('leaving the celebration cancels pending sound, haptics, CTA timer, and count/reveal animation', () => {
  const h = setup('./StreakExtendStep.tsx');
  h.render(stepProps);
  assert.equal(h.timers.size, 4);
  assert.ok(h.values.some(value => typeof value.value === 'object'));
  h.render({ ...stepProps, active: false });
  assert.equal(h.timers.size, 0);
  assert.equal(h.canceled.size, h.values.length);
});

test('ignition calls the current sound callback, and unmount cancels all remaining work', () => {
  const h = setup('./StreakExtendStep.tsx');
  let previous = 0; let current = 0;
  h.render({ ...stepProps, onIgnite: () => previous++ });
  h.render({ ...stepProps, onIgnite: () => current++ });
  [...h.timers].find(timer => timer.ms === 1100).callback();
  assert.equal(previous, 0); assert.equal(current, 1);
  h.unmount();
  assert.equal(h.timers.size, 0);
  assert.equal(h.canceled.size, h.values.length);
});

test('reduced motion settles the step without scheduled sound, haptics, or animation', () => {
  const h = setup('./StreakExtendStep.tsx', true);
  h.render(stepProps);
  assert.equal(h.timers.size, 0);
  assert.ok(h.values.every(value => typeof value.value === 'number'));
});

test('flame cancels ignition, vortex, ring, and squash when its owner becomes inactive', () => {
  const h = setup('./StreakFlameHero.tsx');
  const props = { igniteAt: 1100, idle: true, reducedMotion: false };
  h.render(props);
  assert.equal(h.values.length, 4);
  h.render({ ...props, idle: false });
  assert.equal(h.canceled.size, 4);
});

test('reduced motion flame has no pending animation', () => {
  const h = setup('./StreakFlameHero.tsx');
  h.render({ igniteAt: 1100, idle: true, reducedMotion: true });
  assert.ok(h.values.every(value => typeof value.value === 'number'));
});

test('eight repeated entrances keep one sound schedule and cancel all work on exit', () => {
  const h = setup('./StreakExtendStep.tsx');
  for (let cycle = 0; cycle < 8; cycle++) {
    h.render(stepProps);
    assert.equal([...h.timers].filter(timer => timer.ms === 1100).length, 1);
    assert.equal(h.timers.size, 4);
    h.render({ ...stepProps, active: false });
    assert.equal(h.timers.size, 0);
  }
  assert.equal(h.values.length, 7);
});
