import test from 'node:test';
import assert from 'node:assert/strict';
import { createStackTransitions } from './stackTransitions.ts';

function createTimers() {
  const pending = new Map();
  let next = 1;
  return {
    setTimeout(run) {
      const handle = next++;
      pending.set(handle, run);
      return handle;
    },
    clearTimeout(handle) {
      pending.delete(handle);
    },
    fireAll() {
      const runs = [...pending.values()];
      pending.clear();
      runs.forEach((run) => run());
    },
    get armed() {
      return pending.size;
    },
  };
}

function createRoute(transitions, key) {
  const listeners = new Set();
  return {
    remove() {
      transitions.willRemove(key, (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      });
    },
    end(closing) {
      transitions.transitionEnded(key, closing);
      [...listeners].forEach((listener) => listener({ data: { closing } }));
    },
    get listening() {
      return listeners.size;
    },
  };
}

test('a screen closing over the app holds from removal until its close ends', () => {
  const timers = createTimers();
  const transitions = createStackTransitions(timers);
  const changes = [];
  transitions.subscribe(() => changes.push(transitions.isSettled()));
  const settings = createRoute(transitions, 'settings');

  assert.equal(transitions.isSettled(), true);
  settings.remove();
  assert.equal(transitions.isSettled(), false);
  settings.end(false);
  assert.equal(transitions.isSettled(), false, 'an opening end is not the close');
  settings.end(true);
  assert.equal(transitions.isSettled(), true);
  assert.deepEqual(changes, [false, true]);
  assert.equal(settings.listening, 0);
  assert.equal(timers.armed, 0);
});

test('a screen already off screen is removed with nothing to wait for', () => {
  const transitions = createStackTransitions(createTimers());
  const covered = createRoute(transitions, 'covered');
  covered.end(true);
  covered.remove();
  assert.equal(transitions.isSettled(), true);

  const swiped = createRoute(transitions, 'swiped');
  swiped.end(false);
  swiped.end(true);
  swiped.remove();
  assert.equal(transitions.isSettled(), true, 'a native dismissal finishes before JS removes it');
});

test('a screen that comes back on screen is waited on again', () => {
  const transitions = createStackTransitions(createTimers());
  const settings = createRoute(transitions, 'settings');
  settings.end(true);
  settings.end(false);
  settings.remove();
  assert.equal(transitions.isSettled(), false);
  settings.end(true);
  assert.equal(transitions.isSettled(), true);
});

test('several screens closing at once settle only when the last one has', () => {
  const transitions = createStackTransitions(createTimers());
  const lab = createRoute(transitions, 'lab');
  const sheet = createRoute(transitions, 'sheet');
  lab.remove();
  sheet.remove();
  lab.end(true);
  assert.equal(transitions.isSettled(), false);
  sheet.end(true);
  assert.equal(transitions.isSettled(), true);
});

test('a close whose end never arrives still settles on the shared fallback', () => {
  const timers = createTimers();
  const transitions = createStackTransitions(timers);
  const settings = createRoute(transitions, 'settings');
  settings.remove();
  assert.equal(timers.armed, 1);
  timers.fireAll();
  assert.equal(transitions.isSettled(), true);
  assert.equal(settings.listening, 0);
  settings.end(true);
  assert.equal(transitions.isSettled(), true, 'a late end cannot count twice');
});
