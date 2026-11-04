import { useMutation, useQueryClient } from '@tanstack/react-query';
import { grantCoinsOncePerDay } from '../../services/wallet/walletService';
import { getWalletQueryKey } from './useWalletQuery';

export function grantCoinsOncePerDayMutationKey(userId: string | null) {
  return ['grant-coins-once-per-day', userId];
}

export function useGrantCoinsOncePerDayMutation(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: grantCoinsOncePerDayMutationKey(userId),
    mutationFn: (input: { amount: number; reason: string; localDate: string }) => {
      if (userId == null) throw new Error('Cannot grant coins without a signed-in user.');
      return grantCoinsOncePerDay(userId, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: getWalletQueryKey(userId), exact: true });
    },
  });
}
