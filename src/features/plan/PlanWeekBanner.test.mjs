import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = ts.transpileModule(readFileSync(new URL('./PlanWeekBanner.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function setup() {
  const slots = [];
  const haptics = [];
  const purposeCalls = [];
  let cursor = 0;
  let reaction;
  let previous;
  const slot = (initial) => {
    const index = cursor++;
    if (!(index in slots)) slots[index] = initial();
    return slots[index];
  };
  const jsx = (type, props, key) => ({ type, props, key });
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    require(name) {
      if (name === 'react') return {
        useState(initial) {
          const state = slot(() => ({ value: initial }));
          return [state.value, value => { state.value = value; }];
        },
      };
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'react-native') return {
        View: 'View', Pressable: 'Pressable',
        StyleSheet: {
          create: styles => styles,
          absoluteFill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
        },
      };
      if (name === 'react-native-reanimated') return {
        default: { View: 'AnimatedView' },
        useSharedValue: value => slot(() => ({ value })),
        useAnimatedReaction: (prepare, react) => { reaction = { prepare, react }; },
        runOnJS: callback => callback,
      };
      if (name.endsWith('/Text')) return { Text: 'Text' };
      if (name.endsWith('/planPath')) return { isPlanWeekLocked: (week, isPro) => week > 1 && !isPro };
      if (name.endsWith('/planWeekPurpose')) return { planWeekPurpose: (...args) => { purposeCalls.push(args); return `Purpose ${args[1]}`; } };
      if (name.endsWith('/weekHue')) return { weekHue: week => ({ base: `week-${week}`, ink: '#123456' }) };
      if (name.endsWith('/tapHaptics')) return { triggerMediumHaptic: () => haptics.push(true) };
      if (name.endsWith('/card')) return { card: {}, coloredCard: () => ({ borderWidth: 2 }) };
      if (name.endsWith('/colors')) return { colors: { playful: { stone: {} }, text: {}, onBlock: {} } };
      if (name.endsWith('/motion')) return { duration: {} };
      if (name.endsWith('/spacing')) return { spacing: { md: 16 } };
      if (name.endsWith('/typography')) return { fonts: {}, typography: { label: {}, heading: {}, overline: {} } };
      return {};
    },
  });
  const props = {
    weeks: [{ week: 1 }, { week: 2 }, { week: 3 }], planId: 'stress',
    isPro: true, onLockedPress() {},
    scrollY: { value: 0 }, pathTop: { value: 16 }, weekTops: { value: [0, 500, 1100] },
  };
  const render = () => { cursor = 0; return exports.TopBarWeekBanner(props); };
  return {
    props, render, haptics, purposeCalls,
    banner: props => exports.WeekBanner(props),
    scrollTo(y) {
      props.scrollY.value = y;
      const next = reaction.prepare();
      reaction.react(next, previous);
      previous = next;
      return render();
    },
  };
}

test('native layout reserves every full-width week and fills the visible card without sizing callbacks', () => {
  const harness = setup();
  const [sizers, overlay] = harness.render().props.children;
  assert.equal(sizers.props.style.flexDirection, 'row');
  assert.equal(sizers.props.style.alignItems, 'flex-start');
  assert.equal(sizers.props.pointerEvents, 'none');
  assert.equal(sizers.props.accessibilityElementsHidden, true);
  assert.equal(sizers.props.style.opacity, 0);
  assert.equal(sizers.props.children.length, 3);
  for (const sizer of sizers.props.children) {
    assert.equal(sizer.props.style.width, '100%');
    assert.equal(sizer.props.style.flexShrink, 0);
    assert.equal(sizer.props.style.position, undefined);
    assert.equal(sizer.props.onLayout, undefined);
  }
  assert.equal(overlay.props.style.position, 'absolute');
  assert.equal(overlay.props.children.props.fill, true);
  const banner = harness.banner(overlay.props.children.props);
  assert.equal(banner.props.style.at(-1).flex, 1);
  assert.equal(banner.props.children.props.style.at(-1).flex, 1);
});

test('week switching follows the scroll content origin and keeps its return slack', () => {
  const harness = setup();
  const activeWeek = tree => tree.props.children[1].props.children.props.week.week;
  harness.render();
  assert.equal(activeWeek(harness.scrollTo(0)), 1);
  assert.equal(activeWeek(harness.scrollTo(515)), 1);
  assert.equal(activeWeek(harness.scrollTo(516)), 2);
  assert.equal(activeWeek(harness.scrollTo(500)), 2);
  assert.equal(activeWeek(harness.scrollTo(499)), 1);
  assert.equal(activeWeek(harness.scrollTo(1116)), 3);
  assert.ok(harness.haptics.length > 0);
});


test('all reserved weeks and the visible banner use the enrolled pressure track', () => {
  const harness = setup();
  harness.props.planId = 'pressure';
  harness.props.pressureLessonTrack = 'overthinking';
  harness.render();
  assert.equal(harness.purposeCalls.length, 4);
  for (const [planId, , phoneTrack, pressureTrack] of harness.purposeCalls) {
    assert.equal(planId, 'pressure');
    assert.equal(phoneTrack, undefined);
    assert.equal(pressureTrack, 'overthinking');
  }
});
