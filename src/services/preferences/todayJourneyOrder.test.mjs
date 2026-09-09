import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createTodayJourneyOrderPreference,
  todayJourneyOrderKey,
} from './todayJourneyOrder.ts';

const tick = () => new Promise((resolve) => setImmediate(resolve));

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => { values.set(key, value); },
  };
}

test('keeps cached and persisted orders isolated by user', async () => {
  const storage = memoryStorage();
  const preference = createTodayJourneyOrderPreference(storage);
  await preference.save('alice', ['todo:a']);
  await preference.save('bob', ['exercise:session']);

  assert.deepEqual(preference.now('alice'), ['todo:a']);
  assert.deepEqual(preference.now('bob'), ['exercise:session']);
  assert.equal(storage.values.get(todayJourneyOrderKey('alice')), '["todo:a"]');
  assert.equal(storage.values.get(todayJourneyOrderKey('bob')), '["exercise:session"]');
});

test('deduplicates concurrent loads for one user', async () => {
  let resolveLoad;
  let reads = 0;
  const storage = {
    getItem: () => {
      reads += 1;
      return new Promise((resolve) => { resolveLoad = resolve; });
    },
    setItem: async () => {},
  };
  const preference = createTodayJourneyOrderPreference(storage);
  const first = preference.load('alice');
  const second = preference.load('alice');
  assert.equal(reads, 1);
  resolveLoad('["todo:a"]');

  assert.deepEqual(await first, ['todo:a']);
  assert.deepEqual(await second, ['todo:a']);
});

test('an old in-flight load cannot overwrite a newer save', async () => {
  let resolveLoad;
  const storage = {
    getItem: () => new Promise((resolve) => { resolveLoad = resolve; }),
    setItem: async () => {},
  };
  const preference = createTodayJourneyOrderPreference(storage);
  const load = preference.load('alice');
  await preference.save('alice', ['todo:new']);
  resolveLoad('["todo:old"]');

  assert.deepEqual(await load, ['todo:new']);
  assert.deepEqual(preference.now('alice'), ['todo:new']);
});

test('a failed stale load keeps a newer known-good in-memory save', async () => {
  let rejectLoad;
  const preference = createTodayJourneyOrderPreference({
    getItem: () => new Promise((_resolve, reject) => { rejectLoad = reject; }),
    setItem: async () => {},
  });
  const load = preference.load('alice');
  await preference.save('alice', ['todo:new']);
  rejectLoad(new Error('stale read failed'));

  assert.deepEqual(await load, ['todo:new']);
  assert.deepEqual(preference.now('alice'), ['todo:new']);
});

test('serializes writes so an older save cannot finish last', async () => {
  const starts = [];
  const resolvers = [];
  const storage = {
    getItem: async () => null,
    setItem: (key, value) => {
      starts.push({ key, value });
      return new Promise((resolve) => { resolvers.push(resolve); });
    },
  };
  const preference = createTodayJourneyOrderPreference(storage);
  const first = preference.save('alice', ['todo:first']);
  const second = preference.save('alice', ['todo:second']);
  await tick();
  assert.deepEqual(starts.map(({ value }) => value), ['["todo:first"]']);

  resolvers[0]();
  await tick();
  assert.deepEqual(starts.map(({ value }) => value), [
    '["todo:first"]',
    '["todo:second"]',
  ]);
  resolvers[1]();
  await Promise.all([first, second]);
  assert.deepEqual(preference.now('alice'), ['todo:second']);
});

test('a failed write does not block the next save', async () => {
  const written = [];
  let attempts = 0;
  const preference = createTodayJourneyOrderPreference({
    getItem: async () => null,
    setItem: async (_key, value) => {
      attempts += 1;
      if (attempts === 1) throw new Error('temporary failure');
      written.push(value);
    },
  });

  await preference.save('alice', ['todo:first']);
  await preference.save('alice', ['todo:second']);
  assert.deepEqual(written, ['["todo:second"]']);
  assert.deepEqual(preference.now('alice'), ['todo:second']);
});

test('reset stores an empty onboarding sentinel for only that user', async () => {
  const storage = memoryStorage();
  const preference = createTodayJourneyOrderPreference(storage);
  await preference.save('bob', ['todo:b']);
  await preference.resetAfterOnboarding('alice');

  assert.deepEqual(preference.now('alice'), []);
  assert.deepEqual(preference.now('bob'), ['todo:b']);
  assert.equal(storage.values.get(todayJourneyOrderKey('alice')), '[]');
});

test('a read failure preserves the accepted null fallback without writing', async () => {
  const writes = [];
  const preference = createTodayJourneyOrderPreference({
    getItem: async () => { throw new Error('unavailable'); },
    setItem: async (_key, value) => { writes.push(value); },
  });

  assert.equal(await preference.load('alice'), null);
  assert.equal(preference.now('alice'), null);
  assert.deepEqual(writes, []);
});

test('malformed storage is safely treated as a repairable missing preference', async () => {
  const malformed = createTodayJourneyOrderPreference({
    getItem: async () => '{bad json',
    setItem: async () => {},
  });
  const wrongShape = createTodayJourneyOrderPreference({
    getItem: async () => '{"todo:a":1}',
    setItem: async () => {},
  });

  assert.equal(await malformed.load('alice'), null);
  assert.equal(await wrongShape.load('alice'), null);
});
