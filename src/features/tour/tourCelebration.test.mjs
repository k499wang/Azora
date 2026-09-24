import test from 'node:test';
import assert from 'node:assert/strict';
import { tourSteps } from './tourSteps.ts';
import { useTourStore } from './tourStore.ts';
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

test('a run that hands off celebrates only when its screen was finished', async () => {
  useTourCelebrationStore.getState().clear();
  const store = useTourStore.getState();
  store.prepare();
  store.start();
  useTourStore.getState().finishByPress();
  assert.equal(useTourStore.getState().handedOff, true);
  await Promise.resolve();
  await Promise.resolve();

  // Nothing is earned by the tour ending: the celebration belongs to the lesson.
  assert.equal(useTourStore.getState().consumeCompletion(), false);
  assert.equal(useTourCelebrationStore.getState().celebrating, false);

  useTourStore.getState().endHandoff(true);
  assert.equal(useTourStore.getState().handedOff, false);
  assert.equal(useTourCelebrationStore.getState().celebrating, true);

  // Once only: a second close is not a second celebration.
  useTourCelebrationStore.getState().clear();
  useTourStore.getState().endHandoff(true);
  assert.equal(useTourCelebrationStore.getState().celebrating, false);
});

test('leaving the handed-off screen early ends the run without confetti', () => {
  useTourCelebrationStore.getState().clear();
  const store = useTourStore.getState();
  store.prepare();
  store.start();
  useTourStore.getState().finishByPress();

  useTourStore.getState().endHandoff(false);
  assert.equal(useTourStore.getState().handedOff, false);
  assert.equal(useTourCelebrationStore.getState().celebrating, false);
});

test('a lesson opened outside the tour ends nothing', () => {
  useTourCelebrationStore.getState().clear();
  useTourStore.getState().dismiss();

  useTourStore.getState().endHandoff(true);
  assert.equal(useTourCelebrationStore.getState().celebrating, false);
});
