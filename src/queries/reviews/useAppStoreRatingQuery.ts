import { useQuery } from '@tanstack/react-query';
import { fetchAppStoreRating } from '../../services/reviews/appStoreRating';

export function useAppStoreRatingQuery() {
  return useQuery({
    queryKey: ['appStoreRating'] as const,
    queryFn: fetchAppStoreRating,
    staleTime: 1000 * 60 * 60,
  });
}
