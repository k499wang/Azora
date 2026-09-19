import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { requireSupabaseClient } from '../services/supabase';
import {
  getProgramEnrollmentQueryKey,
  useProgramEnrollmentQuery,
} from '../queries/program/useProgramEnrollmentQuery';
import { getProgramDayCompletionsQueryKeyPrefix } from '../queries/program/useProgramDayCompletionsQuery';

export interface DevPlanControls {
  enrollmentId: string;
  planId: string;
  status: string;
  isWriting: boolean;
  /** Puts the account back into the state an account with no plan is in. */
  clear: () => void;
  /** Jumps to the last day and marks the plan done, as finishing it would. */
  finish: () => void;
}

/**
 * The two ends of a plan's life, for development only.
 *
 * The plan screen's start card is only reachable by an account that never got
 * a plan — which, on a device that has been through onboarding, is an account
 * nobody has. Without this the card can only be seen by making a fresh
 * account, and the interesting half of it (tapping the button and watching a
 * real plan appear) cannot be rehearsed at all.
 *
 * `abandoned` rather than a delete: `getCurrentProgramEnrollment` reads only
 * `active` and `completed`, so the row stops being found while the history it
 * carries stays in the table. Nothing downstream is faked — the app is in the
 * genuine no-plan state, and starting one writes a genuine new enrollment.
 */
export function useDevPlanControls(
  userId: string | null,
): DevPlanControls | null {
  const queryClient = useQueryClient();
  const [isWriting, setIsWriting] = useState(false);
  const enrollment = useProgramEnrollmentQuery(userId).data ?? null;

  // `status` is the only column a client may update — the migration revokes
  // the rest so nobody can PATCH `program_day` to the last day and skip a
  // plan. Including any other column here gets the whole statement refused.
  const write = useCallback(
    (status: string, what: string) => {
      if (userId == null || enrollment == null) return;
      setIsWriting(true);

      void (async () => {
        try {
          const supabase = requireSupabaseClient();
          const { error } = await supabase
            .from('program_enrollments')
            .update({ status })
            .eq('id', enrollment.enrollmentId)
            .eq('user_id', userId);

          if (error != null) {
            console.warn(`[plan-dev] could not ${what}`, error);
            return;
          }

          await queryClient.invalidateQueries({
            queryKey: getProgramEnrollmentQueryKey(userId),
            exact: true,
          });
          await queryClient.invalidateQueries({
            queryKey: getProgramDayCompletionsQueryKeyPrefix(userId),
          });
        } finally {
          setIsWriting(false);
        }
      })();
    },
    [enrollment, queryClient, userId],
  );

  const clear = useCallback(
    () => write('abandoned', 'clear the plan'),
    [write],
  );

  /**
   * Marks the plan done without moving `program_day`, because it cannot.
   *
   * The plan tab is still exactly right: `planPositionFromEnrollment` reads a
   * completed plan's progress as the whole thing regardless of where the day
   * counter stopped, so the hero says every week is done and the calendar
   * fills. Home is the one that differs from a real finish — it freezes on
   * whatever day you were on rather than the last one.
   */
  const finish = useCallback(
    () => write('completed', 'finish the plan'),
    [write],
  );

  if (enrollment == null) return null;

  return {
    enrollmentId: enrollment.enrollmentId,
    planId: enrollment.planId,
    status: enrollment.status,
    isWriting,
    clear,
    finish,
  };
}
