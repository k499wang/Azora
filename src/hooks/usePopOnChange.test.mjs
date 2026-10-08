import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(
  readFileSync(new URL('./usePopOnChange.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

function setup() {
  const hooks = [];
  const effects = [];
  const cancellations = [];
  let cursor = 0;
  let reducedMotion = false;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === 'react') return {
        useRef(initial) {
          const index = cursor++;
          return hooks[index] ??= { current: initial };
        },
        useEffect(callback, deps) {
          const index = cursor++;
          const previous = hooks[index];
          if (previous?.deps.every((dep, i) => Object.is(dep, deps[i]))) return;
          hooks[index] = { deps };
          effects.push(() => {
            previous?.cleanup?.();
            hooks[index].cleanup = callback();
          });
        },
      };
      if (name === 'react-native-reanimated') return {
        useReducedMotion: () => reducedMotion,
        useSharedValue(initial) {
          const index = cursor++;
          return hooks[index] ??= { value: initial };
        },
        cancelAnimation: (scale) => cancellations.push(scale),
        withTiming: (to, config) => ({ kind: 'timing', to, config }),
        withSpring: (to, config) => ({ kind: 'spring', to, config }),
        withSequence: (...steps) => ({ steps }),
      };
      if (name.endsWith('/motion')) return {
        duration: { fast: 180 },
        easing: { enter: 'enter' },
        spring: { bounce: { damping: 8, stiffness: 190, mass: 0.7 } },
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return {
    popAnimation: exports.popAnimation,
    cancellations,
    render(trigger, options) {
      cursor = 0;
      const scale = exports.usePopOnChange(trigger, 1.04, options);
      effects.splice(0).forEach((run) => run());
      return scale;
    },
    setReducedMotion(value) { reducedMotion = value; },
    unmount() { hooks.forEach((hook) => hook?.cleanup?.()); },
  };
}

test('answer feedback pops to its peak and springs back with the original rebound', () => {
  const { steps } = setup().popAnimation(1.04);
  assert.equal(steps.length, 2);
  assert.equal(steps[0].kind, 'timing');
  assert.equal(steps[0].to, 1.04);
  assert.equal(steps[0].config.duration, 90);
  assert.equal(steps[0].config.easing, 'enter');
  assert.equal(steps[1].kind, 'spring');
  assert.equal(steps[1].to, 1);
  assert.equal(steps[1].config.damping, 8);
  assert.equal(steps[1].config.stiffness, 190);
  assert.equal(steps[1].config.mass, 0.7);
});

test('selection rerenders preserve the active pop and rapid presses replace it', () => {
  const harness = setup();
  const scale = harness.render(0);
  assert.equal(scale.value, 1);
  for (let press = 1; press <= 10; press += 1) {
    harness.render(press);
    const active = scale.value;
    harness.render(press);
    assert.equal(scale.value, active);
    assert.equal(harness.cancellations.length, press);
    assert.equal(harness.cancellations.at(-1), scale);
  }
  harness.unmount();
  assert.equal(harness.cancellations.length, 11);
});

test('deselection and reduced motion cancel feedback and restore rest', () => {
  const harness = setup();
  const scale = harness.render(false, { enabled: false });
  harness.render(true, { enabled: true });
  assert.equal(typeof scale.value, 'object');
  harness.render(false, { enabled: false });
  assert.equal(scale.value, 1);
  harness.render(true, { enabled: true });
  harness.setReducedMotion(true);
  harness.render(true, { enabled: true });
  assert.equal(scale.value, 1);
  assert.equal(harness.cancellations.at(-1), scale);
});
