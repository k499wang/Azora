import {
  useDailiesCompletion,
  type DailiesCompletion,
} from '../../hooks/useDailiesCompletion';
import {
  countDayCompletion,
  type DayCompletionCounts,
} from '../../lib/room/dayCompletion';
import { useDayEarnedLatch } from './dayEarnedLatch';

export interface DayCompletion extends DayCompletionCounts {
  dailies: DailiesCompletion;
  /**
   * The earn rule. `liveCompleted` latches for the rest of the day, so a plan
   * activity later changing cannot take the decoration back.
   */
  allCompleted: boolean;
  isLoading: boolean;
  isSettling: boolean;
}

/**
 * The plan steps that earn a room decoration.
 *
 * Personal to-dos live in My Routine and have their own completion feedback.
 * They gate Home's room reward only through the plan's claimed "Do a to-do"
 * step, on the days that ask for it.
 */
export function useDayCompletion(userId: string | null): DayCompletion {
  const dailies = useDailiesCompletion(userId);
  const counts = countDayCompletion({
    dailiesDone: dailies.dailiesDone,
    dailiesTotal: dailies.dailiesTotal,
  });

  const isLoading = dailies.isLoading;
  const isSettling = dailies.isSettling;
  const liveCompleted = !isLoading && userId != null && counts.liveCompleted;
  const allCompleted = useDayEarnedLatch({
    userId,
    todayLocalDate: dailies.todayLocalDate,
    liveCompleted,
    settled: !isSettling,
  });

  return {
    ...counts,
    liveCompleted,
    dailies,
    allCompleted: userId != null && allCompleted,
    isLoading,
    isSettling,
  };
}
