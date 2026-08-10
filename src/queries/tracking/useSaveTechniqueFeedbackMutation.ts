import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  saveTechniqueFeedback,
  type Helpfulness,
} from '../../services/tracking/techniqueFeedbackService';
import { getTechniqueFeedbackQueryKey } from './useTechniqueFeedbackQuery';

interface SaveTechniqueFeedbackInput {
  techniqueId: string;
  localDate: string;
  sessionKey: string;
  helpfulness: Helpfulness;
}

export function useSaveTechniqueFeedbackMutation(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      techniqueId,
      localDate,
      sessionKey,
      helpfulness,
    }: SaveTechniqueFeedbackInput) => {
      if (userId == null) {
        throw new Error('Cannot save feedback without a signed-in user.');
      }

      return saveTechniqueFeedback(
        userId,
        techniqueId,
        localDate,
        sessionKey,
        helpfulness,
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: getTechniqueFeedbackQueryKey(userId),
        exact: true,
      });
    },
  });
}
