import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const pact = readFileSync(new URL('./screens/PactScreen.tsx', import.meta.url), 'utf8');
const overlay = readFileSync(new URL('./CelebrationOverlay.tsx', import.meta.url), 'utf8');

function harness({ hasConfirmed = false, isSubmitting = false } = {}) {
  const events = [], timers = new Map(), cleanups = [];
  const dependencies = {
    useCallback: callback => callback,
    useRef: current => ({ current }),
    useEffect: callback => { cleanups.push(callback()); },
    stamped: true, celebrating: false,
    SEAL_HOLD_MS: 250, SEAL_FALLBACK_MS: 1000,
    startUiTimer: (delay, callback) => { timers.set(delay, callback); return () => timers.delete(delay); },
    hasConfirmed, isSubmitting,
    isHapticsEnabled: () => false,
    setHasConfirmed: value => events.push(['confirmed', value]),
    setStamped: value => events.push(['stamped', value]),
    setCelebrationFinished: value => events.push(['finished', value]),
    setCelebrating: value => events.push(['celebrating', value]),
    onConfirm: () => events.push(['save']),
  };
  const setup = pact.slice(pact.indexOf('  const cancelSealHold ='), pact.indexOf('  const promises ='));
  const callbacks = pact.slice(pact.indexOf('  const handleConfirm ='), pact.indexOf('  const handleCelebrated'));
  const javascript = ts.transpileModule(`${setup}\n${callbacks}\nreturn { handleConfirm, handleSealLand, clearCelebrationTimers };`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const handlers = new Function(...Object.keys(dependencies), javascript)(...Object.values(dependencies));
  return { ...handlers, events, timers, unmount: () => cleanups.forEach(cleanup => cleanup?.()) };
}

test('confirmation starts saving with the stamped pact still visible', () => {
  const pact = harness();
  pact.handleConfirm();
  assert.deepEqual(pact.events, [['confirmed', true], ['stamped', true], ['finished', false], ['save']]);
  pact.unmount();
});

test('the landed seal holds for 250ms before the celebration starts', () => {
  const pact = harness();
  pact.handleSealLand();
  assert.deepEqual(pact.events, []);
  assert.ok(pact.timers.has(250));
  pact.timers.get(250)();
  assert.deepEqual(pact.events, [['celebrating', true]]);
  assert.equal(pact.timers.size, 0);
});

test('a missing seal completion still starts celebration through its independent fallback', () => {
  const pact = harness();
  pact.timers.get(1000)();
  assert.deepEqual(pact.events, [['celebrating', true]]);
  assert.equal(pact.timers.size, 0);
});

test('unmount and error reset cancel both celebration timers', () => {
  for (const cleanup of ['unmount', 'clearCelebrationTimers']) {
    const pact = harness();
    pact.handleSealLand();
    assert.equal(pact.timers.size, 2);
    pact[cleanup]();
    assert.equal(pact.timers.size, 0);
  }
  assert.match(pact, /if \(errorMessage\) \{\s*clearCelebrationTimers\(\)/);
});

test('a confirmed or submitting pact does not start another save', () => {
  for (const config of [{ hasConfirmed: true }, { isSubmitting: true }]) {
    const pact = harness(config);
    pact.handleConfirm();
    assert.deepEqual(pact.events, []);
    pact.unmount();
  }
});

test('celebration preserves the backdrop fade, badge pop, check draw and title reveal', () => {
  assert.match(overlay, /backdrop\.value = withTiming\(1/);
  assert.match(overlay, /pop\.value = withDelay\(\s*POP_AT_MS/);
  assert.match(overlay, /draw\.value = withDelay\(\s*DRAW_AT_MS/);
  assert.match(overlay, /strokeDashoffset: CHECK_LENGTH \* \(1 - draw\.value\)/);
  assert.match(overlay, /<RiseUnlessReducedMotion\s+delay=\{TITLE_AT_MS\}/);
});

test('completion uses the cleanup-owned frame timer and slow saves keep an explicit status', () => {
  assert.match(overlay, /useEffect\(\(\) => startUiTimer\(FINISHED_MS, \(\) => onFinishedRef\.current\?\.\(\)\), \[\]\)/);
  assert.match(pact, /statusMessage=\{celebrationFinished \? \(isSubmitting \? 'Saving your plan…' : handoffMessage\) : undefined\}/);
  assert.match(overlay, /accessibilityLiveRegion="polite"/);
});
