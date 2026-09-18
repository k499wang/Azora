import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  saveMoodCheckIn,
  type MoodCheckIn,
} from '../../services/mood/moodCheckInService';
import type { CompleteMoodAnswers } from '../../features/mood/domain/moodCheckIn';
import { getMoodCheckInQueryKey } from './useMoodCheckInQuery';
import { getRecentMoodCheckInsQueryKeyPrefix } from './useRecentMoodCheckInsQuery';
import { getDayHistoryQueryKey } from '../history/useDayHistoryQuery';

export interface SaveMoodCheckInVariables {
  localDate: string;
  answers: CompleteMoodAnswers;
}

/**
 * Stores today's check-in.
 *
 * The response is the whole canonical row, so today's key is seeded with it
 * rather than refetched — the screen that just wrote it is about to read it
 * back, and a round trip there is a visible pause on the one screen that has
 * just asked the user for something. The run of recent days is invalidated
 * instead, because this changes its membership rather than one of its values.
 *
 * Both happen inside the mutation rather than in `onSuccess`, because the
 * screen that fires this does not wait for it: the reply page turns first and
 * the user can accept the offer and replace the screen while the write is
 * still in flight. React Query drops a mutation's own callbacks when the
 * component that owns them unmounts, which would leave Home showing the
 * check-in as unanswered until something else refetched it.
 *
 * History holds the same answers under the day it was written for, so that
 * one day is invalidated too — the run of days it belongs to is a different
 * cache and only this date changed.
 */
export function useSaveMoodCheckInMutation(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ localDate, answers }: SaveMoodCheckInVariables) => {
      if (userId == null) {
        throw new Error('Cannot save a check-in without a signed-in user.');
      }
      const checkIn: MoodCheckIn = await saveMoodCheckIn({
        userId,
        localDate,
        answers,
      });

      queryClient.setQueryData(
        getMoodCheckInQueryKey(userId, checkIn.localDate),
        { available: true, checkIn },
      );
      await queryClient.invalidateQueries({
        queryKey: getRecentMoodCheckInsQueryKeyPrefix(userId),
      });
      await queryClient.invalidateQueries({
        queryKey: getDayHistoryQueryKey(userId, checkIn.localDate),
        exact: true,
      });

      return checkIn;
    },
  });
}
