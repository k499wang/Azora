import assert from 'node:assert/strict';
import test from 'node:test';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { cacheCreatedSelfCareGoals } from './createdSelfCareGoalsCache.ts';

const key = ['self-care-goals', 'user', '2026-09-20'];
const goal = (id, overrides = {}) => ({
  id, title: id, icon: 'sparkle', recurrence: 'daily', scheduledTime: null,
  createdAt: '2026-09-20T10:00:00Z', updatedAt: '2026-09-20T10:00:00Z',
  completedToday: false, featuredToday: false, ...overrides,
});
const ids = (client) => client.getQueryData(key)?.map((row) => row.id).sort();

test('batch merges preserve existing rows and do not duplicate rows already fetched', async () => {
  const client = new QueryClient();
  client.setQueryData(key, [goal('old'), goal('new', { completedToday: true })]);
  await cacheCreatedSelfCareGoals(client, key, [goal('new'), goal('second')]);
  await cacheCreatedSelfCareGoals(client, key, [goal('new'), goal('second')]);
  assert.deepEqual(ids(client), ['new', 'old', 'second']);
  assert.equal(client.getQueryData(key).find((row) => row.id === 'new').completedToday, true);
  client.clear();
});

test('a stale in-flight fetch cannot remove a saved batch or an intervening cache write', async () => {
  const client = new QueryClient();
  client.setQueryData(key, [goal('old')]);
  let finish;
  const read = client.fetchQuery({ queryKey: key, queryFn: () => new Promise((resolve) => { finish = resolve; }) }).catch(() => {});
  client.setQueryData(key, [goal('old'), goal('other-write')]);
  await cacheCreatedSelfCareGoals(client, key, [goal('a'), goal('b')]);
  finish([goal('old')]);
  await read;
  assert.deepEqual(ids(client), ['a', 'b', 'old', 'other-write']);
  client.clear();
});

test('concurrent batches are both retained', async () => {
  const client = new QueryClient();
  client.setQueryData(key, [goal('old')]);
  await Promise.all([
    cacheCreatedSelfCareGoals(client, key, [goal('a'), goal('b')]),
    cacheCreatedSelfCareGoals(client, key, [goal('c')]),
  ]);
  assert.deepEqual(ids(client), ['a', 'b', 'c', 'old']);
  client.clear();
});

test('an absent baseline is refetched in full instead of seeded with only the new row', async () => {
  const client = new QueryClient();
  let finish;
  let reads = 0;
  const observer = new QueryObserver(client, {
    queryKey: key,
    queryFn: () => {
      reads += 1;
      return new Promise((resolve) => { finish = resolve; });
    },
  });
  const unsubscribe = observer.subscribe(() => {});
  await cacheCreatedSelfCareGoals(client, key, [goal('new')]);
  assert.equal(client.getQueryData(key), undefined);
  assert.equal(reads, 2);
  finish([goal('old'), goal('new')]);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(ids(client), ['new', 'old']);
  unsubscribe();
  client.clear();
});

test('onboarding publishes the complete list before My Routine has ever mounted', async () => {
  const client = new QueryClient();
  await cacheCreatedSelfCareGoals(client, key, [goal('starter')], [goal('existing'), goal('starter')]);
  assert.deepEqual(ids(client), ['existing', 'starter']);
  assert.equal(client.getQueryState(key).isInvalidated, false);
  let reads = 0;
  const observer = new QueryObserver(client, {
    queryKey: key, staleTime: 60_000,
    queryFn: async () => { reads += 1; return []; },
  });
  const unsubscribe = observer.subscribe(() => {});
  assert.equal(observer.getCurrentResult().status, 'success');
  assert.equal(observer.getCurrentResult().data.length, 2);
  assert.equal(reads, 0);
  unsubscribe();
  client.clear();
});

test('onboarding replaces a cached empty list with its complete due snapshot', async () => {
  const client = new QueryClient();
  client.setQueryData(key, []);
  await cacheCreatedSelfCareGoals(
    client,
    key,
    [goal('starter')],
    [goal('existing'), goal('starter')],
  );
  assert.deepEqual(ids(client), ['existing', 'starter']);
  assert.equal(client.getQueryState(key).isInvalidated, false);
  client.clear();
});

test('an import snapshot does not undo edits made while saving', async () => {
  const client = new QueryClient();
  client.setQueryData(key, [goal('existing', { completedToday: true }), goal('another-save')]);
  await cacheCreatedSelfCareGoals(client, key, [goal('starter')], [goal('existing'), goal('starter')]);
  assert.deepEqual(ids(client), ['another-save', 'existing', 'starter']);
  assert.equal(client.getQueryData(key).find((row) => row.id === 'existing').completedToday, true);
  client.clear();
});

test('recurrence filters only the inserted rows and invalidates other dates for this user', async () => {
  const client = new QueryClient();
  const tomorrow = ['self-care-goals', 'user', '2026-09-21'];
  const otherUser = ['self-care-goals', 'someone-else', '2026-09-21'];
  for (const queryKey of [key, tomorrow, otherUser]) client.setQueryData(queryKey, [goal('old')]);
  await cacheCreatedSelfCareGoals(client, key, [goal('weekday', { recurrence: 'weekdays' }), goal('daily')]);
  assert.deepEqual(ids(client), ['daily', 'old']);
  assert.equal(client.getQueryState(key).isInvalidated, false);
  assert.equal(client.getQueryState(tomorrow).isInvalidated, true);
  assert.equal(client.getQueryState(otherUser).isInvalidated, false);
  client.clear();
});
