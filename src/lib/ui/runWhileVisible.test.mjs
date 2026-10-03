import test from 'node:test';
import assert from 'node:assert/strict';
import { runWhileVisible } from './runWhileVisible.ts';

function harness(initiallyVisible = true) {
  let visible = initiallyVisible;
  let onChange = null;
  const log = [];

  const dispose = runWhileVisible(
    () => {
      log.push('start');
      return () => log.push('stop');
    },
    {
      isVisible: () => visible,
      subscribe: (listener) => {
        onChange = listener;
        return () => {
          onChange = null;
        };
      },
    },
  );

  return {
    log,
    dispose,
    isSubscribed: () => onChange != null,
    set(next) {
      visible = next;
      onChange?.();
    },
  };
}

test('work starts only once it is visible', () => {
  const hidden = harness(false);
  assert.deepEqual(hidden.log, []);

  hidden.set(true);
  assert.deepEqual(hidden.log, ['start']);
});

test('leaving stops the work and coming back starts it again', () => {
  const screen = harness();
  screen.set(false);
  screen.set(true);
  assert.deepEqual(screen.log, ['start', 'stop', 'start']);
});

test('a repeated signal never stacks a second run', () => {
  const screen = harness();
  screen.set(true);
  screen.set(true);
  assert.deepEqual(screen.log, ['start']);
});

test('disposing stops running work and unsubscribes', () => {
  const screen = harness();
  screen.dispose();
  assert.deepEqual(screen.log, ['start', 'stop']);
  assert.equal(screen.isSubscribed(), false);
});

test('disposing while hidden stops nothing twice', () => {
  const screen = harness();
  screen.set(false);
  screen.dispose();
  assert.deepEqual(screen.log, ['start', 'stop']);
});

test('start learns whether it ran on coming into view or on setup', () => {
  let visible = true;
  let onChange = null;
  const reasons = [];
  runWhileVisible(
    (cameIntoView) => {
      reasons.push(cameIntoView);
      return () => {};
    },
    {
      isVisible: () => visible,
      subscribe: (listener) => {
        onChange = listener;
        return () => {};
      },
    },
  );

  visible = false;
  onChange();
  visible = true;
  onChange();

  assert.deepEqual(reasons, [false, true]);
});
