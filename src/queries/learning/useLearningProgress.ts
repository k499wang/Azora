import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LearningPracticeInput } from '../../features/lessons/domain/learningPractice';
import { readLearningPractice, saveLearningPractice } from '../../services/learning/learningPracticeStorage';

export function useLearningProgress(userId: string | null, enrollmentId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ['learning-practice', userId, enrollmentId] as const;
  const query = useQuery({ queryKey, enabled: userId != null && enrollmentId != null,
    queryFn: () => readLearningPractice(userId!, enrollmentId!), staleTime: Infinity });
  const mutation = useMutation({
    scope: { id: `learning-practice:${userId}:${enrollmentId}` },
    mutationFn: async (input: LearningPracticeInput) => {
      if (userId == null || enrollmentId == null) throw new Error('Your course is not available.');
      const records = await saveLearningPractice(userId, enrollmentId, { ...input, updatedAt: input.updatedAt ?? new Date().toISOString() });
      await queryClient.cancelQueries({ queryKey, exact: true }, { revert: false });
      queryClient.setQueryData(queryKey, records);
    },
  });
  return { records: query.data ?? [], isLoading: query.isLoading, isError: query.isError,
    isSaving: mutation.isPending, saveError: mutation.error, save: mutation.mutateAsync, refetch: query.refetch };
}
