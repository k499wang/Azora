import { useQuery } from '@tanstack/react-query';
import { getCoinBalance } from '../../services/wallet/walletService';

export function getWalletQueryKey(userId: string | null) {
  return ['wallet', userId, 'coin'] as const;
}

/** The coin balance. */
export function useWalletQuery(userId: string | null) {
  return useQuery({
    queryKey: getWalletQueryKey(userId),
    enabled: userId != null,
    queryFn: getCoinBalance,
    staleTime: 1000 * 60,
  });
}
