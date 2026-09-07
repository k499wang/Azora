import { useQuery } from '@tanstack/react-query';
import { getWalletEntries } from '../../services/wallet/walletService';

export function getWalletQueryKey(userId: string | null) {
  return ['wallet', userId, 'coin'] as const;
}

export function useWalletQuery(userId: string | null) {
  return useQuery({
    queryKey: getWalletQueryKey(userId),
    enabled: userId != null,
    queryFn: () => getWalletEntries(userId as string),
    staleTime: 1000 * 60,
  });
}
