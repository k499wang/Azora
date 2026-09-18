import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  recordLessonRead,
  type RecordLessonReadRequest,
  type RecordLessonReadResponse,
} from '../../services/lessons/lessonReadService';
import {
  getProgramDayCompletionsQueryKey,
  getProgramDayCompletionsQueryKeyPrefix,
} from '../program/useProgramDayCompletionsQuery';

export interface RecordLessonReadVariables extends RecordLessonReadRequest {
  /** The enrollment the day belongs to, for the cache key it lands in. */
  enrollmentId: string | null;
}

/**
 * Writes down that today's lesson was read.
 *
 * A lesson read is a completion like any other, so it goes into the day's
 * completions cache rather than one of its own — the same list Home already
 * reads to know which exercises are behind the user. The server returns the day
 * it chose, so the exact key can be appended to without a refetch; the prefix is
 * invalidated behind it in case the day it chose was not the day on screen.
 *
 * The union rather than a push: a completion already in the list must not appear
 * twice when a read is retried, and the list is what the day's rows are counted
 * from.
 */
export function useRecordLessonReadMutation(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      enrollmentId,
      ...request
    }: RecordLessonReadVariables): Promise<RecordLessonReadResponse> => {
      if (userId == null) {
        throw new Error('Cannot record a lesson read without a signed-in user.');
      }
      const response = await recordLessonRead(request);

      if (
        response.outcome === 'recorded' &&
        response.activityId != null &&
        response.programDay != null &&
        enrollmentId != null
      ) {
        const key = getProgramDayCompletionsQueryKey(
          userId,
          enrollmentId,
          response.programDay,
        );
        queryClient.setQueryData<readonly string[]>(key, (current) =>
          current == null || !current.includes(response.activityId as string)
            ? [...(current ?? []), response.activityId as string]
            : current,
        );
      }

      await queryClient.invalidateQueries({
        queryKey: getProgramDayCompletionsQueryKeyPrefix(userId),
      });

      return response;
    },
  });
}
