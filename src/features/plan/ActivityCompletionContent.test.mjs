import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup(file, extraExports = '', reducedMotion = false) {
  const slots = [];
  let cursor = 0;
  let effects = [];
  const ready = [];
  const timings = [];
  const jsx = (type, props) => ({ type, props });
  const changed = (slot, deps) => !slot || deps.some((value, index) => value !== slot.deps[index]);
  const react = {
    useState(initial) {
      const index = cursor++;
      slots[index] ??= { value: initial };
      return [slots[index].value, (value) => { slots[index].value = value; }];
    },
    useMemo(create, deps) {
      const index = cursor++;
      if (changed(slots[index], deps)) slots[index] = { value: create(), deps };
      return slots[index].value;
    },
    useCallback(callback, deps) { return react.useMemo(() => callback, deps); },
    useEffect(effect, deps) {
      const index = cursor++;
      if (changed(slots[index], deps)) effects.push({ index, effect, deps });
    },
  };
  const dependencies = {
    View: 'View', Image: 'Image', Text: 'Text', Pop: 'Pop', LoopingTwinkle: 'Twinkle',
    RiseUnlessReducedMotion: 'Rise',
    StyleSheet: { create: (value) => value, absoluteFill: {} },
    useWindowDimensions: () => ({ width: 390, height: 844 }),
    useReducedMotion: () => reducedMotion,
    useSharedValue: (value) => react.useMemo(() => ({ value }), []),
    useAnimatedStyle: (create) => create(),
    useWhileVisible: react.useEffect,
    useAnimatedImagePlayback: () => ({ ref() {}, onLoad() {} }),
    cancelAnimation() {},
    withTiming: (value) => { timings.push(value); return value; },
    withDelay: (_delay, value) => value,
    withRepeat: (value) => value,
    Easing: { linear() {} },
    Skia: { Path: { Make: () => ({ moveTo() {}, lineTo() {}, close() {} }) } },
    vec: (x, y) => ({ x, y }),
    colors: { text: {}, reward: {}, playful: { sky: {} }, celebrationGlow: {} },
    spacing: {}, padding: { screen: {} }, typography: { title: {}, body: {} },
    duration: { slower: 500 }, easing: {}, stagger: { base: 80 },
    REWARD_BEAT: { hero: 60, title: 280, subtitle: 380 },
    rewardHeroWidth: () => 260,
    ANIMATED_KOALA: { proud: 1, excited: 2 },
  };
  const exports = {};
  const source = readFileSync(new URL(file, import.meta.url), 'utf8') + extraExports;
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      return { ...dependencies, default: name === 'react-native-reanimated' ? { View: 'AnimatedView' } : name };
    },
  });
  return {
    ready, timings,
    render(props, component = exports.default) {
      cursor = 0;
      const tree = component(props);
      for (const { index, effect, deps } of effects) {
        slots[index]?.cleanup?.();
        slots[index] = { deps, cleanup: effect() };
      }
      effects = [];
      return tree;
    },
    hero: exports.HeroArt,
  };
}

test('claim entrance waits for Azo, then uses the shared exercise reveal timings', () => {
  const harness = setup('./ActivityCompletionContent.tsx');
  let notified = 0;
  const props = { title: 'Small win', subtitle: 'Habit finished', pose: 'proud', onReady: () => { notified++; } };
  let tree = harness.render(props);
  const [hero, title, subtitle] = tree.props.children;
  assert.equal(hero.props.delay, 60);
  assert.equal(title.props.when, false);
  assert.equal(subtitle.props.when, false);
  hero.props.onReady();
  assert.equal(notified, 1, 'the owning screen can start its reward at the same time');
  tree = harness.render(props);
  for (const text of tree.props.children.slice(1, 3)) {
    assert.equal(text.props.when, true);
  }
  assert.deepEqual(Array.from(tree.props.children).slice(0, 3).map((child) => child.props.delay), [60, 280, 380]);
  const confirmed = harness.render({ ...props, title: 'Small win', subtitle: 'Saved' });
  assert.equal(confirmed.props.children[0].type, hero.type);
  assert.equal(confirmed.props.children[1].props.when, true, 'confirmation keeps the existing entrance active');
});

test('other result screens retain their existing staggered entrance', () => {
  const tree = setup('./ActivityCompletionContent.tsx').render({ title: 'Win', subtitle: 'Saved' });
  assert.deepEqual(Array.from(tree.props.children).slice(0, 3).map((child) => child.props.delay), [60, 280, 380]);
  assert.equal(tree.props.children[0].props.onReady, undefined);
  assert.equal(tree.props.children[1].props.when, true);
});

test('reduced-motion text stays hidden until the character is ready, then appears without motion', () => {
  const harness = setup('./ActivityCompletionContent.tsx', '', true);
  const props = { title: 'Win', subtitle: 'Habit finished', pose: 'proud', onReady() {} };
  const waiting = harness.render(props);
  assert.equal(waiting.props.children[1].props.reducedMotion, true);
  assert.equal(waiting.props.children[1].props.style.opacity, 0);
  waiting.props.children[0].props.onReady();
  const ready = harness.render(props);
  assert.equal(ready.props.children[1].props.style, undefined);
  assert.equal(ready.props.children[1].props.reducedMotion, true);
});

for (const loadEvent of ['onLoad', 'onError']) {
  test(`the hero waits for image ${loadEvent} before starting its entrance and loops`, () => {
    const harness = setup('./ActivityRewardHero.tsx', '\nexport { HeroArt };');
    const props = { width: 260, pose: 'proud', delay: 0, reducedMotion: false, onReady: () => harness.ready.push(true) };
    let tree = harness.render(props, harness.hero);
    assert.equal(tree.props.children[1].props.when, false);
    assert.equal(harness.timings.length, 0);
    assert.equal(harness.ready.length, 0);
    const image = tree.props.children[1].props.children;
    image.props[loadEvent]();
    tree = harness.render(props, harness.hero);
    assert.equal(tree.props.children[1].props.when, true);
    assert.equal(harness.timings.length, 3);
    assert.equal(harness.ready.length, 1);
    harness.render(props, harness.hero);
    assert.equal(harness.timings.length, 3, 'rerender does not restart the loops');
    assert.equal(harness.ready.length, 1);
    if (loadEvent === 'onError') assert.notEqual(tree.props.children[1].props.children.type, 'Image');
  });
}

test('reduced motion loads the image without starting any hero loops', () => {
  const harness = setup('./ActivityRewardHero.tsx', '\nexport { HeroArt };');
  const props = { width: 260, pose: 'proud', delay: 0, reducedMotion: true, onReady: () => harness.ready.push(true) };
  const tree = harness.render(props, harness.hero);
  tree.props.children[1].props.onLoad();
  harness.render(props, harness.hero);
  assert.equal(harness.ready.length, 1);
  assert.equal(harness.timings.length, 0);
});
