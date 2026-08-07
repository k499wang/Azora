import { useQuery } from '@tanstack/react-query';
import { getTechniqueFeedback } from '../../services/tracking/techniqueFeedbackService';

export function getTechniqueFeedbackQueryKey(userId: string | null) {
  return ['technique-feedback', userId] as const;
}

export function useTechniqueFeedbackQuery(userId: string | null) {
  return useQuery({
    queryKey: getTechniqueFeedbackQueryKey(userId),
    enabled: userId != null,
    queryFn: () => getTechniqueFeedback(userId as string),
    staleTime: 1000 * 60 * 5,
  });
}
