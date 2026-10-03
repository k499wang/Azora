import { useQuery } from '@tanstack/react-query';
import { getCoinBalance } from '../../services/wallet/walletService';
import { traceTick } from '../../lib/debug/tickTrace';

export function getWalletQueryKey(userId: string | null) {
  return ['wallet', userId, 'coin'] as const;
}

/** The coin balance. */
export function useWalletQuery(userId: string | null) {
  return useQuery({
    queryKey: getWalletQueryKey(userId),
    enabled: userId != null,
    queryFn: async () => {
      traceTick('balance fetch started');
      try {
        const balance = await getCoinBalance();
        traceTick('balance fetch landed', { balance });
        return balance;
      } catch (error) {
        traceTick('balance fetch FAILED', { error: error instanceof Error ? error.message : String(error) });
        throw error;
      }
    },
    staleTime: 1000 * 60,
  });
}
