import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup({ enterAt = 0, sparkleRing = false } = {}) {
  const styles = [];
  const values = [];
  const effects = [];
  const cleanup = [];
  const timers = [];
  const identity = (value) => value;
  const dependencies = {
    Children: {}, View: 'View', Text: 'Text',
    StyleSheet: { create: identity, absoluteFillObject: {} },
    Easing: { out: identity, in: identity, inOut: identity, quad: identity, cubic: identity, back: () => identity, linear: identity },
    useState: (value) => [value, () => {}],
    useEffect: (effect) => effects.push(effect),
    useSharedValue: (value) => {
      const state = { value, initial: value };
      values.push(state);
      return state;
    },
    useDerivedValue: (create) => ({ get value() { return create(); } }),
    useAnimatedStyle: (create) => { styles.push(create); return {}; },
    withDelay: (delay, animation) => ({ delay, animation }),
    withTiming: (to, options) => ({ to, duration: options.duration }),
    cancelAnimation() {},
    startUiTimer: (_ms, callback) => { timers.push(callback); return () => {}; },
    triggerLightHaptic() {}, useStatCardPopSound() {},
    colors: { reward: {}, playful: { amber: {}, sky: {} }, text: {}, background: {} },
    card: {}, radius: {}, spacing: {}, fonts: {}, typography: { label: {}, title: {} },
  };
  const jsx = (type, props) => ({ type, props });
  const exports = {};
  const source = readFileSync(new URL('./HeaderStripStatCard.tsx', import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source + '\nexport { EnteringStatCard };', {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    exports,
    require(name) {
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      return { ...dependencies, default: name === 'react-native-reanimated' ? { View: 'AnimatedView' } : name };
    },
  });
  exports.EnteringStatCard({ label: 'Coins', value: '10', finalValue: '10', formatCount: String, tone: 'amber', enterAt, sparkleRing });
  for (const effect of effects) cleanup.push(effect());
  const clock = values.find((value) => value.initial < 0);
  const scheduled = clock.value;
  // The card uses a linear clock. Advance that same clock to the requested frame.
  const bodyOpacityAt = (elapsedMs) => {
    const progress = Math.max(0, Math.min(1, (elapsedMs - scheduled.delay) / scheduled.animation.duration));
    clock.value = clock.initial + (scheduled.animation.to - clock.initial) * progress;
    return styles.at(-1)().opacity;
  };
  return { bodyOpacityAt, cleanup: () => cleanup.forEach((cancel) => cancel?.()) };
}

test('a claim card without a sparkle prelude is visible on its first animation frame', () => {
  const card = setup();
  assert.equal(card.bodyOpacityAt(0), 0);
  assert.equal(card.bodyOpacityAt(16), 1);
  card.cleanup();
});

test('a sparkle prelude at zero delay would hold the card hidden for half a second', () => {
  const card = setup({ sparkleRing: true });
  assert.equal(card.bodyOpacityAt(16), 0);
  assert.equal(card.bodyOpacityAt(480), 0);
  assert.equal(card.bodyOpacityAt(500), 1);
  card.cleanup();
});

test('other result cards retain their scheduled sparkle prelude and entrance', () => {
  const card = setup({ enterAt: 990, sparkleRing: true });
  assert.equal(card.bodyOpacityAt(500), 0);
  assert.equal(card.bodyOpacityAt(980), 0);
  assert.equal(card.bodyOpacityAt(1006), 1);
  card.cleanup();
});
