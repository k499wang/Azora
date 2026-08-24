import assert from 'node:assert/strict';
import test from 'node:test';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { reconcileCompletionQueries } from './completionQueryReconciliation.ts';

async function waitFor(predicate, timeoutMs = 500) {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() >= deadline) {
      throw new Error('Timed out waiting for query reconciliation');
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

test('reconciliation cancels a pre-write initial fetch before refetching', async () => {
  const queryClient = new QueryClient();
  const queryKey = ['home-stats', 'user-1', '2026-08-23'];
  let storedValue = 0;
  let releaseFirstFetch;
  let fetchCount = 0;
  const firstFetchStarted = new Promise((resolve) => {
    releaseFirstFetch = resolve;
  });
  const observer = new QueryObserver(queryClient, {
    queryKey,
    queryFn: async () => {
      const snapshot = storedValue;
      fetchCount += 1;
      if (fetchCount === 1) {
        releaseFirstFetch();
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
      return snapshot;
    },
    staleTime: 300_000,
  });
  const unsubscribe = observer.subscribe(() => {});

  await firstFetchStarted;
  storedValue = 1;

  await reconcileCompletionQueries(queryClient, [
    { queryKey: ['home-stats', 'user-1'] },
  ]);

  await waitFor(() => queryClient.getQueryData(queryKey) === 1);

  assert.equal(queryClient.getQueryData(queryKey), 1);
  assert.equal(queryClient.getQueryState(queryKey)?.isInvalidated, false);
  assert.equal(fetchCount, 2);
  unsubscribe();
});

test('reconciliation does not await the canonical background refetch', async () => {
  const queryClient = new QueryClient();
  const queryKey = ['home-stats', 'user-1', '2026-08-23'];
  let releaseRefetch;
  const refetchGate = new Promise((resolve) => {
    releaseRefetch = resolve;
  });
  const observer = new QueryObserver(queryClient, {
    queryKey,
    queryFn: async () => {
      await refetchGate;
      return 1;
    },
    initialData: 0,
    staleTime: 300_000,
  });
  const unsubscribe = observer.subscribe(() => {});

  await reconcileCompletionQueries(queryClient, [
    { queryKey: ['home-stats', 'user-1'] },
  ]);

  assert.equal(queryClient.getQueryState(queryKey)?.fetchStatus, 'fetching');
  assert.equal(queryClient.getQueryData(queryKey), 0);

  releaseRefetch();
  await waitFor(() => queryClient.getQueryData(queryKey) === 1);
  unsubscribe();
});

test('reconciliation projects only after the old request is cancelled', async () => {
  const queryClient = new QueryClient();
  const queryKey = ['completed-breathing-technique-ids', 'user-1', '2026-08-23'];
  queryClient.setQueryData(queryKey, ['box']);
  let projectedFetchStatus = 'unread';

  await reconcileCompletionQueries(
    queryClient,
    [{ queryKey, exact: true }],
    () => {
      projectedFetchStatus = queryClient.getQueryState(queryKey)?.fetchStatus;
      queryClient.setQueryData(queryKey, ['box', 'triangle']);
    },
  );

  assert.equal(projectedFetchStatus, 'idle');
  assert.deepEqual(queryClient.getQueryData(queryKey), ['box', 'triangle']);
});
