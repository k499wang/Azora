import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { runWhileVisible } from '../../lib/ui/runWhileVisible.ts';

// Execute the actual local visuals, keeping private components private in production.
const source = ts.transpileModule(readFileSync(new URL('./PlanPath.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText + '\nexports.visuals = { Pulse, AnimatedCoinPulse, DrawingTrail, PathTrail };';

const visibilitySource = ts.transpileModule(readFileSync(new URL('../../hooks/useWhileVisible.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

function setup(componentName, props, options = {}) {
  const slots = [];
  const effects = [];
  const jsQueue = [];
  const sharedValues = [];
  let cursor = 0;
  let dirty = false;
  let view;
  let visible = true;
  let celebrationOptions;
  let component;
  let nextProps = props;
  const exports = {};
  const navigationContext = { Provider: 'NavigationProvider' };
  const slot = (initial) => {
    const index = cursor++;
    if (!(index in slots)) slots[index] = initial();
    return slots[index];
  };
  const depsEqual = (a, b) => a != null && b != null && a.length === b.length && a.every((x, i) => Object.is(x, b[i]));
  const effect = (callback, deps, visibility = false) => {
    const state = slot(() => ({}));
    if (depsEqual(state.deps, deps)) return;
    state.deps = deps;
    effects.push(() => {
      state.cleanup?.();
      state.callback = callback;
      state.visibility = visibility;
      state.cleanup = !visibility || visible ? callback(false) : undefined;
    });
  };
  const shared = (initial) => slot(() => {
    let value = initial;
    const state = {
      animation: null,
      get value() { return value; },
      set value(next) {
        if (typeof next === 'object' && next?.animation) state.animation = next;
        else value = next;
      },
    };
    sharedValues.push(state);
    return state;
  });
  const animation = (kind, value, config, callback) => ({ animation: true, kind, value, config, callback });
  vm.runInNewContext(source, {
    exports,
    require(name) {
      if (name === 'react') return {
        memo: (fn) => fn,
        useContext: () => options.navigation,
        useState(initial) {
          const state = slot(() => ({ value: typeof initial === 'function' ? initial() : initial }));
          return [state.value, (next) => {
            const value = typeof next === 'function' ? next(state.value) : next;
            if (!Object.is(value, state.value)) { state.value = value; dirty = true; }
          }];
        },
        useRef: (current) => slot(() => ({ current })),
        useMemo(callback, deps) {
          const state = slot(() => ({}));
          if (!depsEqual(state.deps, deps)) { state.deps = deps; state.value = callback(); }
          return state.value;
        },
        useCallback(callback, deps) {
          const state = slot(() => ({}));
          if (!depsEqual(state.deps, deps)) { state.deps = deps; state.value = callback; }
          return state.value;
        },
        useEffect: effect,
      };
      if (name === '@react-navigation/native') return { NavigationContext: navigationContext };
      if (name === 'react/jsx-runtime') return {
        jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }),
      };
      if (name === 'react-native') return {
        View: 'View', StyleSheet: { create: (styles) => styles }, useWindowDimensions: () => ({ height: 800 }),
      };
      if (name === 'react-native-reanimated') return {
        default: { View: 'AnimatedView' },
        useSharedValue: shared,
        useAnimatedRef: () => slot(() => ({})),
        useAnimatedStyle: (callback) => callback,
        useAnimatedReaction: () => {},
        useFrameCallback(callback) {
          const frame = slot(() => ({ active: false, setActive(active) { this.active = active; } }));
          frame.callback = callback;
          frame.tick = () => { if (frame.active) frame.callback(); };
          return frame;
        },
        measure: () => ({ pageY: 250 }),
        runOnJS: (callback) => (...args) => jsQueue.push(() => callback(...args)),
        withTiming: (value, config, callback) => animation('timing', value, config, callback),
        withSpring: (value, config, callback) => animation('spring', value, config, callback),
        withSequence: (...steps) => ({ animation: true, kind: 'sequence', steps }),
        cancelAnimation: (value) => { if (value.animation != null) value.animation.cancelled = true; },
      };
      if (name === '@shopify/react-native-skia') return {
        Canvas: 'Canvas', Path: 'Path', DashPathEffect: 'Dashes',
        Skia: { Path: { Make: () => ({ moveTo() {}, cubicTo() {} }) } },
      };
      if (name.endsWith('/useWhileVisible')) {
        if (!options.nativeVisibility) return { useWhileVisible: (callback, deps) => effect(callback, deps, true) };
        const visibilityExports = {};
        vm.runInNewContext(visibilitySource, {
          exports: visibilityExports,
          require(innerName) {
            if (innerName === 'react') return { useContext: () => options.navigation, useEffect: effect };
            if (innerName === '@react-navigation/native') return { NavigationContext: navigationContext };
            if (innerName === 'react-native') return { AppState: {
              currentState: 'active', addEventListener: () => ({ remove() {} }),
            } };
            if (innerName.endsWith('/runWhileVisible')) return { runWhileVisible };
            throw new Error(`Unexpected visibility import: ${innerName}`);
          },
        });
        return visibilityExports;
      }
      if (name.endsWith('/useCompletionSound')) return { useCompletionSound: () => noop };
      if (name.endsWith('/usePathCelebration')) return {
        PATH_WAKE_TRAIL_MS: 480,
        usePathCelebration(options) {
          celebrationOptions = options;
          return { show: null, onPhaseStarted: noop, onPhaseFinished: noop };
        },
      };
      if (name.endsWith('/pathCelebration')) return { isPlanWeekLocked: () => false };
      if (name.endsWith('/colors')) return { colors: {
        neutral: {}, playful: { sky: {} }, text: {}, border: {}, reward: {}, background: {},
      } };
      if (name.endsWith('/spacing')) return { spacing: {} };
      if (name.endsWith('/motion')) return { duration: { fast: 160, slow: 320 }, easing: {}, spring: { bounce: {} } };
      if (name.endsWith('/card')) return { radius: {} };
      if (name.endsWith('/typography')) return { fonts: {}, typography: { label: { medium: {} }, overline: {} } };
      return {};
    },
  });
  component = componentName === 'PlanPath' ? exports.default : exports.visuals[componentName];
  const render = () => {
    do {
      dirty = false;
      cursor = 0;
      view = component(nextProps);
      while (effects.length) effects.shift()();
    } while (dirty);
    return view;
  };
  render();
  return {
    render: (props = nextProps) => { nextProps = props; return render(); },
    view: () => view,
    sharedValues,
    visibilityOwners: () => slots.filter((state) => state?.visibility).length,
    celebrationActive: () => celebrationOptions.active,
    tick: () => slots.find((state) => state?.tick)?.tick(),
    flushJS() { while (jsQueue.length) jsQueue.shift()(); render(); },
    setVisible(next) {
      visible = next;
      for (const state of slots) {
        if (!state?.visibility) continue;
        if (next) state.cleanup = state.callback(true);
        else { state.cleanup?.(); state.cleanup = undefined; }
      }
      render();
    },
  };
}
const noop = () => {};

for (const [beat, phase] of [['rise', 'stampRise'], ['land', 'stampLand'], ['pop', 'wakePop']]) {
  test(`${phase} acknowledges UI start and waits for its final animation to finish`, () => {
    const show = { phase, stampDay: 1, wakeDay: 2 };
    const events = [];
    const harness = setup('AnimatedCoinPulse', {
      beat, show, children: null,
      onPhaseStarted: (value) => events.push(['start', value]),
      onPhaseFinished: (value) => events.push(['finish', value]),
    });
    const animation = harness.sharedValues[0].animation;
    assert.deepEqual(events, []);
    animation.steps[0].callback(true);
    assert.deepEqual(events, []);
    harness.flushJS();
    assert.deepEqual(events, [['start', show]]);
    const last = animation.steps.at(-1);
    assert.equal(last.kind, beat === 'rise' ? 'timing' : 'spring');
    assert.equal(last.value, beat === 'rise' ? 1.25 : 1);
    last.callback(false);
    harness.flushJS();
    assert.equal(events.length, 1);
    last.callback(true);
    harness.flushJS();
    assert.deepEqual(events, [['start', show], ['finish', show]]);
    harness.setVisible(false);
    assert.equal(animation.cancelled, true);
  });
}

test('stamp landing preserves the raised coin scale and cancels the old phase', () => {
  const props = { beat: 'rise', show: { phase: 'stampRise' }, children: null, onPhaseStarted: noop, onPhaseFinished: noop };
  const harness = setup('AnimatedCoinPulse', props);
  const scale = harness.sharedValues[0];
  const rise = scale.animation;
  scale.value = 1.25;
  harness.render({ ...props, beat: 'land', show: { phase: 'stampLand' } });
  assert.equal(rise.cancelled, true);
  assert.equal(scale.animation.steps[0].value, 1.25);
  assert.equal(scale.animation.steps[1].value, 1);
});

test('each drawing trail begins with fresh zero progress before any animation frame', () => {
  const events = [];
  const make = (wakeDay) => setup('DrawingTrail', {
    path: {}, show: { phase: 'wakeTrail', wakeDay },
    onPhaseStarted: (show) => events.push(['start', show.wakeDay]),
    onPhaseFinished: (show) => events.push(['finish', show.wakeDay]),
  });
  const first = make(2);
  const progress = first.view().props.end;
  assert.equal(progress.value, 0);
  progress.animation.steps[0].callback(true);
  progress.value = 1;
  progress.animation.steps[1].callback(true);
  first.flushJS();
  assert.deepEqual(events, [['start', 2], ['finish', 2]]);
  first.setVisible(false);
  assert.equal(progress.animation.cancelled, true);
  const second = make(3);
  assert.notEqual(second.view().props.end, progress);
  assert.equal(second.view().props.end.value, 0);
});

test('drawing stretches use separate keys when the next waking day changes', () => {
  const props = { points: [], walked: [], drawIndex: 1, show: { wakeDay: 2, phase: 'wakeTrail' }, onPhaseStarted: noop, onPhaseFinished: noop };
  const harness = setup('PathTrail', props);
  const drawing = () => harness.view().props.children.props.children[2].props.children;
  assert.equal(drawing().key, 1);
  harness.render({ ...props, drawIndex: 2, show: { wakeDay: 3, phase: 'wakeTrail' } });
  assert.equal(drawing().key, 2);
});

function revealHarness(fadeIn) {
  let opacity = 0;
  const shown = {
    animation: null,
    get value() { return opacity; },
    set value(next) {
      if (typeof next === 'object' && next?.animation) shown.animation = next;
      else opacity = next;
    },
  };
  const pin = {
    origin: { value: null }, scrollY: { value: 0 }, shown,
    inlineHeight: { value: 0 }, overlayReady: { value: false }, measuredWeekCount: 0,
    stickTop: 0,
  };
  const harness = setup('PlanPath', {
    calendar: { weeks: [] }, enrollment: { planId: 'test' }, pin, fadeIn,
    goldDays: new Set(), seen: null,
  });
  harness.tick();
  return { harness, pin };
}

for (const fadeIn of [true, false]) {
  test(`celebration waits for ${fadeIn ? 'the cover fade' : 'the first visible UI frame'} to finish`, () => {
    const { harness, pin } = revealHarness(fadeIn);
    assert.equal(harness.celebrationActive(), false);
    assert.equal(pin.shown.animation.config.duration, fadeIn ? 320 : 0);
    pin.shown.animation.callback(true);
    assert.equal(harness.celebrationActive(), false);
    harness.flushJS();
    assert.equal(harness.celebrationActive(), true);
  });
}

test('a queued reveal from before blur cannot unlock celebration on refocus', () => {
  const { harness, pin } = revealHarness(true);
  const beforeBlur = pin.shown.animation;
  beforeBlur.callback(true);
  harness.setVisible(false);
  assert.equal(beforeBlur.cancelled, true);
  harness.setVisible(true);
  harness.tick();
  harness.flushJS();
  assert.equal(harness.celebrationActive(), false);
  pin.shown.animation.callback(true);
  harness.flushJS();
  assert.equal(harness.celebrationActive(), true);
});


test('inactive coins create no animation values or visibility subscriptions', () => {
  for (const [beat, show] of [[null, null], ['rise', null], [null, { phase: 'stampRise' }]]) {
    const harness = setup('Pulse', {
      beat, show, children: 'coin', onPhaseStarted: noop, onPhaseFinished: noop,
    });
    assert.equal(harness.sharedValues.length, 0);
    assert.equal(harness.visibilityOwners(), 0);
    assert.equal(harness.view().type, 'View');
    assert.equal(harness.view().props.children, 'coin');
  }
});

test('rise and landing render the same animation owner so the raised scale survives', () => {
  const props = { beat: 'rise', show: { phase: 'stampRise' }, children: 'coin', onPhaseStarted: noop, onPhaseFinished: noop };
  const harness = setup('Pulse', props);
  const riseOwner = harness.view().type;
  assert.equal(riseOwner.name, 'AnimatedCoinPulse');
  harness.render({ ...props, beat: 'land', show: { phase: 'stampLand' } });
  assert.equal(harness.view().type, riseOwner);
  assert.equal(harness.view().key, undefined);
});


for (const componentName of ['AnimatedCoinPulse', 'DrawingTrail']) {
  test(`${componentName} never restarts a captured phase on refocus before a fresh phase commits`, () => {
    const props = {
      beat: 'rise', path: {}, children: null,
      show: { phase: componentName === 'DrawingTrail' ? 'wakeTrail' : 'stampRise', wakeDay: 2, stampDay: 1 },
      onPhaseStarted: noop, onPhaseFinished: noop,
    };
    const harness = setup(componentName, props);
    const progress = harness.sharedValues[0];
    const beforeBlur = progress.animation;
    harness.setVisible(false);
    assert.equal(beforeBlur.cancelled, true);
    harness.setVisible(true);
    assert.equal(progress.animation, beforeBlur);
    assert.equal(progress.animation.cancelled, true);
    harness.render({ ...props, show: { ...props.show } });
    assert.notEqual(progress.animation, beforeBlur);
    assert.notEqual(progress.animation.cancelled, true);
  });
}


test('the Skia drawing receives navigation from the outer path and stops on blur without rendering', () => {
  const listeners = new Map();
  let focused = true;
  const navigation = {
    isFocused: () => focused,
    addListener(event, callback) {
      listeners.set(event, callback);
      return () => listeners.delete(event);
    },
  };
  const props = {
    points: [], walked: [], drawIndex: 1,
    show: { phase: 'wakeTrail', wakeDay: 2 }, onPhaseStarted: noop, onPhaseFinished: noop,
  };
  const outer = setup('PathTrail', props, { navigation });
  const provider = outer.view().props.children.props.children[2];
  assert.equal(provider.type, 'NavigationProvider');
  assert.equal(provider.props.value, navigation);
  // Canvas' separate root starts without inherited contexts; mount its actual
  // drawing with the explicit provider value and the real visibility hook.
  const inner = setup('DrawingTrail', provider.props.children.props, {
    navigation: provider.props.value, nativeVisibility: true,
  });
  const animation = inner.sharedValues[0].animation;
  assert.ok(animation);
  assert.equal(listeners.size, 2);
  focused = false;
  listeners.get('blur')();
  assert.equal(animation.cancelled, true);
});
