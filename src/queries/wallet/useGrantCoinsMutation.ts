import { useMutation, useQueryClient } from '@tanstack/react-query';
import { grantCoins } from '../../services/wallet/walletService';
import { getWalletQueryKey } from './useWalletQuery';

export function useGrantCoinsMutation(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { amount: number; reason: string; localDate: string }) => {
      if (userId == null) throw new Error('Cannot grant coins without a signed-in user.');
      return grantCoins(userId, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: getWalletQueryKey(userId), exact: true });
    },
  });
}
