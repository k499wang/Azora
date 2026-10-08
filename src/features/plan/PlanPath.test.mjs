import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup() {
  let frame;
  let start;
  let layout = null;
  let measurements = 0;
  const queued = [];
  const exports = {};
  const source = ts.transpileModule(readFileSync(new URL('./PlanPath.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(source, {
    exports,
    require(name) {
      if (name === 'react') return {
        memo: (component) => component,
        useCallback: (callback) => callback,
        useRef: (current) => ({ current }),
        useState: (initial) => [initial, () => {}],
      };
      if (name === 'react/jsx-runtime') return {
        jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }),
      };
      if (name === 'react-native') return {
        StyleSheet: { create: (styles) => styles }, useWindowDimensions: () => ({ height: 800 }),
      };
      if (name === 'react-native-reanimated') return {
        default: { View: 'AnimatedView' },
        useAnimatedRef: () => ({}),
        useSharedValue: (value) => ({ value }),
        useAnimatedStyle: (read) => read,
        useAnimatedReaction: () => {},
        useFrameCallback(callback) {
          frame = { active: false, setActive(active) { this.active = active; },
            tick() { if (this.active) callback(); } };
          return frame;
        },
        measure() { measurements++; return layout; },
        runOnJS: (callback) => () => queued.push(callback),
      };
      if (name.endsWith('/useWhileVisible')) return { useWhileVisible: (callback) => { start = callback; } };
      if (name.endsWith('/useCompletionSound')) return { useCompletionSound: () => () => true };
      if (name.endsWith('/usePathCelebration')) return { usePathCelebration: () => null };
      if (name.endsWith('/pathCelebration')) return { isPlanWeekLocked: () => false };
      if (name.endsWith('/colors')) return { colors: {
        neutral: {}, playful: {}, text: {}, border: {}, reward: {},
      } };
      if (name.endsWith('/spacing')) return { spacing: {} };
      if (name.endsWith('/card')) return { radius: {} };
      if (name.endsWith('/typography')) return {
        fonts: {}, typography: { label: { medium: {} }, overline: {} },
      };
      if (name.endsWith('/planWeekPurpose')) return { planWeekPurpose: () => '' };
      if (name.endsWith('/PlanWeekBanner')) return { weekHue: () => ({}) };
      return {};
    },
  });
  const pin = {
    scrollY: { value: 50 }, origin: { value: null }, inlineHeight: { value: 0 },
    overlayReady: { value: false }, stickTop: 100, weekTops: { value: [] },
  };
  const view = exports.default({
    calendar: { weeks: [{ week: 1, days: [] }] }, enrollment: { planId: 'test' }, pin,
  });
  return {
    view, inline: view.props.children[0], pin,
    focus: () => start(),
    tick: () => frame.tick(),
    setLayout: (next) => { layout = next; },
    flush: () => { while (queued.length) queued.shift()(); },
    active: () => frame.active,
    measurements: () => measurements,
  };
}

test('failed layout measurement retries without scrolling and preserves the inline banner', () => {
  const harness = setup();
  const blur = harness.focus();
  harness.inline.props.onLayout({ nativeEvent: { layout: { height: 120 } } });
  harness.tick();
  assert.equal(harness.pin.inlineHeight.value, 120);
  assert.equal(harness.pin.origin.value, null);
  assert.equal(harness.inline.props.style().opacity, 1);
  harness.setLayout({ pageY: 250 });
  harness.tick();
  assert.equal(harness.pin.origin.value, 300);
  assert.equal(harness.inline.props.style().opacity, 1);
  harness.pin.overlayReady.value = true;
  assert.equal(harness.inline.props.style().opacity, 0);
  harness.flush();
  assert.equal(harness.active(), false);
  blur();
});

test('blur stops retries, focus restarts them, and a queued stop preserves a newer layout request', () => {
  const harness = setup();
  const blur = harness.focus();
  harness.tick();
  blur();
  harness.tick();
  assert.equal(harness.measurements(), 1);
  const nextBlur = harness.focus();
  harness.setLayout({ pageY: 250 });
  harness.tick();
  harness.view.props.onLayout();
  harness.flush();
  assert.equal(harness.active(), true);
  harness.setLayout({ pageY: 270 });
  harness.tick();
  harness.flush();
  assert.equal(harness.pin.origin.value, 320);
  assert.equal(harness.active(), false);
  nextBlur();
});

test('ten focus cycles measure once each and leave no frame work running', () => {
  const harness = setup();
  for (let cycle = 0; cycle < 10; cycle++) {
    const blur = harness.focus();
    harness.setLayout({ pageY: 250 + cycle });
    harness.tick();
    harness.flush();
    assert.equal(harness.active(), false);
    assert.equal(harness.measurements(), cycle + 1);
    assert.equal(harness.pin.origin.value, 300 + cycle);
    harness.tick();
    blur();
    harness.tick();
    assert.equal(harness.measurements(), cycle + 1);
  }
});
