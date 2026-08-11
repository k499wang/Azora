import test from 'node:test';
import assert from 'node:assert/strict';
import { subscribeToOpeningTransitionEnd } from './useOpeningTransitionComplete.ts';

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
