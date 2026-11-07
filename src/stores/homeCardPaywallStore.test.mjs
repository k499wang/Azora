import assert from 'node:assert/strict';
import test from 'node:test';
import { createHomeCardPaywallStore } from './homeCardPaywallStoreCore.ts';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => { values.set(key, value); },
    removeItem: async (key) => { values.delete(key); },
  };
}

const KEY = 'paywall:home_card_pending';
const request = { userId: 'u1', name: 'Sam', goalPhrase: 'sleep better' };

test('a shown card survives a relaunch until it is cleared', async () => {
  const storage = memoryStorage();
  createHomeCardPaywallStore(storage).getState().show(request);

  const relaunched = createHomeCardPaywallStore(storage).getState;
  assert.equal(relaunched().hydrated, false);
  await relaunched().hydrate();
  assert.equal(relaunched().hydrated, true);
  assert.deepEqual(relaunched().request, request);

  relaunched().clear();
  assert.equal(relaunched().request, null);
  assert.equal(storage.values.has(KEY), false);

  const afterClear = createHomeCardPaywallStore(storage).getState;
  await afterClear().hydrate();
  assert.equal(afterClear().request, null);
});

test('the dev preview is never saved and leaves a real saved card alone', async () => {
  const storage = memoryStorage({ [KEY]: JSON.stringify(request) });
  const { getState } = createHomeCardPaywallStore(storage);
  getState().show({ ...request, preview: { pkg: {} } });
  assert.deepEqual(JSON.parse(storage.values.get(KEY)), request);
  getState().clear();
  assert.equal(storage.values.has(KEY), true);
});

test('a card shown during the read wins, and broken storage just means no card', async () => {
  const storage = memoryStorage({ [KEY]: JSON.stringify({ ...request, name: 'Old' }) });
  const { getState } = createHomeCardPaywallStore(storage);
  const reading = getState().hydrate();
  getState().show(request);
  await reading;
  assert.equal(getState().request.name, 'Sam');

  for (const broken of [
    memoryStorage({ [KEY]: 'not json' }),
    { ...memoryStorage(), getItem: async () => { throw new Error('storage'); } },
  ]) {
    const store = createHomeCardPaywallStore(broken).getState;
    await store().hydrate();
    assert.equal(store().hydrated, true);
    assert.equal(store().request, null);
  }
});
