import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { requireSupabaseClient } from '../services/supabase';
import { getProgramEnrollmentQueryKey } from '../queries/program/useProgramEnrollmentQuery';
import { getProgramDayCompletionsQueryKeyPrefix } from '../queries/program/useProgramDayCompletionsQuery';
import { useProgramEnrollmentQuery } from '../queries/program/useProgramEnrollmentQuery';

export interface ProgramDayMark {
  day: number;
  activityCount: number;
}

export interface DevProgramDayJump {
  planId: string;
  programDay: number;
  totalDays: number;
  activityCount: number;
  /** The first day at each size the plan ever reaches. */
  marks: readonly ProgramDayMark[];
  isMoving: boolean;
  goToDay: (day: number) => void;
}

/**
 * Moving the real enrollment to a real day, for the dev lab only.
 *
 * A plan grows from one exercise a day to three, and reaching the three-exercise
 * stretch honestly takes over two weeks — so without this, the only way to look
 * at the biggest version of Home is to wait for it. Everything downstream stays
 * real: the day it lands on is an authored day of the user's own plan, and the
 * rows, times and completions all come from the same place they always do.
 *
 * `program_day` is normally the server's alone, written only by
 * `advance_program_day`. This writes it directly and therefore only works
 * because the column grant permits it in development; the guard is that the lab
 * is `__DEV__`-only, the same as every other control on that screen.
 */
export function useDevProgramDayJump(
  userId: string | null,
): DevProgramDayJump | null {
  const queryClient = useQueryClient();
  const [isMoving, setIsMoving] = useState(false);
  const enrollment = useProgramEnrollmentQuery(userId).data ?? null;

  const goToDay = useCallback(
    (day: number) => {
      if (userId == null || enrollment == null) return;
      setIsMoving(true);

      void (async () => {
        try {
          const supabase = requireSupabaseClient();
          const { error } = await supabase
            .from('program_enrollments')
            .update({ program_day: day, last_advanced_on: null })
            .eq('id', enrollment.enrollmentId)
            .eq('user_id', userId);

          if (error != null) {
            console.warn('[program-lab] could not move the plan', error);
            return;
          }

          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: getProgramEnrollmentQueryKey(userId),
              exact: true,
            }),
            queryClient.invalidateQueries({
              queryKey: getProgramDayCompletionsQueryKeyPrefix(userId),
            }),
          ]);
        } finally {
          setIsMoving(false);
        }
      })();
    },
    [enrollment, queryClient, userId],
  );

  if (enrollment == null) return null;

  const days = enrollment.resolved.days;
  const marks: ProgramDayMark[] = [];
  for (const day of days) {
    const activityCount = day.activities.length;
    if (!marks.some((mark) => mark.activityCount === activityCount)) {
      marks.push({ day: day.day, activityCount });
    }
  }

  return {
    planId: enrollment.planId,
    programDay: enrollment.programDay,
    totalDays: days.length,
    activityCount:
      days.find((day) => day.day === enrollment.programDay)?.activities.length ??
      0,
    marks,
    isMoving,
    goToDay,
  };
}
