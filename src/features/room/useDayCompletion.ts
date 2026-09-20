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
 * The plan activities that earn a room decoration.
 *
 * Personal to-dos live in My Routine and have their own completion feedback;
 * they do not gate Home's room rewards.
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
