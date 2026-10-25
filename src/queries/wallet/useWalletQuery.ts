import { useQuery } from '@tanstack/react-query';
import { getCoinBalance } from '../../services/wallet/walletService';

export function getWalletQueryKey(userId: string | null) {
  return ['wallet', userId, 'coin'] as const;
}

/**
 * The coin balance. A reward screen passes `refetchOnMount: false`: it opens
 * while the earning write is still in flight, and a fetch then would replace
 * the optimistic credit with the balance from before it.
 */
export function useWalletQuery(userId: string | null, { refetchOnMount = true } = {}) {
  return useQuery({
    queryKey: getWalletQueryKey(userId),
    enabled: userId != null,
    queryFn: getCoinBalance,
    staleTime: 1000 * 60,
    refetchOnMount,
  });
}
