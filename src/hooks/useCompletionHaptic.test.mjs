import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(
  readFileSync(new URL('./useCompletionHaptic.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

function mount() {
  const calls = [];
  const played = { current: false };
  let focused = true;
  const appState = { currentState: 'active' };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === 'react') return {
        useRef: () => played,
        useEffect: (effect) => effect(),
      };
      if (name === '@react-navigation/native') return { useIsFocused: () => focused };
      if (name === 'react-native') return { AppState: appState };
      if (name === '../native/tapHaptics') return {
        triggerActivityCompleteHaptic: () => calls.push('activity'),
        triggerBreathingCompleteHaptic: () => calls.push('breathing'),
      };
      throw new Error(`Unexpected module: ${name}`);
    },
  });
  return {
    calls,
    render: (kind, active) => exports.useCompletionHaptic(kind, active),
    setFocused: (value) => { focused = value; },
    setAppState: (value) => { appState.currentState = value; },
  };
}

test('completion feedback waits for opening and plays once across rerenders and refocus', () => {
  const hook = mount();
  hook.render('activity', false);
  assert.deepEqual(hook.calls, []);
  hook.render('activity', true);
  hook.render('activity', true);
  hook.setFocused(false);
  hook.render('activity', true);
  hook.setFocused(true);
  hook.render('activity', true);
  assert.deepEqual(hook.calls, ['activity']);
});

test('an unfocused result cannot deliver a completion tap', () => {
  const hook = mount();
  hook.setFocused(false);
  hook.render('breathing', true);
  assert.deepEqual(hook.calls, []);
  hook.setFocused(true);
  hook.render('breathing', true);
  assert.deepEqual(hook.calls, ['breathing']);
});

test('background and inactive renders do not deliver feedback', () => {
  const hook = mount();
  for (const state of ['inactive', 'background']) {
    hook.setAppState(state);
    hook.render('activity', true);
  }
  assert.deepEqual(hook.calls, []);
});

test('a new result owns a fresh completion tap', () => {
  for (let cycle = 0; cycle < 10; cycle++) {
    const hook = mount();
    hook.render('breathing', true);
    hook.render('breathing', true);
    assert.deepEqual(hook.calls, ['breathing']);
  }
});
