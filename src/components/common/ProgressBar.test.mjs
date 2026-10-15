import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup() {
  const slots = [];
  const pending = new Map();
  let cursor = 0;
  let effects = [];
  const react = {
    useEffect(effect, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || deps.some((value, i) => value !== previous.deps[i])) {
        effects.push(() => {
          previous?.cleanup?.();
          slots[index] = { deps, cleanup: effect() };
        });
      }
    },
  };
  const reanimated = {
    default: { View: 'AnimatedView' },
    useReducedMotion: () => false,
    useSharedValue(initial) {
      const index = cursor++;
      if (!slots[index]) {
        let current = initial;
        const shared = {
          get value() { return current; },
          set value(value) {
            if (typeof value === 'object') {
              if (value.start != null) current = value.start;
              pending.set(shared, value);
            }
            else current = value;
          },
        };
        slots[index] = shared;
      }
      return slots[index];
    },
    useAnimatedStyle: (create) => create,
    withTiming: (target, _config, callback) => ({ target, callback }),
    withDelay: (_delay, animation) => animation,
    cancelAnimation: (shared) => pending.delete(shared),
    runOnJS: (callback) => callback,
  };
  const jsx = (type, props) => ({ type, props });
  const exports = {};
  const source = readFileSync(new URL('./ProgressBar.tsx', import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    exports,
    require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'react-native-reanimated') return reanimated;
      if (name === 'react-native') return {
        View: 'View',
        StyleSheet: { create: (styles) => styles, absoluteFillObject: {} },
      };
      if (name.endsWith('/colors')) return { colors: { primary: {}, neutral: {} } };
      if (name.endsWith('/motion')) return { duration: { fill: 900 }, easing: {}, emphasis: {} };
      if (name.endsWith('/usePopOnChange')) return { popAnimation: () => ({ start: 1.22, target: 1 }) };
      return {};
    },
  });
  return {
    render(progress, extraProps = {}) {
      cursor = 0;
      const tree = exports.default({ progress, ...extraProps });
      effects.forEach((effect) => effect());
      effects = [];
      return tree;
    },
    finishAnimations() {
      for (const [shared, animation] of [...pending]) {
        pending.delete(shared);
        shared.value = animation.target;
        animation.callback?.(true);
      }
    },
    unmount() { slots.forEach((slot) => slot?.cleanup?.()); },
    fraction: () => slots[0].value,
    bump: () => slots[1].value,
    pendingCount: () => pending.size,
  };
}

test('restoring completed progress cancels a delayed stale lower count', () => {
  const bar = setup();
  bar.render(1);

  for (let cycle = 0; cycle < 5; cycle++) {
    bar.render(2 / 3);
    assert.equal(bar.pendingCount(), 1);
    bar.render(1);
    bar.finishAnimations();
    assert.equal(bar.fraction(), 1, '3/3 stays full after an intermediate refresh');
  }
});

test('a refresh during the landing bump restores the track height', () => {
  const bar = setup();
  bar.render(2 / 3);
  bar.render(1);
  bar.finishAnimations();
  assert.equal(bar.bump(), 1.22, 'the landing bump is still in flight');

  bar.render(2 / 3);
  bar.render(1);
  bar.finishAnimations();
  assert.equal(bar.fraction(), 1);
  assert.equal(bar.bump(), 1, 'interrupting the landing cannot leave the track stretched');
});

test('the last activity fills the bar and unmount cancels unfinished animation', () => {
  const bar = setup();
  let filled = 0;
  bar.render(2 / 3);
  bar.render(1, { onFillEnd: () => { filled++; } });
  bar.finishAnimations();
  assert.equal(bar.fraction(), 1);
  assert.equal(filled, 1);

  bar.render(2 / 3);
  bar.unmount();
  bar.finishAnimations();
  assert.equal(bar.pendingCount(), 0);
  assert.equal(bar.fraction(), 1);
  assert.equal(filled, 1);
});
