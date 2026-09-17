import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { isOnScreen } from './tourGeometry.ts';

// Exercise the actual placement hook with controlled native measurements and
// time. No renderer or native bridge is needed for this lifecycle.
function placementHarness(measure, reducedMotion = false) {
  let effect;
  let rect = null;
  let abandoned = 0;
  let now = 0;
  let nextId = 0;
  const timers = new Map();
  const options = [];
  let onMove;
  const source = readFileSync(new URL('./FirstSessionActivationOverlay.tsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(`${source}\nexport { useStopPlacement };`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    AbortController,
    setTimeout: (fn, ms) => {
      const id = ++nextId;
      timers.set(id, { fn, at: now + ms });
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
    require: (name) => {
      if (name === 'react') return {
        useState: () => [null, (value) => { rect = value; }],
        useLayoutEffect: (fn) => { effect = fn; },
      };
      if (name === 'react-native') return {
        useWindowDimensions: () => ({ width: 390, height: 844 }),
        StyleSheet: { create: (styles) => styles },
      };
      if (name === 'react-native-safe-area-context') return {
        useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
      };
      if (name === 'react-native-reanimated') return { useReducedMotion: () => reducedMotion };
      if (name === './tourGeometry') return { isOnScreen };
      if (name === './tourTargets') return {
        measureTourTarget: async (_, opts) => { options.push(opts); return measure(); },
        trackTourTarget: (_, __, callback) => { onMove = callback; return () => {}; },
      };
      if (name === './firstSessionActivationStore') return {
        useFirstSessionActivationStore: { getState: () => ({ abandon: () => { abandoned += 1; } }) },
      };
      return { spacing: {} };
    },
  });
  exports.useStopPlacement({ target: 'firstDailyPlay' });
  const cleanup = effect();
  const flush = async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); };
  return {
    cleanup, options,
    move: (value) => onMove(value),
    rect: () => rect,
    abandoned: () => abandoned,
    async advance(ms) {
      await flush();
      const end = now + ms;
      for (;;) {
        const next = [...timers.entries()].sort((a, b) => a[1].at - b[1].at)[0];
        if (!next || next[1].at > end) break;
        now = next[1].at;
        timers.delete(next[0]);
        next[1].fn();
        await flush();
      }
      now = end;
      await flush();
    },
  };
}

test('missing and off-screen controls give up after 20 seconds despite retries', async () => {
  for (const rect of [null, { x: 0, y: 1000, width: 100, height: 60 }]) {
    const run = placementHarness(() => rect);
    await run.advance(19999);
    assert.equal(run.abandoned(), 0);
    assert.equal(run.rect(), null);
    await run.advance(1);
    assert.equal(run.abandoned(), 1);
    const calls = run.options.length;
    await run.advance(20000);
    assert.equal(run.options.length, calls);
    run.cleanup();
  }
});

test('losing a placed target starts a fresh bounded recovery window', async () => {
  const rect = { x: 20, y: 200, width: 100, height: 60 };
  let measured = rect;
  const run = placementHarness(() => measured, true);
  await run.advance(30000);
  assert.equal(run.abandoned(), 0);
  assert.deepEqual(run.rect(), rect);
  assert.equal(run.options[0].animated, false);
  measured = null;
  run.move({ ...rect, y: 1000 });
  await run.advance(20000);
  assert.equal(run.abandoned(), 1);
  run.cleanup();
});

test('cleanup cancels placement and ignores a late measurement', async () => {
  let resolve;
  const run = placementHarness(() => new Promise((done) => { resolve = done; }));
  run.cleanup();
  assert.equal(run.options[0].signal.aborted, true);
  resolve({ x: 20, y: 200, width: 100, height: 60 });
  await run.advance(30000);
  assert.equal(run.rect(), null);
  assert.equal(run.abandoned(), 0);
});
