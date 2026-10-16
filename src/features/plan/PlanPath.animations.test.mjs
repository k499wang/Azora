import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { planCalendar } from './domain/planCalendar.ts';
import * as pathRules from './domain/planPath.ts';
import * as trailRules from './domain/pathTrail.ts';
import * as pathLayout from './domain/pathLayout.ts';
import { measureWithinDeadline } from '../tour/tourSampling.ts';
import { planLessonTitle } from './domain/planLessonTitle.ts';
import { latestProgramPreset } from '../program/domain/programCatalogue.ts';
import { buildProgramEnrollment, programDayLesson } from '../program/domain/programEnrollment.ts';
import * as todoStepRules from '../program/domain/programTodoStep.ts';

// Execute the actual local visuals, keeping private components private in production.
const source = ts.transpileModule(readFileSync(new URL('./PlanPath.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText + '\nexports.visuals = { DayNode, WeekSection, PathTrail, Hop, NodeCaption };';

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
  let nextProps = componentName === 'WeekSection' ? { pathWidth: 320, ...props } : props;
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
    exports, AbortController,
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
        View: 'View',
        StyleSheet: {
          create: (styles) => styles,
          absoluteFill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
        },
        useWindowDimensions: () => ({ height: 800 }),
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
      if (name.endsWith('/useWhileVisible')) return {
        useWhileVisible: (callback, deps) => effect(callback, deps, true),
      };
      if (name.endsWith('/useCompletionSound')) return {
        useCompletionSound: (kind) => () => options.onSound?.(kind),
      };
      if (name.endsWith('/tapHaptics')) return { triggerTapHaptic: () => options.onTapHaptic?.() };
      if (name.endsWith('/tourSampling')) return {
        measureWithinDeadline,
        sampleUntilStable: options.sampleUntilStable ?? (async (measure) => ({ rect: await measure(), stable: true })),
      };
      if (name.endsWith('/planPath')) return pathRules;
      if (name.endsWith('/pathTrail')) return trailRules;
      if (name.endsWith('/pathLayout')) return pathLayout;
      if (name.endsWith('/programCatalogue')) return { programPresetRevision: () => null };
      if (name.endsWith('/programTodoStep')) return todoStepRules;
      if (name.endsWith('/programEnrollment')) return {
        programDayLesson: options.programDayLesson ?? (() => null),
      };
      if (name.endsWith('/planLessonTitle')) return { planLessonTitle };
      if (name.endsWith('/planWeekPurpose')) return { planWeekPurpose: () => 'Take a quiet pause' };
      if (name.endsWith('/pathCoinIcon')) return {
        dayCoinIcon: (_, day) => `motif-${day}`,
      };
      if (name.endsWith('/weekHue')) return { weekHue: () => ({ base: 'blue', ink: 'blue-rim', tint: 'blue-ring' }) };
      if (name.endsWith('/LipToken')) return { default: 'LipToken', CoinIcon: 'CoinIcon' };
      if (name.endsWith('/colors')) return { colors: {
        neutral: { 200: 'grey', 300: 'grey-rim' }, playful: { sky: { base: 'blue' } },
        text: {}, border: {}, reward: { gold: 'gold' }, background: {},
      } };
      if (name.endsWith('/spacing')) return { spacing: { xs: 4, '6xl': 64, sm: 8, md: 16, '3xl': 32 } };
      if (name.endsWith('/motion')) return { duration: { fast: 160, slow: 320 }, easing: {}, spring: { bounce: {} } };
      if (name.endsWith('/card')) return { radius: {} };
      if (name.endsWith('/common/Text')) return { Text: 'Text' };
      if (name.endsWith('/typography')) return {
        fonts: {},
        typography: {
          label: { medium: { fontSize: 14 } },
          heading: { heading1: { fontSize: 18, lineHeight: 26 } },
          overline: {},
        },
      };
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
    render: (props = nextProps) => { nextProps = componentName === 'WeekSection' ? { pathWidth: 320, ...props } : props; return render(); },
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

function revealHarness(props) {
  const drawn = [];
  const harness = setup('PlanPath', {
    calendar: { weeks: [] }, enrollment: { planId: 'test' }, goldDays: new Set(),
    onDrawn: () => drawn.push(true), ...props,
  });
  const parts = () => harness.view().props.children;
  return { harness, drawn, weeks: () => parts()[0] };
}

test('path renders its weeks directly with no week card or reveal cover', () => {
  const { harness, drawn, weeks } = revealHarness({
    calendar: { weeks: [{ week: 1, days: [] }, { week: 2, days: [] }] },
  });
  assert.equal(Object.assign({}, ...harness.view().props.style).opacity, 0, 'only a normal positive-width layout is needed');
  assert.notEqual(harness.view().props.pointerEvents, 'none');
  assert.equal(drawn.length, 0);
  harness.view().props.onLayout({ nativeEvent: { layout: { width: 0, height: 0 } } });
  assert.equal(drawn.length, 0);
  harness.view().props.onLayout({ nativeEvent: { layout: { width: 320, height: 1400 } } });
  harness.render();
  assert.equal(drawn.length, 1);
  assert.equal(Object.assign({}, ...harness.view().props.style).opacity, undefined);
  harness.view().props.onLayout({ nativeEvent: { layout: { width: 320, height: 1400 } } });
  assert.equal(drawn.length, 1);
  assert.equal(harness.view().props.children.length, 2, 'only the weeks and day detail card remain');
  assert.equal(weeks().length, 2);
  assert.ok(weeks().every(week => week.type.name === 'WeekSection'));
  assert.ok(weeks().every(week => typeof week.props.onPlace === 'function'), 'weeks report their tops for the top bar banner');
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
    isLocked: false, onPlace: noop, onOpenNode: noop,
    onLockedPress: noop,
  });
  const nodes = section.view().props.children[1].props.children[1];
  assert.deepEqual(nodes.map((node) => node.props.tone.face), ['blue', 'gold', 'blue', 'grey']);
  assert.equal(section.sharedValues.length, 0);
  assert.equal(section.visibilityOwners(), 0);
  for (const [index, icon] of ['coin-check', 'coin-check', 'motif-3', 'motif-4'].entries()) {
    const coin = setup('DayNode', nodes[index].props);
    assert.equal(coin.sharedValues.length, 0);
    assert.equal(coin.visibilityOwners(), 0);
    const hop = coin.view().props.children[1];
    assert.equal(hop.type.name, 'Hop', 'only the existing idle hop wraps the coin');
    assert.equal(hop.props.active, index === 2);
    assert.equal(hop.props.children.type, 'LipToken');
    assert.equal(hop.props.children.props.children.type, 'CoinIcon');
    assert.equal(hop.props.children.props.children.props.name, icon);
  }
  const today = setup('DayNode', nodes[2].props);
  assert.equal(today.view().props.children[0].type.name, 'TodayRing');
});

test('future and locked coins preview the actual enrolled lesson with compact muted captions', () => {
  const result = buildProgramEnrollment({
    enrollmentId: 'test-overthinking', planId: 'pressure',
    presetRevision: latestProgramPreset('pressure').revision,
    pressureLessonTrack: 'overthinking', enrolledOn: '2026-10-07',
  });
  assert.equal(result.status, 'enrolled');
  const enrollment = result.enrollment;
  const calendar = planCalendar('pressure', 0, false);
  for (const [index, isLocked] of [[0, false], [1, true]]) {
    const section = setup('WeekSection', {
      week: calendar.weeks[index], index, enrollment, goldDays: new Set(), isLocked,
      onPlace: noop, onOpenNode: noop, onLockedPress: noop,
    }, { programDayLesson });
    const nodes = section.view().props.children[1].props.children[1];
    for (const node of nodes) {
      const expected = planLessonTitle(programDayLesson(enrollment, node.props.day.day));
      assert.equal(node.props.lessonTitle, expected);
      const coin = setup('DayNode', node.props).view();
      assert.ok(coin.props.accessibilityLabel.includes(expected));
      const caption = coin.props.children[2];
      assert.equal(caption.props.eyebrow, `DAY ${node.props.day.day}`);
      assert.equal(caption.props.title, expected);
      assert.equal(caption.props.muted, isLocked || node.props.day.state === 'ahead');
    }
    if (!isLocked) assert.equal(nodes[0].props.lessonTitle, 'When Thinking Repeats');
  }
});

test('a lesson caption holds its size, two lines and an ellipsis rather than shrinking', () => {
  const caption = setup('NodeCaption', {
    eyebrow: 'DAY 12', title: 'The Red Dot Pull',
    size: 80, offset: 0, pathWidth: 320, muted: false,
  }).view();
  const [eyebrow, title] = caption.props.children;

  assert.equal(eyebrow.props.children, 'DAY 12');
  assert.equal(title.props.children, 'The Red Dot Pull');
  assert.equal(title.props.numberOfLines, 2, 'two lines, then an ellipsis');
  assert.equal(title.props.ellipsizeMode, 'tail');
  // iOS ignores `minimumFontScale` and lets `adjustsFontSizeToFit` shrink to 4pt,
  // so the whole caption is drawn at the size it was written for.
  for (const line of [eyebrow, title]) {
    assert.equal(line.props.adjustsFontSizeToFit, undefined);
    assert.equal(line.props.minimumFontScale, undefined);
  }
  const drawn = [title.props.style].flat(Infinity).find((value) => value.lineHeight != null);
  assert.equal(drawn.fontSize, 18);
  assert.equal(drawn.lineHeight, drawn.fontSize + 4, 'two lines of the drawn size fit the caption box');
});

test('locked coins keep the central lock even when their day is completed', () => {
  for (const state of ['done', 'doneToday']) {
    const coin = setup('DayNode', {
      day: { day: 1, state }, offset: 0,
      tone: { face: 'grey', lip: 'grey-rim', icon: 'grey-icon' },
      isLocked: true, dayIcon: 'motif-1', lessonTitle: 'A quiet pause',
      pathWidth: 320, accent: 'blue', onPlace: noop, onPress: noop,
    }).view();
    const token = coin.props.children[1].props.children;
    assert.equal(token.props.children.type, 'CoinIcon');
    assert.equal(token.props.children.props.name, 'coin-lock');
  }
});

const trailNode = (x, y) => ({ x, y, reach: 10, above: 10, below: 10 });
const trailCircles = (harness) => Array.from(harness.view().props.children, (dot) => ({
  key: dot.key,
  ...Object.assign({}, ...dot.props.style),
}));

test('the plan road renders evenly spaced native circles between rims in each progress color', () => {
  const harness = setup('PathTrail', {
    points: [trailNode(40, 0), trailNode(40, 100), trailNode(40, 200), trailNode(40, 300)],
    stretches: ['walked', 'gold', 'walked', 'ahead'],
  });
  const tree = harness.view();
  assert.equal(tree.type, 'View');
  assert.equal(tree.props.pointerEvents, 'none');
  assert.equal(tree.props.accessibilityElementsHidden, true);
  assert.equal(tree.props.importantForAccessibility, 'no-hide-descendants');
  assert.deepEqual(Object.assign({}, tree.props.style), {
    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
  });
  assert.ok(tree.props.children.every((dot) => dot.type === 'View'));
  const expected = ['gold', 'blue', 'grey-rim'].flatMap((backgroundColor, segment) =>
    [18, 34, 50, 66, 82].map((y, index) => ({
      key: `${segment + 1}-${index}`,
      position: 'absolute', width: 8, height: 8, borderRadius: 4,
      left: 36, top: segment * 100 + y - 4, backgroundColor,
    })),
  );
  assert.deepEqual(trailCircles(harness), expected);
  assert.equal(harness.sharedValues.length, 0);
  assert.equal(harness.visibilityOwners(), 0);
});

test('every local trail is complete immediately from one path width, without child measurements', () => {
  const props = {
    week: { week: 1, state: 'current', days: [{ day: 1, state: 'done' }, { day: 2, state: 'today' }] },
    pathWidth: 320, index: 0, enrollment: { planId: 'test' }, goldDays: new Set(),
    isLocked: false, onPlace: noop, onOpenNode: noop, onLockedPress: noop,
  };
  const section = setup('WeekSection', props);
  const path = () => section.view().props.children[1].props.children;
  const trail = setup('PathTrail', path()[0].props);
  const initial = trailCircles(trail);
  assert.ok(initial.length > 0);
  assert.equal(path()[0].props.points.length, 3);
  assert.ok(initial.some((dot) => dot.backgroundColor === 'blue'));
  assert.ok(initial.some((dot) => dot.backgroundColor === 'grey-rim'));
  assert.equal(path()[2].props.onPlace, undefined);
  assert.ok(path()[1].every((node) => node.props.onPlace === undefined));
  section.render({ ...props, pathWidth: 400 });
  trail.render(path()[0].props);
  assert.deepEqual(trailCircles(trail), initial.map((dot) => ({ ...dot, left: dot.left + 40 })));
});

test('trail circles update coordinates and canonical progress colors without remounting', () => {
  const harness = setup('PathTrail', {
    points: [trailNode(40, 0), trailNode(40, 100)], stretches: ['ahead', 'ahead'],
  });
  const initial = trailCircles(harness);
  harness.render({ points: [trailNode(64, 20), trailNode(64, 120)], stretches: ['walked', 'walked'] });
  const moved = trailCircles(harness);
  assert.deepEqual(moved, initial.map((dot) => ({
    ...dot, left: dot.left + 24, top: dot.top + 20, backgroundColor: 'blue',
  })));
  harness.render({ points: [trailNode(64, 20), trailNode(64, 120)], stretches: ['gold', 'gold'] });
  assert.deepEqual(trailCircles(harness), moved.map((dot) => ({ ...dot, backgroundColor: 'gold' })));
});

test('ten blur and focus cycles leave the complete trail unchanged with no visibility or animation owner', () => {
  const harness = setup('PathTrail', {
    points: [trailNode(40, 0), trailNode(40, 100), trailNode(40, 200)],
    stretches: ['walked', 'walked', 'ahead'],
  });
  const initial = trailCircles(harness);
  for (let cycle = 0; cycle < 10; cycle++) {
    harness.setVisible(false);
    assert.deepEqual(trailCircles(harness), initial);
    harness.setVisible(true);
    assert.deepEqual(trailCircles(harness), initial);
    assert.equal(harness.sharedValues.length, 0);
    assert.equal(harness.visibilityOwners(), 0);
  }
  harness.unmount();
});

test('completion keeps today selected and the next day locked until the calendar rolls over', () => {
  const props = {
    index: 0, enrollment: { planId: 'night' }, goldDays: new Set([5]),
    isLocked: false, onPlace: noop, onOpenNode: noop,
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
  assert.equal(path()[0].props.stretches[5], 'ahead');

  section.render({ ...props, week: planCalendar('night', 5, false).weeks[0] });
  assert.equal(nodes()[5].props.tone.face, 'blue');
  assert.equal(day(4).props.ref, undefined);
  assert.equal(day(5).props.ref, props.todayRef);
  assert.equal(day(5).props.children[0].type.name, 'TodayRing');
  assert.equal(day(5).props.children[1].props.active, true);
  assert.equal(path()[0].props.stretches[5], 'walked');
  assert.equal(section.sharedValues.length, 0);
  assert.equal(section.visibilityOwners(), 0);
});

test('locked weeks retain locks and tap handling and become available directly with Pro', () => {
  let taps = 0;
  const props = {
    week: planCalendar('night', 7, false).weeks[1], index: 1,
    enrollment: { planId: 'night' }, goldDays: new Set([8]),
    isLocked: true, onPlace: noop, onOpenNode: noop,
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
    assert.equal(hop.props.children.props.children.type, 'CoinIcon');
    assert.equal(hop.props.children.props.children.props.name, 'coin-lock');
    hop.props.children.props.onPress(noop);
  }
  assert.equal(taps, 7);
  assert.ok(path()[0].props.stretches.every((stretch) => stretch === 'ahead'));
  const room = path()[2];
  assert.equal(room.props.isLocked, true);
  room.props.onPress(noop);
  assert.equal(taps, 8);

  section.render({ ...props, isLocked: false });
  const today = setup('DayNode', nodes()[0].props).view();
  assert.equal(nodes()[0].props.tone.face, 'blue', 'available days never borrow completed-day gold');
  assert.equal(today.props.ref, props.todayRef);
  assert.equal(today.props.children[1].props.active, true);
  assert.equal(today.props.children[1].props.children.props.children.props.name, 'motif-8');
  assert.equal(path()[0].props.stretches[0], 'walked');
  assert.equal(section.sharedValues.length, 0);
});

function interactionHarness(options = {}) {
  const scrolls = [];
  const sounds = [];
  let haptics = 0;
  let lockedTaps = 0;
  const props = {
    calendar: planCalendar('night', 4, false), enrollment: { planId: 'night' },
    isPro: false, goldDays: new Set([1, 2, 3, 4]), revealTop: 100,
    onScrollBy: (dy) => scrolls.push(dy),
    onLockedWeekTap: () => { lockedTaps++; },
  };
  const harness = setup('PlanPath', props, {
    onSound: (kind) => sounds.push(kind), onTapHaptic: () => { haptics++; },
    ...options,
  });
  const sections = () => harness.view().props.children[0];
  return {
    harness, props, scrolls, sounds, haptics: () => haptics, lockedTaps: () => lockedTaps,
    sections,
    card: () => harness.view().props.children.at(-1).props,
  };
}

test('ten coin taps open and close the day card with only the original tap feedback', async () => {
  const interaction = interactionHarness();
  const { harness, props, sections, card, sounds, scrolls } = interaction;
  const anchor = { x: 150, y: 100, width: 77, height: 75 };
  for (let cycle = 0; cycle < 10; cycle++) {
    await sections()[0].props.onOpenNode(async () => anchor, { day: 5 });
    harness.render();
    assert.equal(card().visible, true);
    assert.equal(card().content.anchor, anchor);
    assert.equal(card().content.detail.title, 'Day 5');
    assert.ok(card().content.detail.rows.every((row) => !row.completed));
    card().onClose();
    harness.render();
    assert.equal(card().visible, false);
    assert.equal(card().content.anchor, anchor, 'closing retains content during the original fade');
    assert.notEqual(harness.view().props.pointerEvents, 'none');
  }
  assert.equal(sounds.length, 10);
  assert.ok(sounds.every((kind) => kind === 'pathTap'));
  assert.equal(interaction.haptics(), 10);
  assert.deepEqual(scrolls, []);

  await sections()[0].props.onOpenNode(async () => anchor, { day: 5 });
  harness.render();
  harness.render({ ...props, completion: {
    day: 5, completedActivityIds: [], checkInCompleted: true, lessonCompleted: false,
  } });
  assert.equal(card().content.detail.rows.find((row) => row.kind === 'checkIn').completed, true);
  assert.equal(card().content.detail.rows.find((row) => row.kind === 'lesson').completed, false);
  harness.unmount();
});

test('a cramped coin still scrolls before opening its card at the remeasured anchor', async () => {
  const first = { x: 150, y: 380, width: 77, height: 75 };
  const settled = { ...first, y: 100 };
  let measurements = 0;
  let samples = 0;
  const interaction = interactionHarness({
    sampleUntilStable: async (measure) => {
      samples++;
      assert.deepEqual(interaction.scrolls, [280], 'scroll starts before remeasurement');
      return { rect: await measure(), stable: true };
    },
  });
  await interaction.sections()[0].props.onOpenNode(
    async () => (++measurements === 1 ? first : settled), { day: 5 },
  );
  interaction.harness.render();
  assert.equal(samples, 1);
  assert.equal(measurements, 2);
  assert.equal(interaction.card().visible, true);
  assert.equal(interaction.card().content.anchor, settled);
  assert.deepEqual(interaction.sounds, ['pathTap']);
  interaction.harness.unmount();
});

test('a missing coin measurement leaves the card closed and does not scroll', async () => {
  const interaction = interactionHarness();
  await interaction.sections()[0].props.onOpenNode(async () => null, { day: 5 });
  interaction.harness.render();
  assert.equal(interaction.card().visible, false);
  assert.equal(interaction.card().content, null);
  assert.deepEqual(interaction.scrolls, []);
  interaction.harness.unmount();
});

test('the real locked-week handler keeps paywall callback and tap feedback without opening a card', () => {
  const interaction = interactionHarness();
  const lockedWeek = interaction.sections()[1];
  assert.equal(lockedWeek.props.isLocked, true);
  lockedWeek.props.onLockedPress();
  interaction.harness.render();
  assert.equal(interaction.lockedTaps(), 1);
  assert.equal(interaction.haptics(), 1);
  assert.deepEqual(interaction.sounds, ['pathTap']);
  assert.equal(interaction.card().visible, false);
  assert.notEqual(interaction.harness.view().props.pointerEvents, 'none');
  interaction.harness.unmount();
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

test('a native card measurement that never calls back times out and a later tap works', async () => {
  const interaction = interactionHarness();
  await interaction.sections()[0].props.onOpenNode(() => new Promise(() => {}), { day: 5 });
  interaction.harness.render();
  assert.equal(interaction.card().visible, false);
  const anchor = { x: 150, y: 100, width: 77, height: 75 };
  await interaction.sections()[0].props.onOpenNode(async () => anchor, { day: 5 });
  interaction.harness.render();
  assert.equal(interaction.card().visible, true);
  interaction.harness.unmount();
});

test('invalid native card geometry never opens an invisible or misplaced card', async () => {
  const interaction = interactionHarness();
  for (const anchor of [
    { x: 0, y: 100, width: 0, height: 75 },
    { x: 0, y: 100, width: 77, height: 0 },
    { x: NaN, y: 100, width: 77, height: 75 },
    { x: 0, y: Infinity, width: 77, height: 75 },
  ]) {
    await interaction.sections()[0].props.onOpenNode(async () => anchor, { day: 5 });
    interaction.harness.render();
    assert.equal(interaction.card().visible, false);
  }
  interaction.harness.unmount();
});

test('late measurement cannot reopen after close, a newer tap, or unmount', async () => {
  const interaction = interactionHarness();
  const anchor = { x: 150, y: 100, width: 77, height: 75 };
  let finish;
  const openLate = () => interaction.sections()[0].props.onOpenNode(
    () => new Promise((resolve) => { finish = resolve; }), { day: 5 },
  );
  const closed = openLate();
  await Promise.resolve(); await Promise.resolve();
  interaction.card().onClose();
  finish(anchor); await closed; interaction.harness.render();
  assert.equal(interaction.card().visible, false);

  const replaced = openLate();
  await Promise.resolve(); await Promise.resolve();
  await interaction.sections()[0].props.onOpenNode(async () => anchor, { day: 4 });
  finish(anchor); await replaced; interaction.harness.render();
  assert.equal(interaction.card().content.detail.title, 'Day 4');

  interaction.card().onClose(); interaction.harness.render();
  const unmounted = openLate();
  await Promise.resolve(); await Promise.resolve();
  interaction.harness.unmount(); finish(anchor); await unmounted;
  interaction.harness.render();
  assert.equal(interaction.card().visible, false);
});
