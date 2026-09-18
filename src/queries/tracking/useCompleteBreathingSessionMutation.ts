import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  completeBreathingSession,
  type CompleteBreathingSessionInput,
} from '../../services/tracking/breathingService';
import { getProfileSummaryQueryKey } from '../profile/useProfileSummaryQuery';
import { getProgramEnrollmentQueryKey } from '../program/useProgramEnrollmentQuery';
import { getProgramDayCompletionsQueryKeyPrefix } from '../program/useProgramDayCompletionsQuery';
import {
  advanceProgramDayRemote,
  type AdvanceProgramDayResponse,
} from '../../services/program/programEnrollmentService';
import { getDailyFeatureUsageQueryKey } from '../subscriptions/useDailyFeatureUsageQuery';
import { getHomeStatsQueryKeyPrefix } from './useHomeStatsQuery';
import { getDailyActivityRangeQueryKeyPrefix } from './useDailyActivityRangeQuery';
import { getDayHistoryQueryKeyPrefix } from '../history/useDayHistoryQuery';
import { getCompletedBreathingTechniqueIdsQueryKey } from './useCompletedBreathingTechniqueIdsQuery';
import { projectCompletedTechniqueId } from './completionCacheProjections';
import { reconcileCompletionQueries } from './completionQueryReconciliation';
import type { TechniqueId } from '../../features/exercise/guidedBreathing/techniqueCatalog';

type CompleteBreathingSessionMutationInput = Omit<
  CompleteBreathingSessionInput,
  'timezone' | 'localDate'
>;

function getDeviceTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
}

function formatLocalDate(timestamp: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(timestamp));

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (year == null || month == null || day == null) {
    throw new Error(`Unable to format local date for timezone "${timezone}"`);
  }

  return `${year}-${month}-${day}`;
}

export function useCompleteBreathingSessionMutation(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CompleteBreathingSessionMutationInput) => {
      if (userId == null) {
        throw new Error('Cannot save a breathing session without a signed-in user.');
      }

      const timezone = getDeviceTimezone();
      const localDate = formatLocalDate(input.endedAt, timezone);
      const sessionId = await completeBreathingSession({
        ...input,
        timezone,
        localDate,
      });

      // The plan moves off the session that proves it, and only the server may
      // move it. A refusal here is ordinary — this session may simply not be
      // what today asked for — so it never fails the save the user just made.
      let program: AdvanceProgramDayResponse | null = null;
      try {
        program = await advanceProgramDayRemote({
          localDate,
          modality: 'breathing',
          techniqueId: input.techniqueId,
          breathingSessionId: sessionId,
        });
      } catch (error) {
        console.warn('[program] advancing the plan failed', error);
      }

      return { sessionId, localDate, timezone, userId, program };
    },
    onSuccess: async (completion, input) => {
      const enrollmentKey = getProgramEnrollmentQueryKey(completion.userId);
      const enrollment = completion.program?.enrollment;
      if (enrollment != null) {
        await queryClient.cancelQueries({ queryKey: enrollmentKey, exact: true });
        queryClient.setQueryData(enrollmentKey, enrollment);
      }
      const completedTechniquesKey = getCompletedBreathingTechniqueIdsQueryKey(
        completion.userId,
        completion.localDate,
      );
      const filters = [
        { queryKey: getHomeStatsQueryKeyPrefix(completion.userId) },
        { queryKey: getDayHistoryQueryKeyPrefix(completion.userId) },
        { queryKey: getDailyActivityRangeQueryKeyPrefix(completion.userId) },
        {
          queryKey: getDailyFeatureUsageQueryKey(
            completion.userId,
            completion.localDate,
          ),
          exact: true,
        },
        { queryKey: getProfileSummaryQueryKey(completion.userId), exact: true },
        { queryKey: completedTechniquesKey, exact: true },
        // The RPC returns the canonical enrollment, but not its activity credits.
        ...(enrollment == null ? [{ queryKey: enrollmentKey, exact: true }] : []),
        {
          queryKey: getProgramDayCompletionsQueryKeyPrefix(completion.userId),
        },
      ] as const;

      await reconcileCompletionQueries(queryClient, filters, () => {
        queryClient.setQueryData<TechniqueId[]>(
          completedTechniquesKey,
          (current) =>
            projectCompletedTechniqueId(current, input.techniqueId),
        );
      });
    },
  });
}
