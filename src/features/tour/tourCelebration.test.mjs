import test from 'node:test';
import assert from 'node:assert/strict';
import { tourSteps } from './tourSteps.ts';
import { useTourStore } from './tourStore.ts';
import { useFirstSessionActivationStore } from './firstSessionActivationStore.ts';
import { useTourCelebrationStore } from './tourCelebrationStore.ts';

async function walkToTheEnd() {
  const store = useTourStore.getState();
  store.prepare();
  store.start();
  for (let i = 0; i < tourSteps.length; i += 1) {
    useTourStore.getState().next();
  }
  await Promise.resolve();
  await Promise.resolve();
}

test('walking past the last stop earns the celebration exactly once', async () => {
  await walkToTheEnd();

  assert.equal(useTourStore.getState().completed, true);
  assert.equal(useTourStore.getState().consumeCompletion(), true);
  assert.equal(useTourStore.getState().consumeCompletion(), false);
});

test('skipping, aborting and dismissing never earn it', async () => {
  const store = useTourStore.getState();
  store.prepare();
  store.start();
  await useTourStore.getState().stop();
  assert.equal(useTourStore.getState().consumeCompletion(), false);

  store.prepare();
  store.start();
  useTourStore.getState().abort();
  assert.equal(useTourStore.getState().consumeCompletion(), false);

  store.prepare();
  store.start();
  useTourStore.getState().dismiss();
  assert.equal(useTourStore.getState().consumeCompletion(), false);
});

test('the last first-session stop fires the confetti', () => {
  useTourCelebrationStore.getState().clear();
  useFirstSessionActivationStore.getState().finish();

  assert.equal(useTourCelebrationStore.getState().celebrating, true);
  useTourCelebrationStore.getState().clear();
});

test('skipping or abandoning the first-session stops does not', () => {
  useTourCelebrationStore.getState().clear();
  useFirstSessionActivationStore.getState().skip();
  assert.equal(useTourCelebrationStore.getState().celebrating, false);

  useFirstSessionActivationStore.getState().abandon();
  assert.equal(useTourCelebrationStore.getState().celebrating, false);
});
