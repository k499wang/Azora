import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { planCalendar } from './domain/planCalendar.ts';
import * as pathRules from './domain/planPath.ts';

// Execute the actual local visuals, keeping private components private in production.
const source = ts.transpileModule(readFileSync(new URL('./PlanPath.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText + '\nexports.visuals = { DayNode, WeekSection, PathTrail, Hop };';

function setup(componentName, props, options = {}) {
  const slots = [];
  const effects = [];
  const jsQueue = [];
  const sharedValues = [];
  let cursor = 0;
  let dirty = false;
  let view;
  let visible = true;
  let component;
  let nextProps = props;
  const exports = {};
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
      if (name === 'react/jsx-runtime') return {
        jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }),
      };
      if (name === 'react-native') return {
        View: 'View', StyleSheet: { create: (styles) => styles }, useWindowDimensions: () => ({ height: 800 }),
      };
      if (name === 'react-native-reanimated') return {
        default: { View: 'AnimatedView' },
        useSharedValue: shared,
        useReducedMotion: () => options.reducedMotion ?? false,
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
        withDelay: (milliseconds, step) => ({ animation: true, kind: 'delay', milliseconds, step }),
        withRepeat: (step, count) => ({ animation: true, kind: 'repeat', step, count }),
        withSequence: (...steps) => ({ animation: true, kind: 'sequence', steps }),
        cancelAnimation: (value) => { if (value.animation != null) value.animation.cancelled = true; },
      };
      if (name === '@shopify/react-native-skia') return {
        Canvas: 'Canvas', Path: 'Path', DashPathEffect: 'Dashes',
        Skia: { Path: { Make: () => ({ segments: [], moveTo(x, y) { this.segments.push([x, y]); }, cubicTo(...coordinates) { this.segments.push(coordinates); } }) } },
      };
      if (name.endsWith('/useWhileVisible')) return {
        useWhileVisible: (callback, deps) => effect(callback, deps, true),
      };
      if (name.endsWith('/useCompletionSound')) return { useCompletionSound: () => noop };
      if (name.endsWith('/planPath')) return pathRules;
      if (name.endsWith('/programCatalogue')) return { programPresetRevision: () => ({}) };
      if (name.endsWith('/pathCoinIcon')) return { dayCoinIcon: () => 'reset' };
      if (name.endsWith('/PlanWeekBanner')) return { weekHue: () => ({ base: 'blue', ink: 'blue-rim', tint: 'blue-ring' }) };
      if (name.endsWith('/LipToken')) return { default: 'LipToken', CoinIcon: 'CoinIcon' };
      if (name.endsWith('/colors')) return { colors: {
        neutral: { 200: 'grey' }, playful: { sky: {} }, text: {}, border: {}, reward: { gold: 'gold' }, background: {},
      } };
      if (name.endsWith('/spacing')) return { spacing: { '6xl': 64, sm: 8, '3xl': 32 } };
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
    unmount() { for (const state of slots) state?.cleanup?.(); },
    visibilityOwners: () => slots.filter((state) => state?.visibility).length,
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
    goldDays: new Set(),
  });
  harness.tick();
  return { harness, pin };
}

for (const fadeIn of [true, false]) {
  test(`path entrance uses ${fadeIn ? 'the cover fade' : 'an immediate reveal'} after layout`, () => {
    const { harness, pin } = revealHarness(fadeIn);
    assert.equal(pin.shown.animation.config.duration, fadeIn ? 320 : 0);
    assert.equal(pin.shown.animation.value, 1);
    assert.equal(harness.view().props.pointerEvents, 'auto', 'coins are interactive without a completion sequence');
    const animation = pin.shown.animation;
    harness.setVisible(false);
    assert.equal(animation.cancelled, true);
    harness.unmount();
    assert.equal(pin.shown.value, 0);
  });
}

test('a queued entrance callback from before blur cannot cancel a fresh entrance', () => {
  const { harness, pin } = revealHarness(true);
  const beforeBlur = pin.shown.animation;
  beforeBlur.callback(true);
  harness.setVisible(false);
  assert.equal(beforeBlur.cancelled, true);
  harness.setVisible(true);
  harness.tick();
  const resumed = pin.shown.animation;
  assert.notEqual(resumed, beforeBlur);
  harness.flushJS();
  assert.notEqual(resumed.cancelled, true);
  resumed.callback(true);
  harness.flushJS();
  harness.setVisible(false);
  harness.setVisible(true);
  harness.tick();
  assert.equal(pin.shown.animation, resumed, 'a finished entrance does not play again');
});

test('completed, gold and newly available coins draw their canonical state immediately', () => {
  const week = {
    week: 1, state: 'current',
    days: [
      { day: 1, state: 'done' },
      { day: 2, state: 'doneToday' },
      { day: 3, state: 'today' },
      { day: 4, state: 'ahead' },
    ],
  };
  const section = setup('WeekSection', {
    week, index: 0, enrollment: { planId: 'test' }, goldDays: new Set([2]),
    isLocked: false, onPlace: noop, onTrailPlaced: noop, onOpenNode: noop,
    onLockedPress: noop,
  });
  const nodes = section.view().props.children[1].props.children[1];
  assert.deepEqual(nodes.map((node) => node.props.tone.face), ['blue', 'gold', 'blue', 'grey']);
  assert.equal(section.sharedValues.length, 0);
  assert.equal(section.visibilityOwners(), 0);
  for (const [index, icon] of ['coin-check', 'coin-check', 'reset', 'reset'].entries()) {
    const coin = setup('DayNode', nodes[index].props);
    assert.equal(coin.sharedValues.length, 0);
    assert.equal(coin.visibilityOwners(), 0);
    const hop = coin.view().props.children[1];
    assert.equal(hop.type.name, 'Hop', 'only the existing idle hop wraps the coin');
    assert.equal(hop.props.active, index === 2);
    assert.equal(hop.props.children.type, 'LipToken');
    assert.equal(hop.props.children.props.children.props.name, icon);
  }
  const today = setup('DayNode', nodes[2].props);
  assert.equal(today.view().props.children[0].type.name, 'TodayRing');
});

test('the plan road is static and fully drawn with no animation owner', () => {
  const harness = setup('PathTrail', {
    points: [{ x: 0, y: 0 }, { x: 10, y: 50 }, { x: 0, y: 100 }],
    walked: [true, true, false],
  });
  assert.equal(harness.sharedValues.length, 0);
  assert.equal(harness.visibilityOwners(), 0);
  const paths = harness.view().props.children.props.children;
  assert.equal(paths.length, 2);
  assert.equal(paths[0].props.path.segments.length, 2);
  assert.equal(paths[1].props.path.segments.length, 2);
  assert.deepEqual(paths[0].props.path.segments, [[10, 50], [10, 75, 0, 75, 0, 100]]);
  assert.deepEqual(paths[1].props.path.segments, [[0, 0], [0, 25, 10, 25, 10, 50]]);
  assert.ok(paths.every((path) => path.props.end === undefined));
});

test('completion keeps today selected and the next day locked until the calendar rolls over', () => {
  const props = {
    index: 0, enrollment: { planId: 'night' }, goldDays: new Set([5]),
    isLocked: false, onPlace: noop, onTrailPlaced: noop, onOpenNode: noop,
    onLockedPress: noop, todayRef: noop,
  };
  const section = setup('WeekSection', { ...props, week: planCalendar('night', 4, false).weeks[0] });
  const path = () => section.view().props.children[1].props.children;
  const nodes = () => path()[1];
  const day = (index) => setup('DayNode', nodes()[index].props).view();

  assert.equal(day(4).props.ref, props.todayRef);
  assert.equal(day(4).props.children[1].props.active, true);

  section.render({ ...props, week: planCalendar('night', 5, true).weeks[0] });
  assert.equal(nodes()[4].props.tone.face, 'gold');
  assert.equal(day(4).props.ref, props.todayRef);
  assert.equal(day(4).props.children[1].props.active, false);
  assert.equal(day(4).props.children[1].props.children.props.children.props.name, 'coin-check');
  assert.equal(nodes()[5].props.tone.face, 'grey');
  assert.equal(day(5).props.ref, undefined);
  assert.equal(day(5).props.children[1].props.active, false);
  assert.equal(path()[0].props.walked[5], false);

  section.render({ ...props, week: planCalendar('night', 5, false).weeks[0] });
  assert.equal(nodes()[5].props.tone.face, 'blue');
  assert.equal(day(4).props.ref, undefined);
  assert.equal(day(5).props.ref, props.todayRef);
  assert.equal(day(5).props.children[0].type.name, 'TodayRing');
  assert.equal(day(5).props.children[1].props.active, true);
  assert.equal(path()[0].props.walked[5], true);
  assert.equal(section.sharedValues.length, 0);
  assert.equal(section.visibilityOwners(), 0);
});

test('locked weeks retain locks and tap handling and become available directly with Pro', () => {
  let taps = 0;
  const props = {
    week: planCalendar('night', 7, false).weeks[1], index: 1,
    enrollment: { planId: 'night' }, goldDays: new Set([8]),
    isLocked: true, onPlace: noop, onTrailPlaced: noop, onOpenNode: noop,
    onLockedPress: () => { taps++; }, todayRef: noop,
  };
  const section = setup('WeekSection', props);
  const path = () => section.view().props.children[1].props.children;
  const nodes = () => path()[1];
  for (const node of nodes()) {
    const coin = setup('DayNode', node.props).view();
    const hop = coin.props.children[1];
    assert.equal(node.props.tone.face, 'grey');
    assert.equal(coin.props.children[0], null);
    assert.equal(coin.props.ref, undefined);
    assert.equal(hop.props.active, false);
    assert.equal(hop.props.children.props.children.props.name, 'coin-lock');
    hop.props.children.props.onPress(noop);
  }
  assert.equal(taps, 7);
  assert.ok(path()[0].props.walked.every((walked) => !walked));
  const room = path()[2];
  assert.equal(room.props.isLocked, true);
  room.props.onPress(noop);
  assert.equal(taps, 8);

  section.render({ ...props, isLocked: false });
  const today = setup('DayNode', nodes()[0].props).view();
  assert.equal(nodes()[0].props.tone.face, 'blue', 'available days never borrow completed-day gold');
  assert.equal(today.props.ref, props.todayRef);
  assert.equal(today.props.children[1].props.active, true);
  assert.equal(today.props.children[1].props.children.props.children.props.name, 'reset');
  assert.equal(path()[0].props.walked[0], true);
  assert.equal(section.sharedValues.length, 0);
});

test('ten idle focus cycles keep one hop owner and clear its lift every time', () => {
  const harness = setup('Hop', { active: true, children: 'coin' });
  const lift = harness.sharedValues[0];
  for (let cycle = 0; cycle < 10; cycle++) {
    const animation = lift.animation;
    lift.value = -8;
    harness.setVisible(false);
    assert.equal(animation.cancelled, true);
    assert.equal(lift.value, 0);
    harness.setVisible(true);
    assert.notEqual(lift.animation, animation);
    assert.equal(harness.sharedValues.length, 1);
    assert.equal(harness.visibilityOwners(), 1);
  }
  const finalAnimation = lift.animation;
  harness.unmount();
  assert.equal(finalAnimation.cancelled, true);
  assert.equal(lift.value, 0);
});

test('the existing idle hop remains and stops on completion, blur and unmount', () => {
  const harness = setup('Hop', { active: true, children: 'coin' });
  const lift = harness.sharedValues[0];
  const idle = lift.animation;
  assert.equal(idle.kind, 'repeat');
  assert.equal(idle.count, -1);
  harness.render({ active: false, children: 'coin' });
  assert.equal(idle.cancelled, true);
  assert.equal(lift.value, 0);
  harness.render({ active: true, children: 'coin' });
  const nextIdle = lift.animation;
  harness.setVisible(false);
  assert.equal(nextIdle.cancelled, true);
  harness.setVisible(true);
  assert.notEqual(lift.animation, nextIdle);
  const resumed = lift.animation;
  harness.unmount();
  assert.equal(resumed.cancelled, true);
  assert.equal(lift.value, 0);
});

test('reduced motion suppresses the existing idle hop', () => {
  const harness = setup('Hop', { active: true, children: 'coin' }, { reducedMotion: true });
  assert.equal(harness.sharedValues[0].animation, null);
});
