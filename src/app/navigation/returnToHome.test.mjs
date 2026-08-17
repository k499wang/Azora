import assert from 'node:assert/strict';
import test from 'node:test';
import { returnToHome } from './returnToHome.ts';

test('returns to the existing Home route with stack-pop semantics', () => {
  const calls = [];
  const navigation = {
    navigate(...args) {
      calls.push(args);
    },
  };

  returnToHome(navigation);

  assert.deepEqual(calls, [
    ['MainTabs', { screen: 'Home' }, { pop: true }],
  ]);
});
