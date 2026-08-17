import test from 'node:test';
import assert from 'node:assert/strict';
import { subscribeToOpeningTransitionEnd } from './useOpeningTransitionComplete.ts';

function createTimers() {
  let pending = null;
  let nextHandle = 1;
  let clearCalls = 0;

  return {
    setTimeout(run, ms) {
      const handle = nextHandle++;
      pending = { handle, run, ms };
      return handle;
    },
    clearTimeout(handle) {
      clearCalls += 1;
      if (pending?.handle === handle) pending = null;
    },
    /** Run the armed fallback as if its delay had elapsed. */
    fire() {
      const armed = pending;
      pending = null;
      armed?.run();
    },
    get armedFor() {
      return pending?.ms ?? null;
    },
    get clearCalls() {
      return clearCalls;
    },
  };
}

function createTransitionSource() {
  let listener = null;
  let unsubscribeCalls = 0;

  return {
    subscribe(nextListener) {
      listener = nextListener;
      return () => {
        unsubscribeCalls += 1;
        listener = null;
      };
    },
    emit(closing) {
      listener?.({ data: { closing } });
    },
    get unsubscribeCalls() {
      return unsubscribeCalls;
    },
  };
}

test('ignores closing transitions and completes once after opening', () => {
  const source = createTransitionSource();
  let completionCalls = 0;

  const unsubscribe = subscribeToOpeningTransitionEnd(
    source.subscribe,
    () => {
      completionCalls += 1;
    },
  );

  source.emit(true);
  assert.equal(completionCalls, 0);

  source.emit(false);
  source.emit(false);
  assert.equal(completionCalls, 1);

  unsubscribe();
});

test('returns the navigation subscription cleanup', () => {
  const source = createTransitionSource();
  let completionCalls = 0;

  const unsubscribe = subscribeToOpeningTransitionEnd(
    source.subscribe,
    () => {
      completionCalls += 1;
    },
  );

  unsubscribe();
  assert.equal(source.unsubscribeCalls, 1);

  source.emit(false);
  assert.equal(completionCalls, 0);
});

test('completes without the event once the fallback elapses', () => {
  // The whole results screen is gated on this. A `replace` whose transition
  // lands before the effect subscribes never delivers the event at all, and a
  // loaded device delivers it late; either way the screen used to wait forever.
  const source = createTransitionSource();
  const timers = createTimers();
  let completionCalls = 0;

  subscribeToOpeningTransitionEnd(source.subscribe, () => {
    completionCalls += 1;
  }, timers);

  assert.ok(timers.armedFor > 0, 'no fallback was armed');

  timers.fire();
  assert.equal(completionCalls, 1);

  // The real event arriving afterwards must not replay the reveal.
  source.emit(false);
  assert.equal(completionCalls, 1);
});

test('the event wins the race and disarms the fallback', () => {
  const source = createTransitionSource();
  const timers = createTimers();
  let completionCalls = 0;

  subscribeToOpeningTransitionEnd(source.subscribe, () => {
    completionCalls += 1;
  }, timers);

  source.emit(false);
  assert.equal(completionCalls, 1);
  assert.equal(timers.armedFor, null, 'fallback still armed after the event');

  timers.fire();
  assert.equal(completionCalls, 1);
});

test('a closing transition does not disarm the fallback', () => {
  const source = createTransitionSource();
  const timers = createTimers();
  let completionCalls = 0;

  subscribeToOpeningTransitionEnd(source.subscribe, () => {
    completionCalls += 1;
  }, timers);

  source.emit(true);
  assert.equal(completionCalls, 0);
  assert.ok(timers.armedFor > 0, 'a closing transition cancelled the fallback');
});

test('cleanup disarms the fallback', () => {
  const source = createTransitionSource();
  const timers = createTimers();
  let completionCalls = 0;

  const unsubscribe = subscribeToOpeningTransitionEnd(source.subscribe, () => {
    completionCalls += 1;
  }, timers);

  unsubscribe();
  assert.equal(timers.armedFor, null);
  assert.equal(source.unsubscribeCalls, 1);

  timers.fire();
  assert.equal(completionCalls, 0);
});
