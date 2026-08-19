import { useQuery } from '@tanstack/react-query';
import { getDayHistory } from '../../services/history/dayHistoryService';

export function getDayHistoryQueryKeyPrefix(userId: string | null) {
  return ['day-history', userId] as const;
}

export function getDayHistoryQueryKey(userId: string | null, localDate: string) {
  return ['day-history', userId, localDate] as const;
}

export function useDayHistoryQuery(userId: string | null, localDate: string) {
  return useQuery({
    queryKey: getDayHistoryQueryKey(userId, localDate),
    enabled: userId != null,
    queryFn: () => getDayHistory(userId as string, localDate),
    staleTime: 1000 * 60 * 5,
  });
}
