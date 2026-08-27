import test from 'node:test';
import assert from 'node:assert/strict';
import { canPresentAfterTour, useTourStore } from './tourStore.ts';

function canPresent(hasResolvedSeenFlag) {
  return canPresentAfterTour(
    true,
    hasResolvedSeenFlag,
    useTourStore.getState().status,
  );
}

test('a fresh seen-flag read blocks stale finished state', async () => {
  useTourStore.getState().dismiss();
  let hasResolvedSeenFlag = false;
  let resolveSeenFlag;
  const delayedSeenFlag = new Promise((resolve) => {
    resolveSeenFlag = resolve;
  });

  const checking = delayedSeenFlag.then((seen) => {
    if (seen) useTourStore.getState().dismiss();
    else useTourStore.getState().start();
    hasResolvedSeenFlag = true;
  });

  assert.equal(useTourStore.getState().status, 'finished');
  assert.equal(canPresent(hasResolvedSeenFlag), false);

  resolveSeenFlag(false);
  await checking;

  assert.equal(useTourStore.getState().status, 'running');
  assert.equal(canPresent(hasResolvedSeenFlag), false);
});

test('a returning user is released after the fresh read confirms seen', () => {
  useTourStore.getState().dismiss();

  assert.equal(canPresent(false), false);
  assert.equal(canPresent(true), true);
});

test('disabled tour ownership never releases presenters', () => {
  useTourStore.getState().dismiss();
  assert.equal(canPresentAfterTour(false, true, 'finished'), false);
});
