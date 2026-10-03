import type { QueryClient } from '@tanstack/react-query';
import { getWalletQueryKey } from './useWalletQuery';

interface CoinCredit {
  coins: number;
}

/**
 * Mutation callbacks that move the loaded balance by what a write earns, and
 * reconcile it with the server however the write ends.
 *
 * The wallet entry comes from a database trigger the write's response says
 * nothing about, so the cache moves ahead of it and is refetched behind it.
 * The credit lands synchronously inside `mutate`, so a screen opened on the same
 * tap already reads the new balance.
 */
export function optimisticCoinCredit<Variables>(
  queryClient: QueryClient,
  userId: string | null,
  coinsFor: (variables: Variables) => number,
) {
  const walletKey = getWalletQueryKey(userId);
  const credit = (coins: number) =>
    queryClient.setQueryData<number>(walletKey, (current) =>
      current == null ? undefined : current + coins);

  return {
    onMutate: (variables: Variables): CoinCredit => {
      const coins = coinsFor(variables);
      if (coins === 0) return { coins };
      // Synchronous inside the call, so an in-flight read cannot land on top.
      void queryClient.cancelQueries({ queryKey: walletKey, exact: true }, { revert: false });
      credit(coins);
      return { coins };
    },
    onError: (_error: unknown, _variables: Variables, context: CoinCredit | undefined) => {
      if (context != null && context.coins !== 0) credit(-context.coins);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: walletKey, exact: true });
    },
  };
}
