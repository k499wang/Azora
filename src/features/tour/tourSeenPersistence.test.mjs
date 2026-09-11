import test from 'node:test';
import assert from 'node:assert/strict';
import AsyncStorage from '@react-native-async-storage/async-storage';

// The stub shipped for non-native environments has no methods at all, so the
// store's writes would silently no-op and prove nothing. Give it a real map
// before the store is imported, so what is asserted below is the whole chain:
// the store's decision, through the preference, to the write that outlives the
// launch.
const stored = new Map();
AsyncStorage.setItem = async (key, value) => {
  stored.set(key, value);
};
AsyncStorage.getItem = async (key) => stored.get(key) ?? null;

const { useTourStore } = await import('./tourStore.ts');
const { loadTourSeen, setTourSeen } = await import(
  '../../services/preferences/tourSeenPreference.ts'
);

async function startFreshTour() {
  await setTourSeen(false);
  useTourStore.getState().prepare();
  useTourStore.getState().start();
}

test('finishing the tour is what marks it seen', async () => {
  await startFreshTour();

  await useTourStore.getState().stop();

  assert.equal(await loadTourSeen(), true);
  assert.equal(useTourStore.getState().status, 'closing');
});

test('aborting an unplaceable stop leaves the tour to play again', async () => {
  // The regression this exists for: a stop that could not be measured used to
  // call `next`, and `next` past the last step calls `stop` — so one element
  // the overlay could not find marked the whole tour seen and the user never
  // got one.
  await startFreshTour();

  useTourStore.getState().abort();

  assert.equal(await loadTourSeen(), false);
  assert.equal(useTourStore.getState().status, 'closing');

  useTourStore.getState().completeClosing();
  assert.equal(useTourStore.getState().status, 'finished');
});

test('walking off the end of the tour still marks it seen', async () => {
  await startFreshTour();

  const { tourSteps } = await import('./tourSteps.ts');
  for (let index = 0; index < tourSteps.length; index += 1) {
    useTourStore.getState().next();
  }
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(await loadTourSeen(), true);
});

test('a skip from the first stop marks it seen like a finish', async () => {
  await startFreshTour();

  await useTourStore.getState().stop();

  assert.equal(await loadTourSeen(), true);
});
