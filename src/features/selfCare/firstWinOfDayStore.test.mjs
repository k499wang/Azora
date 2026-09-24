import assert from 'node:assert/strict';
import test from 'node:test';
import { useFirstWinOfDayStore } from './firstWinOfDayStore.ts';

test('a day’s first win is claimed once, and a failed write hands it back', () => {
  const store = useFirstWinOfDayStore.getState();
  assert.equal(store.claim('user-1:2026-09-24'), true);
  assert.equal(store.claim('user-1:2026-09-24'), false);

  store.release('user-1:2026-09-24');
  assert.equal(store.claim('user-1:2026-09-24'), true);
  assert.equal(store.claim('user-1:2026-09-25'), true);

  store.release('user-1:2026-09-24');
  assert.equal(useFirstWinOfDayStore.getState().claimedDay, 'user-1:2026-09-25');
});

test('the dev preview forces exactly one more claim', () => {
  const store = useFirstWinOfDayStore.getState();
  store.claim('user-2:2026-09-24');
  assert.equal(store.claim('user-2:2026-09-24'), false);

  store.forceNext();
  assert.equal(store.claim('user-2:2026-09-24'), true);
  assert.equal(store.claim('user-2:2026-09-24'), false);
});

test('a popup earned on a closing screen waits for it, and dismissing clears the hold', () => {
  const store = useFirstWinOfDayStore.getState();
  store.show({ heldForClose: true });
  assert.equal(useFirstWinOfDayStore.getState().showing, true);
  assert.equal(useFirstWinOfDayStore.getState().heldForClose, true);

  store.revealAfterClose();
  assert.equal(useFirstWinOfDayStore.getState().heldForClose, false);

  store.show({ heldForClose: true });
  store.dismiss();
  assert.deepEqual(
    [useFirstWinOfDayStore.getState().showing, useFirstWinOfDayStore.getState().heldForClose],
    [false, false],
  );
});
