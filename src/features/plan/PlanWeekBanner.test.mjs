import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup({ isPro = true, stick: withStick = true } = {}) {
  const slots = [];
  const reactions = [];
  const sized = [];
  const haptics = [];
  let cursor = 0;
  let dirty = false;
  const slot = (create) => {
    const index = cursor++;
    slots[index] ??= create();
    return slots[index];
  };
  const exports = {};
  const source = ts.transpileModule(readFileSync(new URL('./PlanWeekBanner.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(source, {
    exports,
    require(name) {
      if (name === 'react') return {
        useState(initial) {
          const state = slot(() => ({ value: initial }));
          return [state.value, (next) => {
            const value = typeof next === 'function' ? next(state.value) : next;
            if (!Object.is(value, state.value)) { state.value = value; dirty = true; }
          }];
        },
        useCallback: (callback) => callback,
        useEffect(effect, deps) {
          const state = slot(() => ({}));
          if (state.deps && deps.every((dep, i) => Object.is(dep, state.deps[i]))) return;
          state.deps = deps;
          effect();
        },
      };
      if (name === 'react/jsx-runtime') return {
        jsx: (type, props, key) => ({ type, props, key }),
        jsxs: (type, props, key) => ({ type, props, key }),
      };
      if (name === 'react-native') return { View: 'View', StyleSheet: { create: (styles) => styles } };
      if (name === 'react-native-reanimated') return {
        default: { View: 'AnimatedView' },
        useSharedValue: (initial) => slot(() => ({ value: initial })),
        useAnimatedStyle: (read) => read,
        useAnimatedReaction(read, react) {
          const state = slot(() => ({}));
          state.read = read;
          state.react = react;
          reactions.push(state);
        },
        runOnJS: (callback) => callback,
      };
      if (name.endsWith('/tapHaptics')) return { triggerMediumHaptic: () => haptics.push('medium') };
      if (name.endsWith('/planPath')) return { isPlanWeekLocked: (week, pro) => !pro && week >= 2 };
      if (name.endsWith('/planWeekPurpose')) return { planWeekPurpose: (_, week) => `purpose ${week}` };
      if (name.endsWith('/colors')) return { colors: { playful: { stone: 'stone' }, onBlock: {}, text: {} } };
      if (name.endsWith('/spacing')) return { spacing: { md: 16 } };
      if (name.endsWith('/typography')) return {
        fonts: {}, typography: { label: { medium: {} }, heading: { heading2: {} }, overline: {} },
      };
      return {};
    },
  });

  const stick = withStick
    ? { scrollY: { value: 0 }, top: 100, pathTop: { value: null } }
    : undefined;
  const weekTops = { value: [] };
  const onSized = (height) => sized.push(height);
  let view;
  const render = () => {
    do {
      dirty = false;
      cursor = 0;
      reactions.length = 0;
      view = exports.StickyWeekBanner({
        weeks: [{ week: 1, phaseName: 'One' }, { week: 2, phaseName: 'Two' }],
        planId: 'test',
        isPro,
        onLockedPress: () => {},
        stick,
        weekTops,
        onSized,
      });
    } while (dirty);
    return view;
  };
  render();
  return {
    stick,
    weekTops,
    sized,
    haptics,
    render,
    translate: () => view.props.style[1]().transform[0].translateY,
    active: () => view.props.children[1],
    measure(heights) {
      view.props.children[0].forEach((sizer, index) =>
        sizer.props.onLayout({ nativeEvent: { layout: { height: heights[index] } } }));
      return render();
    },
    scroll(y) {
      stick.scrollY.value = y;
      for (const reaction of reactions) {
        const next = reaction.read();
        if (next !== reaction.previous) {
          const previous = reaction.previous;
          reaction.previous = next;
          reaction.react(next, previous);
        }
      }
      return render();
    },
  };
}

test('the banner rides with the path until its top reaches the pin line, then holds there', () => {
  const harness = setup();
  assert.equal(harness.translate(), 0, 'unplaced, it stays where it is drawn');
  harness.stick.pathTop.value = 300;
  harness.scroll(0);
  assert.equal(harness.translate(), 0);
  harness.scroll(200);
  assert.equal(harness.translate(), 0, 'exactly on the line');
  harness.scroll(250);
  assert.equal(harness.translate(), 50);
  harness.scroll(1000);
  assert.equal(harness.translate(), 800);
  harness.scroll(0);
  assert.equal(harness.translate(), 0);
});

test('the path top moving under it is picked up without a remeasure', () => {
  const harness = setup();
  harness.stick.pathTop.value = 300;
  harness.scroll(400);
  assert.equal(harness.translate(), 200);
  harness.stick.pathTop.value = 360;
  assert.equal(harness.translate(), 140);
});

test('every week is measured and the shown banner takes the tallest height', () => {
  const harness = setup();
  assert.equal(harness.active().props.minHeight, undefined);
  assert.deepEqual(harness.sized, []);
  harness.measure([90, 120]);
  assert.equal(harness.active().props.minHeight, 120);
  assert.deepEqual([...harness.sized], [120]);
  harness.measure([90, 120]);
  assert.deepEqual([...harness.sized], [120], 'the same layout again reports nothing new');
});

test('the banner names the week whose start has passed under it, with slack on the way back', () => {
  const harness = setup();
  harness.measure([100, 100]);
  harness.weekTops.value = [0, 600];
  harness.stick.pathTop.value = 300;
  harness.scroll(0);
  assert.equal(harness.active().props.week.week, 1);
  // Week 2 starts at window y 300 + 600 - scroll; the line is 100 + 100.
  harness.scroll(699);
  assert.equal(harness.active().props.week.week, 1);
  harness.scroll(700);
  assert.equal(harness.active().props.week.week, 2);
  assert.deepEqual([...harness.haptics], ['medium']);
  harness.scroll(690);
  assert.equal(harness.active().props.week.week, 2, 'within the slack it holds');
  harness.scroll(680);
  assert.equal(harness.active().props.week.week, 1);
});

test('a locked week shows locked and grey when it is the one named', () => {
  const harness = setup({ isPro: false });
  harness.measure([100, 100]);
  harness.weekTops.value = [0, 600];
  harness.stick.pathTop.value = 300;
  harness.scroll(800);
  assert.equal(harness.active().props.isLocked, true);
  assert.equal(harness.active().props.hue, 'stone');
});

test('without a stick it stays in place on the first week', () => {
  const harness = setup({ stick: false });
  harness.measure([100, 140]);
  assert.equal(harness.translate(), 0);
  assert.equal(harness.active().props.week.week, 1);
  assert.equal(harness.active().props.minHeight, 140);
});
