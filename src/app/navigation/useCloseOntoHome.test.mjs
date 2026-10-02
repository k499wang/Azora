import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { returnToHome } from './returnToHome.ts';

const compiled = ts.transpileModule(
  readFileSync(new URL('./useCloseOntoHome.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

function harness() {
  let closing = false;
  let effect;
  let frame;
  let cleanup;
  const events = [];
  const exports = {};
  const navigation = {
    setOptions(options) { events.push(['options', options.animation]); },
    navigate(...args) { events.push(['navigate', ...args]); },
  };
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === 'react') return {
        useState: () => [closing, (value) => { closing = value; }],
        useEffect: (callback) => { effect = callback; },
        useCallback: (callback) => callback,
      };
      if (name === './returnToHome') return { returnToHome };
      throw new Error(`Unexpected import ${name}`);
    },
    requestAnimationFrame(callback) { frame = callback; return 1; },
    cancelAnimationFrame() { frame = null; },
  });
  return {
    events,
    render() {
      const close = exports.useCloseOntoHome(navigation);
      cleanup = effect();
      return close;
    },
    nextFrame() { const callback = frame; frame = null; callback?.(); },
    unmount() { cleanup?.(); },
  };
}

test('closing turns off the slide before returning Home on the next frame', () => {
  const flow = harness();
  flow.render()();
  assert.deepEqual(flow.events, []);
  flow.render();
  assert.deepEqual(flow.events, [['options', 'none']]);
  flow.nextFrame();
  assert.deepEqual(flow.events, [
    ['options', 'none'],
    ['navigate', 'MainTabs', { screen: 'Home' }, { pop: true }],
  ]);
});

test('unmount cancels a queued return rather than navigating from a closed screen', () => {
  const flow = harness();
  flow.render()();
  flow.render();
  flow.unmount();
  flow.nextFrame();
  assert.deepEqual(flow.events, [['options', 'none']]);
});

test('ten separate completions each disable sliding and return to the existing Home', () => {
  for (let cycle = 0; cycle < 10; cycle += 1) {
    const flow = harness();
    flow.render()();
    flow.render();
    flow.nextFrame();
    assert.equal(flow.events.length, 2);
    assert.equal(flow.events[0][1], 'none');
    assert.deepEqual(flow.events[1], ['navigate', 'MainTabs', { screen: 'Home' }, { pop: true }]);
  }
});
