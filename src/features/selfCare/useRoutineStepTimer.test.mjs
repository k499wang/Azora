import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup() {
  const hooks = [];
  const effects = [];
  const visibleOwners = new Set();
  const timers = new Map();
  let cursor = 0;
  let now = 0;
  let visible = true;
  let id = 0;
  const useRef = (value) => {
    const at = cursor++;
    return hooks[at] ??= { current: value };
  };
  const useState = (value) => {
    const at = cursor++;
    if (!(at in hooks)) hooks[at] = typeof value === 'function' ? value() : value;
    return [hooks[at], (next) => { hooks[at] = typeof next === 'function' ? next(hooks[at]) : next; }];
  };
  const useEffect = (callback, deps) => {
    const at = cursor++;
    if (hooks[at] && deps?.every((value, i) => Object.is(value, hooks[at].deps?.[i]))) return;
    effects.push(() => {
      hooks[at]?.cleanup?.();
      hooks[at] = { deps, cleanup: callback() };
    });
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(
    readFileSync(new URL('./useRoutineStepTimer.ts', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText, {
    exports, Date: { now: () => now },
    require(name) {
      if (name === 'react') return { useRef, useState, useEffect };
      if (name === 'react-native-reanimated') return {
        useSharedValue: (value) => useRef({ value }).current,
        cancelAnimation() {}, withTiming: (value) => value,
        withSequence: (...values) => values.at(-1),
        Easing: { linear: 'linear' }, ReduceMotion: { Never: 'never' },
      };
      if (name.endsWith('motion')) return { duration: { base: 200 } };
      if (name.endsWith('uiThreadTimer')) return {
        startUiTimer(delay, callback) {
          const key = ++id;
          timers.set(key, { at: now + delay, callback });
          return () => timers.delete(key);
        },
      };
      if (name.endsWith('useWhileVisible')) return {
        useWhileVisible(start, deps) {
          useEffect(() => {
            const owner = { start, stop: visible ? start(false) : null };
            visibleOwners.add(owner);
            return () => { owner.stop?.(); visibleOwners.delete(owner); };
          }, deps);
        },
      };
      throw new Error(name);
    },
  });
  return {
    render(options) {
      cursor = 0;
      const value = exports.useRoutineStepTimer(options);
      while (effects.length) effects.shift()();
      return value;
    },
    advance(ms) {
      const target = now + ms;
      while (true) {
        const entry = [...timers].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
        if (!entry) break;
        timers.delete(entry[0]);
        now = entry[1].at;
        entry[1].callback();
      }
      now = target;
    },
    hide() { visible = false; for (const owner of visibleOwners) { owner.stop?.(); owner.stop = null; } },
    show() { visible = true; for (const owner of visibleOwners) owner.stop = owner.start(true); },
    unmount() { for (const hook of hooks) hook?.cleanup?.(); },
    timers,
  };
}

const defaults = { active: true, paused: false, durationMs: 60_000, stepKey: 'one', onElapsed() {} };

test('focus starts paused, then preserves elapsed time through pause and duration changes', () => {
  const h = setup();
  let options = { ...defaults, paused: true };
  assert.equal(h.render(options).seconds, 60);
  h.advance(20_000);
  assert.equal(h.timers.size, 0);
  options = { ...options, paused: false };
  h.render(options);
  h.advance(10_000);
  assert.equal(h.render(options).seconds, 50);
  options = { ...options, paused: true };
  h.render(options);
  assert.equal(h.timers.size, 0);
  h.advance(15_000);
  options = { ...options, durationMs: 120_000 };
  assert.equal(h.render(options).seconds, 110);
  options = { ...options, paused: false };
  h.render(options);
  h.advance(5_000);
  assert.equal(h.render(options).seconds, 105);
  h.unmount();
  assert.equal(h.timers.size, 0);
});

test('hidden timers release ticking work and catch up once when returning after the deadline', () => {
  const h = setup();
  let elapsed = 0;
  const options = { ...defaults, onElapsed: () => elapsed++ };
  h.render(options);
  h.advance(10_000);
  h.hide();
  assert.equal(h.timers.size, 0);
  h.advance(70_000);
  assert.equal(elapsed, 0);
  h.show();
  assert.equal(h.render(options).seconds, 0);
  assert.equal(elapsed, 1);
  h.hide();
  h.advance(5_000);
  h.show();
  assert.equal(elapsed, 1);
  h.unmount();
});

test('step changes reset elapsed time and extending an elapsed timer creates one new deadline', () => {
  const h = setup();
  let elapsed = 0;
  let options = { ...defaults, onElapsed: () => elapsed++ };
  h.render(options);
  h.advance(60_000);
  assert.equal(elapsed, 1);
  options = { ...options, durationMs: 120_000 };
  h.render(options);
  h.advance(60_000);
  assert.equal(elapsed, 2);
  options = { ...options, stepKey: 'two', durationMs: 30_000 };
  h.render(options);
  assert.equal(h.render(options).seconds, 30);
  h.advance(30_000);
  assert.equal(elapsed, 3);
  h.unmount();
  assert.equal(h.timers.size, 0);
});

test('ten enter and leave cycles keep at most one timer and clean it up', () => {
  const h = setup();
  for (let i = 0; i < 10; i++) {
    h.render({ ...defaults, stepKey: `session-${i}` });
    assert.equal(h.timers.size, 1);
    h.hide();
    assert.equal(h.timers.size, 0);
    h.advance(1_000);
    h.show();
    assert.equal(h.timers.size, 1);
  }
  h.unmount();
  assert.equal(h.timers.size, 0);
});
