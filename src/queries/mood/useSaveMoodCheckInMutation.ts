import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  saveMoodCheckIn,
  type MoodCheckIn,
  type MoodCheckInState,
} from '../../services/mood/moodCheckInService';
import type { CompleteMoodAnswers } from '../../features/mood/domain/moodCheckIn';
import { getMoodCheckInQueryKey } from './useMoodCheckInQuery';
import { getRecentMoodCheckInsQueryKeyPrefix } from './useRecentMoodCheckInsQuery';
import { getDayHistoryQueryKey } from '../history/useDayHistoryQuery';
import { reconcileCompletionQueries } from '../tracking/completionQueryReconciliation';
import { getProfileSummaryQueryKey } from '../profile/useProfileSummaryQuery';
import { getDailyActivityRangeQueryKeyPrefix } from '../tracking/useDailyActivityRangeQuery';
import { getHomeStatsQueryKeyPrefix } from '../tracking/useHomeStatsQuery';
import { getProgramEnrollmentQueryKey } from '../program/useProgramEnrollmentQuery';
import { getProgramDayCompletionsQueryKeyPrefix } from '../program/useProgramDayCompletionsQuery';
import { optimisticCoinCredit } from '../wallet/optimisticCoinCredit';
import { EARN_RATES } from '../../lib/wallet/coins';

export interface SaveMoodCheckInVariables {
  localDate: string;
  answers: CompleteMoodAnswers;
  /** Chosen from `MOOD_TAGS`; the service drops anything else. */
  tags?: string[];
  /** The optional line; blank is stored as nothing written. */
  note?: string | null;
  /** The word they picked; null for "Not sure". */
  feeling?: string | null;
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
 * Publication belongs to the write so callers always receive a saved row
 * whose cache is already reconciled, even if they leave while it is in flight.
 * Dependent refetches stay in the background.
 *
 * History holds the same answers under the day it was written for, so that
 * one day is invalidated too — the run of days it belongs to is a different
 * cache and only this date changed.
 *
 * The day's first check-in earns coins; a revision does not. The balance is
 * credited as the save starts and refetched once it ends.
 */
export function useSaveMoodCheckInMutation(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      localDate,
      answers,
      tags,
      note,
      feeling,
    }: SaveMoodCheckInVariables) => {
      if (userId == null) {
        throw new Error('Cannot save a check-in without a signed-in user.');
      }
      const checkIn: MoodCheckIn = await saveMoodCheckIn({
        userId,
        localDate,
        answers,
        tags,
        note,
        feeling,
      });

      const moodKey = getMoodCheckInQueryKey(userId, localDate);
      // A pre-save initial read must not overwrite the canonical response.
      await queryClient.cancelQueries({ queryKey: moodKey, exact: true });
      queryClient.setQueryData<MoodCheckInState>(
        moodKey,
        { available: true, checkIn },
      );
      // The check-in can be the final part of a plan day. Its database trigger
      // owns the resulting advance, so refresh both the plan and its rows.
      await reconcileCompletionQueries(queryClient, [
        { queryKey: getRecentMoodCheckInsQueryKeyPrefix(userId) },
        { queryKey: getDayHistoryQueryKey(userId, localDate), exact: true },
        {
          queryKey: getProgramEnrollmentQueryKey(userId),
          exact: true,
        },
        { queryKey: getProgramDayCompletionsQueryKeyPrefix(userId) },
        { queryKey: getProfileSummaryQueryKey(userId) },
        { queryKey: getDailyActivityRangeQueryKeyPrefix(userId) },
        { queryKey: getHomeStatsQueryKeyPrefix(userId) },
      ]);

      return checkIn;
    },
    ...optimisticCoinCredit<SaveMoodCheckInVariables>(
      queryClient,
      userId,
      ({ localDate }) =>
        queryClient.getQueryData<MoodCheckInState>(
          getMoodCheckInQueryKey(userId, localDate),
        )?.checkIn == null
          ? EARN_RATES.lessonOrCheckIn
          : 0,
    ),
  });
}
