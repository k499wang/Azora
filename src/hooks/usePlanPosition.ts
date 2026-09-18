import { useMemo } from 'react';
import {
  programPhaseForDay,
  programPresetRevision,
  programPresetWeeks,
  type ProgramPresetRevision,
} from '../features/program/domain/programCatalogue';
import {
  programDayForDate,
  type ProgramEnrollmentV3,
} from '../features/program/domain/programEnrollment';
import type { PlanPosition } from '../lib/planProgress';
import { useTodayLocalDate } from './useTodayLocalDate';
import { useProgramEnrollmentQuery } from '../queries/program/useProgramEnrollmentQuery';

const DAYS_PER_WEEK = 7;

/**
 * Where the user is in their plan, read from the plan itself.
 *
 * This used to count qualifying days off the profile and divide by seven, back
 * when nothing recorded a plan. That number is now wrong in the way that matters
 * most: it counts days the user showed up *at all*, so someone with a month of
 * heart-rate checks behind them would be told they were on week four of a plan
 * whose first day they had not done. The enrollment knows, so it answers.
 *
 * Null when the user has no plan. The header draws nothing rather than naming a
 * plan nobody is on.
 */
export function usePlanPosition(userId: string | null): PlanPosition | null {
  return usePlanPositionState(userId).position;
}

export function usePlanPositionState(userId: string | null) {
  const todayLocalDate = useTodayLocalDate();
  const query = useProgramEnrollmentQuery(userId);
  const enrollment = query.data ?? null;

  const position = useMemo(() => {
    if (enrollment == null) return null;

    const preset = programPresetRevision(
      enrollment.planId,
      enrollment.presetRevision,
    );
    // A revision this build does not carry cannot be described. The plan still
    // runs — its days are frozen in the enrollment — but nothing here invents a
    // name or a length for it.
    if (preset == null) return null;

    return planPositionFromEnrollment(enrollment, preset, todayLocalDate);
  }, [enrollment, todayLocalDate]);

  return {
    position,
    isLoading: userId != null && query.isPending,
    isError: query.isError,
    hasEnrollment: enrollment != null,
    refetch: query.refetch,
  };
}

export function planPositionFromEnrollment(
  enrollment: ProgramEnrollmentV3,
  preset: ProgramPresetRevision,
  localDate: string,
): PlanPosition {
  const totalDays = enrollment.resolved.days.length;
  // The day on screen, not the day the plan resumes on: finishing day seven
  // should not move the header to week two before the user has been to bed.
  const shownDay = programDayForDate(enrollment, localDate);
  const phase = programPhaseForDay(preset, shownDay);

  return {
    planId: enrollment.planId,
    planName: preset.name,
    phase:
      phase == null
        ? { name: '', startWeek: 1, endWeek: programPresetWeeks(preset) }
        : {
            name: phase.name,
            startWeek: Math.floor((phase.startDay - 1) / DAYS_PER_WEEK) + 1,
            endWeek: Math.ceil(phase.endDay / DAYS_PER_WEEK),
          },
    week: Math.floor((shownDay - 1) / DAYS_PER_WEEK) + 1,
    totalWeeks: Math.ceil(totalDays / DAYS_PER_WEEK),
    // Days behind them, which is the day they are on minus the one in progress.
    daysDone:
      enrollment.status === 'completed'
        ? totalDays
        : enrollment.programDay - 1,
    isFinished: enrollment.status === 'completed',
  };
}
