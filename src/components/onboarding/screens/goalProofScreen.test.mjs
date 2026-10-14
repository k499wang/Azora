import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./GoalProofScreen.tsx', import.meta.url), 'utf8');
const effectBody = source.match(/useEffect\(\(\) => \{([\s\S]*?)\n  \}, \[alone, aloneSquish, azora, azoraSquish, badge, reducedMotion\]\);/)[1];

function runEntrance(reducedMotion) {
  const values = Array.from({ length: 5 }, () => ({ value: 0 }));
  const cancelled = [];
  const rises = [];
  let haptics = 0;
  let timerCancelled = false;
  let timer;
  const cleanup = new Function(
    'reducedMotion', 'alone', 'aloneSquish', 'azora', 'azoraSquish', 'badge',
    'rise', 'ALONE_START_MS', 'duration', 'AZORA_START_MS', 'AZORA_RISE_MS',
    'withDelay', 'BADGE_AT_MS', 'withSpring', 'spring', 'startUiTimer',
    'triggerSuccessHaptic', 'cancelAnimation', effectBody,
  )(
    reducedMotion, ...values,
    (...args) => rises.push(args), 250, { fill: 500 }, 570, 700,
    (_delay, animation) => animation, 1330, () => 'spring', { pop: {} },
    (_delay, callback) => {
      timer = callback;
      return () => { timerCancelled = true; };
    },
    () => { haptics++; },
    (value) => cancelled.push(value),
  );
  return {
    cleanup, values, cancelled, rises,
    fireTimer() { if (!timerCancelled) timer?.(); },
    get haptics() { return haptics; },
    get timerCancelled() { return timerCancelled; },
  };
}

test('ten goal-proof entrances stop every owned animation and pending haptic on exit', () => {
  for (let cycle = 0; cycle < 10; cycle++) {
    const entrance = runEntrance(false);
    assert.equal(entrance.rises.length, 2);
    assert.equal(typeof entrance.cleanup, 'function');
    entrance.cleanup();
    assert.deepEqual(entrance.cancelled, entrance.values);
    assert.equal(entrance.timerCancelled, true);
    entrance.fireTimer();
    assert.equal(entrance.haptics, 0, 'leaving early prevents a delayed success haptic');
  }
});

test('reduced motion shows the completed goal-proof bars without scheduling an entrance', () => {
  const entrance = runEntrance(true);
  assert.equal(entrance.cleanup, undefined);
  assert.equal(entrance.rises.length, 0);
  assert.deepEqual(entrance.values.map(({ value }) => value), [1, 0, 1, 0, 1]);
  entrance.fireTimer();
  assert.equal(entrance.haptics, 0);
});
