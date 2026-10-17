import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useProgramEnrollmentQuery } from '../../queries/program/useProgramEnrollmentQuery';
import { useProfileSummaryQuery } from '../../queries/profile/useProfileSummaryQuery';
import { ARCHETYPE_FOR_PLAN } from '../../lib/onboardingArchetype';
import {
  clearFutureSelfLetterSeen,
  loadFutureSelfLetterSeen,
  setFutureSelfLetterSeen,
} from '../../services/preferences/futureSelfLetterSeenPreference';
import {
  buildFutureSelfLetter,
  firstNameOf,
  formatLetterDateline,
  type FutureSelfLetter,
} from './domain/futureSelfLetter';

function futureSelfLetterSeenQueryKey(userId: string | null) {
  return ['future-self-letter-seen', userId] as const;
}

export async function resetFutureSelfLetterSeen(queryClient: QueryClient, userId: string) {
  await clearFutureSelfLetterSeen(userId);
  queryClient.setQueryData(futureSelfLetterSeenQueryKey(userId), false);
}

interface FutureSelfLetterState {
  letter: FutureSelfLetter | null;
  recipientName: string | null;
  dateline: string | null;
  showEnvelope: boolean;
  markSeen: () => void;
}

export function useFutureSelfLetter(userId: string | null): FutureSelfLetterState {
  const queryClient = useQueryClient();
  const enrollment = useProgramEnrollmentQuery(userId).data;
  const profileSummary = useProfileSummaryQuery(userId);
  const seenQuery = useQuery({
    queryKey: futureSelfLetterSeenQueryKey(userId),
    queryFn: () => loadFutureSelfLetterSeen(userId as string),
    enabled: userId != null,
    staleTime: Infinity,
  });

  const displayName = profileSummary.data?.profile?.displayName;
  const profileSettled = !profileSummary.isPending;

  const letter = useMemo(() => {
    if (enrollment == null || enrollment.status !== 'active' || !profileSettled) return null;
    const archetype = ARCHETYPE_FOR_PLAN[enrollment.planId];
    return buildFutureSelfLetter({
      displayName,
      startLocalDate: enrollment.enrolledOn,
      tagline: archetype?.tagline,
      planPromise: archetype?.planPromise,
      futureName: archetype?.futureName,
      dayCount: enrollment.resolved.days.length,
    });
  }, [enrollment, displayName, profileSettled]);

  const markSeen = useCallback(() => {
    if (userId == null) return;
    queryClient.setQueryData(futureSelfLetterSeenQueryKey(userId), true);
    void setFutureSelfLetterSeen(userId);
  }, [queryClient, userId]);

  return {
    letter,
    recipientName: firstNameOf(displayName),
    dateline: enrollment != null ? formatLetterDateline(enrollment.enrolledOn) : null,
    showEnvelope: letter != null && seenQuery.data === false,
    markSeen,
  };
}
