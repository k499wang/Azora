import { useMutation, useQueryClient } from '@tanstack/react-query';
import { spendCoins } from '../../services/wallet/walletService';
import { getWalletQueryKey } from './useWalletQuery';

export function useSpendCoinsMutation(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { amount: number; reason: string; localDate: string }) => {
      if (userId == null) throw new Error('Cannot spend coins without a signed-in user.');
      return spendCoins(userId, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: getWalletQueryKey(userId), exact: true });
    },
  });
}
