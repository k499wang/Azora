import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(readFileSync(new URL('./SlideUpSheet.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function mount({ visible = true, windowHeight = 800, screenHeight = 850 } = {}) {
  const hooks = [], effects = [], animations = [], measurements = [], paints = [];
  let cursor = 0, dirty = false, tree, dismissed = 0, unmounted = false;
  const props = { visible, children: 'Sheet contents', onClose() { props.visible = false; }, onDismissed() { dismissed++; } };
  const sameDeps = (a, b) => a?.length === b?.length && a.every((value, i) => Object.is(value, b[i]));
  const react = {
    useRef(initial) {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = { current: initial };
      return hooks[index];
    },
    useState(initial) {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = initial;
      return [hooks[index], next => {
        assert.equal(unmounted, false, 'no state update after unmount');
        const value = typeof next === 'function' ? next(hooks[index]) : next;
        if (!Object.is(hooks[index], value)) { hooks[index] = value; dirty = true; }
      }];
    },
    useMemo(callback, deps) {
      const index = cursor++;
      if (!sameDeps(hooks[index]?.deps, deps)) hooks[index] = { deps, value: callback() };
      return hooks[index].value;
    },
    useCallback(callback, deps) { return react.useMemo(() => callback, deps); },
    useLayoutEffect(callback, deps) {
      const index = cursor++, previous = hooks[index];
      if (sameDeps(previous?.deps, deps)) return;
      const record = { deps };
      hooks[index] = record;
      effects.push(() => { previous?.cleanup?.(); record.cleanup = callback(); });
    },
  };
  class Value {
    constructor(value) { this.value = value; this.stops = 0; }
    setValue(value) { this.value = value; }
    stopAnimation() {
      this.stops++;
      animations.filter(animation => animation.parts.some(part => part.value === this)).forEach(animation => animation.stop());
    }
  }
  const Animated = {
    Value, View: 'AnimatedView',
    timing: (value, config) => ({ value, config }),
    spring: (value, config) => ({ value, config }),
    parallel(parts) {
      const animation = {
        parts, active: false, stopped: false,
        start(callback) {
          this.callback = callback;
          this.active = true;
          this.from = parts.map(part => part.value.value);
          animations.push(this);
        },
        stop() { this.stopped = true; this.active = false; },
        finish(finished = true) {
          this.active = false;
          if (!this.stopped && finished) parts.forEach(part => part.value.setValue(part.config.toValue));
          this.callback?.({ finished });
        },
      };
      return animation;
    },
  };
  const nativeSheet = { measure(callback) { measurements.push(callback); } };
  const jsx = (type, props) => ({ type, props });
  const exports = {};
  vm.runInNewContext(compiled, { exports, require(name) {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react-native') return {
      Animated, View: 'View', Modal: 'Modal', Pressable: 'Pressable',
      Dimensions: { get: () => ({ height: screenHeight }) },
      useWindowDimensions: () => ({ height: windowHeight }),
      Easing: { out: value => value, cubic: 'cubic', linear: 'linear' },
      PanResponder: { create: panHandlers => ({ panHandlers }) },
      StyleSheet: { create: value => value, absoluteFillObject: {}, absoluteFill: {} },
    };
    if (name === 'react-native-safe-area-context') return { useSafeAreaInsets: () => ({ top: 44, bottom: 34 }) };
    if (name.endsWith('/colors')) return { colors: { background: { canvas: 'canvas' }, overlay: { dark: 'dark' }, neutral: { 300: 'grey' } } };
    if (name.endsWith('/card')) return { radius: { sheet: 24, full: 999 } };
    if (name.endsWith('/spacing')) return { spacing: { sm: 8, md: 16, lg: 24 } };
    throw new Error(`Unexpected dependency: ${name}`);
  } });
  function find(predicate, node) {
    if (node == null || typeof node !== 'object') return undefined;
    if (predicate(node)) return node;
    for (const child of [node.props?.children].flat(Infinity)) {
      const match = find(predicate, child);
      if (match) return match;
    }
  }
  const surface = () => find(node => typeof node.props?.onLayout === 'function', tree);
  function render(patch = {}) {
    Object.assign(props, patch);
    dirty = true;
    let passes = 0;
    while (dirty) {
      assert.ok(++passes < 20, 'layout effects settle');
      dirty = false;
      cursor = 0;
      const previousRef = surface()?.props.ref;
      tree = exports.default(props);
      const nextRef = surface()?.props.ref;
      if (previousRef && previousRef !== nextRef) previousRef.current = null;
      if (nextRef) nextRef.current = nativeSheet;
      effects.splice(0).forEach(run => run());
      if (!dirty) paints.push(surface() ? translate().value : null);
    }
    return tree;
  }
  function translate() { return surface().props.style.at(-1).transform[0].translateY; }
  render();
  return {
    animations, measurements, paints, render, surface, translate,
    get dismissed() { return dismissed; },
    get activeAnimations() { return animations.filter(animation => animation.active).length; },
    layout(height) { surface().props.onLayout({ nativeEvent: { layout: { height } } }); render(); },
    measure(index, height) { measurements[index](0, 0, 320, height); render(); },
    drag(offset, velocity) {
      const handle = find(node => node.type === 'View' && node.props.onPanResponderRelease, tree);
      handle.props.onPanResponderGrant();
      handle.props.onPanResponderMove(null, { dy: offset, dx: 0 });
      handle.props.onPanResponderRelease(null, { dy: offset, dx: 0, vy: velocity });
      render();
    },
    finish(animation = animations.at(-1), finished = true) { animation.finish(finished); render(); },
    unmount() {
      hooks.forEach(hook => hook?.cleanup?.());
      if (surface()) surface().props.ref.current = null;
      unmounted = true;
    },
  };
}

test('initial surfaces stay fully offscreen until current layout, including shorter Android windows', () => {
  for (const [windowHeight, screenHeight] of [[844, 844], [740, 820]]) {
    const h = mount({ windowHeight, screenHeight });
    assert.ok(h.paints.every(offset => offset >= screenHeight));
    assert.equal(h.animations.length, 0);
    h.layout(760);
    assert.equal(h.animations.length, 1);
    assert.equal(h.animations[0].from[1], 760);
    assert.equal(h.animations[0].parts[1].config.toValue, 0);
    assert.ok(h.animations[0].parts.every(part => part.config.useNativeDriver));
  }
});

test('fresh openings measure taller content rather than reuse the previous height', () => {
  const h = mount();
  h.layout(300);
  h.finish();
  h.render({ visible: false });
  assert.equal(h.animations.at(-1).parts[1].config.toValue, 300);
  h.finish();
  assert.equal(h.surface(), undefined);
  h.render({ visible: true, children: 'More and taller contents' });
  assert.equal(h.translate().value, 850);
  assert.equal(h.activeAnimations, 0);
  h.layout(780);
  assert.equal(h.animations.at(-1).from[1], 780);
});

test('native measurement and layout arriving together start only one entrance', () => {
  const h = mount();
  h.measure(0, 740);
  h.layout(740);
  h.measure(0, 740);
  assert.equal(h.animations.length, 1);
  assert.equal(h.activeAnimations, 1);
  assert.equal(h.animations[0].from[1], 740);
});

test('rapid reopening measures the retained native surface and rejects the cancelled exit', () => {
  const h = mount();
  h.layout(400);
  h.finish();
  h.render({ visible: false });
  const exit = h.animations.at(-1);
  h.render({ visible: true, children: 'Taller contents' });
  assert.equal(exit.stopped, true);
  assert.equal(h.translate().value, 850);
  h.measure(h.measurements.length - 1, 720);
  assert.equal(h.animations.at(-1).from[1], 720);
  assert.equal(h.activeAnimations, 1);
  h.finish(exit);
  assert.ok(h.surface());
  assert.equal(h.dismissed, 0);
  assert.equal(h.activeAnimations, 1);
});

test('late native measurements from closed openings cannot start an entrance after reopening', () => {
  const h = mount();
  const oldMeasure = h.measurements[0];
  h.render({ visible: false });
  assert.equal(h.dismissed, 1);
  assert.equal(h.surface(), undefined);
  h.render({ visible: true });
  oldMeasure(0, 0, 320, 200);
  assert.equal(h.animations.length, 0);
  assert.equal(h.translate().value, 850);
  h.layout(700);
  assert.equal(h.animations.length, 1);
  assert.equal(h.animations[0].from[1], 700);
});

test('closing before layout dismisses once and ignores delayed native measurements', () => {
  const h = mount();
  const oldMeasure = h.measurements[0];
  h.render({ visible: false });
  oldMeasure(0, 0, 320, 700);
  h.render();
  assert.equal(h.animations.length, 0);
  assert.equal(h.surface(), undefined);
  assert.equal(h.dismissed, 1);
});

test('initially closed sheets neither animate nor report a dismissal', () => {
  const h = mount({ visible: false });
  h.render();
  assert.equal(h.surface(), undefined);
  assert.equal(h.dismissed, 0);
  assert.equal(h.animations.length, 0);
  assert.equal(h.measurements.length, 0);
});

test('unmount stops animation work and rejects late native measurement and exit callbacks', () => {
  const waiting = mount();
  const measure = waiting.measurements[0];
  waiting.unmount();
  measure(0, 0, 320, 720);
  assert.equal(waiting.animations.length, 0);

  const exiting = mount();
  exiting.layout(700);
  exiting.finish();
  exiting.render({ visible: false });
  const exit = exiting.animations.at(-1);
  exiting.unmount();
  exit.finish(true);
  assert.equal(exiting.dismissed, 0);
  assert.equal(exiting.activeAnimations, 0);
  assert.ok(exit.parts.every(part => part.value.stops > 0));
});

test('ten layout and dismissal cycles keep one animation owner and release every exit', () => {
  const h = mount({ visible: false });
  for (let cycle = 0; cycle < 10; cycle++) {
    h.render({ visible: true });
    assert.equal(h.activeAnimations, 0);
    h.layout(620 + cycle * 10);
    assert.equal(h.activeAnimations, 1);
    h.layout(625 + cycle * 10);
    assert.equal(h.activeAnimations, 1, 'repeated layout does not launch another entrance');
    h.finish();
    h.render({ visible: false });
    assert.equal(h.activeAnimations, 1);
    h.finish();
    assert.equal(h.activeAnimations, 0);
    assert.equal(h.surface(), undefined);
    assert.equal(h.dismissed, cycle + 1);
  }
  assert.equal(h.animations.length, 20);
  h.unmount();
  assert.equal(h.activeAnimations, 0);
});

test('drag dismissal preserves velocity pacing and duration bounds using the current height', () => {
  for (const [offset, velocity, duration] of [[400, 2, 150], [600, 2, 120], [130, 0, 212]]) {
    const h = mount();
    h.layout(700);
    h.finish();
    h.drag(offset, velocity);
    const exit = h.animations.at(-1);
    assert.equal(exit.from[1], offset);
    assert.equal(exit.parts[1].config.toValue, 700);
    assert.equal(exit.parts[1].config.duration, duration);
    assert.equal(exit.parts[0].config.duration, duration);
    h.finish();
    assert.equal(h.dismissed, 1);
    assert.equal(h.surface(), undefined);
    assert.equal(h.activeAnimations, 0);
  }
});
