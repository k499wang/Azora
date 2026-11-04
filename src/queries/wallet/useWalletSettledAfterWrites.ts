import { useEffect, useState } from 'react';
import { useIsMutating, useQueryClient, type MutationKey } from '@tanstack/react-query';
import { getWalletQueryKey } from './useWalletQuery';

/**
 * True once the writes under `mutationKey` have landed and the balance has been
 * read again, so an earned count never starts from a balance missing its coins.
 */
export function useWalletSettledAfterWrites(userId: string | null, mutationKey: MutationKey): boolean {
  const queryClient = useQueryClient();
  const writing = useIsMutating({ mutationKey }) > 0;
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (writing || settled) return;
    let live = true;
    queryClient
      .refetchQueries({ queryKey: getWalletQueryKey(userId), exact: true })
      .finally(() => {
        if (live) setSettled(true);
      });
    return () => {
      live = false;
    };
  }, [writing, settled, queryClient, userId]);
  return settled;
}
