import test from 'node:test';
import assert from 'node:assert/strict';
import { canPresentAfterTour, useTourStore } from './tourStore.ts';

test('stopping persists before closing and waits for the overlay acknowledgement', async () => {
  const store = useTourStore.getState();
  store.prepare();
  store.start();

  const stopping = useTourStore.getState().stop();
  useTourStore.getState().next();

  assert.equal(useTourStore.getState().status, 'running');
  assert.equal(useTourStore.getState().stepIndex, 0);

  await stopping;
  assert.equal(useTourStore.getState().status, 'closing');
  assert.equal(useTourStore.getState().stepIndex, null);
  assert.equal(
    canPresentAfterTour(true, true, useTourStore.getState().status),
    false,
  );

  useTourStore.getState().completeClosing();
  assert.equal(useTourStore.getState().status, 'finished');
  assert.equal(
    canPresentAfterTour(true, true, useTourStore.getState().status),
    true,
  );
});

test('only closing can be acknowledged as finished', () => {
  useTourStore.getState().prepare();
  useTourStore.getState().completeClosing();
  assert.equal(useTourStore.getState().status, 'checking');
});

test('dismissing a previously seen tour finishes without a closing phase', () => {
  useTourStore.getState().prepare();
  useTourStore.getState().dismiss();
  assert.equal(useTourStore.getState().status, 'finished');
  assert.equal(useTourStore.getState().stepIndex, null);
});
