import type { QueryClient, QueryFilters } from '@tanstack/react-query';

/**
 * Reconcile queries after a completion RPC has committed.
 *
 * Cancelling first matters for a query's initial fetch: TanStack Query cannot
 * restart that fetch from `invalidateQueries` while it has no cached data, so
 * an older pre-write response can otherwise win and be marked fresh. Refetches
 * remain background work; they must not extend a user-visible mutation's
 * pending state after its canonical write and safe projection have completed.
 */
export async function reconcileCompletionQueries(
  queryClient: QueryClient,
  filters: readonly QueryFilters[],
  project?: () => void,
): Promise<void> {
  await Promise.all(
    filters.map((queryFilters) => queryClient.cancelQueries(queryFilters)),
  );

  project?.();

  void Promise.all(
    filters.map((queryFilters) => queryClient.invalidateQueries(queryFilters)),
  ).catch(() => {
    // Individual queries retain their error state and last good data. A
    // background refresh failure must not turn a committed mutation into an
    // unhandled rejection.
  });
}
