import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup() {
  const values = [];
  const reactions = [];
  const cleanups = [];
  let cursor = 0;
  const exports = {};
  const source = ts.transpileModule(readFileSync(new URL('./PlanWeekBanner.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(source, {
    exports,
    require(name) {
      if (name === 'react') return {
        memo: (component) => component,
        useEffect: (effect) => cleanups.push(effect()),
      };
      if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }) };
      if (name === 'react-native') return { StyleSheet: { create: (styles) => styles } };
      if (name === 'react-native-reanimated') return {
        default: { View: 'AnimatedView' },
        useSharedValue(initial) {
          const index = cursor++;
          values[index] ??= { value: initial };
          return values[index];
        },
        useAnimatedStyle: (read) => read,
        useAnimatedReaction: (read, react) => reactions.push(() => react(read())),
      };
      if (name.endsWith('/colors')) return { colors: { playful: {}, onBlock: {}, text: {} } };
      if (name.endsWith('/spacing')) return { spacing: {} };
      if (name.endsWith('/typography')) return {
        fonts: {}, typography: { label: { medium: {} }, heading: { heading2: {} }, overline: {} },
      };
      return {};
    },
  });
  const pin = {
    scrollY: { value: 0 }, origin: { value: null }, overlayReady: { value: false },
    stickTop: 100, bannerHeight: 0,
  };
  return {
    pin,
    render() {
      cursor = 0;
      reactions.length = 0;
      return exports.PinnedWeekBanner({ pin });
    },
    flush: () => reactions.forEach((run) => run()),
    unmount: () => cleanups.forEach((cleanup) => cleanup?.()),
  };
}

test('the overlay waits for both origin and its final measured height before taking over', () => {
  const harness = setup();
  let overlay = harness.render();
  harness.pin.origin.value = 300;
  harness.flush();
  assert.equal(overlay.props.style().opacity, 0);
  overlay.props.onLayout({ nativeEvent: { layout: { height: 90 } } });
  harness.flush();
  assert.equal(overlay.props.style().opacity, 0);
  // The native layout can precede the React update carrying the measured height.
  harness.pin.bannerHeight = 90;
  overlay = harness.render();
  harness.flush();
  assert.equal(harness.pin.overlayReady.value, true);
  assert.equal(overlay.props.style().opacity, 1);
  assert.equal(overlay.props.style().transform[0].translateY, 200);
  harness.pin.scrollY.value = 250;
  assert.equal(overlay.props.style().transform[0].translateY, 0);
  harness.unmount();
  assert.equal(harness.pin.overlayReady.value, false);
});

test('a taller banner keeps the overlay hidden until native layout catches up', () => {
  const harness = setup();
  harness.pin.origin.value = 300;
  harness.pin.bannerHeight = 120;
  const overlay = harness.render();
  overlay.props.onLayout({ nativeEvent: { layout: { height: 90 } } });
  harness.flush();
  assert.equal(harness.pin.overlayReady.value, false);
  overlay.props.onLayout({ nativeEvent: { layout: { height: 120 } } });
  harness.flush();
  assert.equal(harness.pin.overlayReady.value, true);
});
