import {
  useDailiesCompletion,
  type DailiesCompletion,
} from '../../hooks/useDailiesCompletion';
import { useDailiesForcedComplete } from '../../hooks/devDailiesOverride';
import {
  countDayCompletion,
  type DayCompletionCounts,
} from '../../lib/room/dayCompletion';
import { useSelfCareGoalsQuery } from '../../queries/selfCare/useSelfCareGoalsQuery';
import { useDayEarnedLatch } from './dayEarnedLatch';

export interface DayCompletion extends DayCompletionCounts {
  dailies: DailiesCompletion;
  /**
   * The earn rule. `liveCompleted` latched for the rest of the day, so a to-do
   * added or unticked after the fact cannot take the decoration back.
   */
  allCompleted: boolean;
  isLoading: boolean;
  isSettling: boolean;
}

/**
 * Everything today asks of the user, as one answer: the three dailies and the
 * to-do list together.
 *
 * Home folds both sections away on `liveCompleted`, and the room's decoration
 * is earned on `allCompleted`. Resolving them here is what keeps the list Home
 * shows and the rule the reward runs on from being two different rules.
 */
export function useDayCompletion(userId: string | null): DayCompletion {
  const dailies = useDailiesCompletion(userId);
  // Dev lab only, and false in release builds. It stands in for the whole day,
  // not just the sessions — a forced day the to-do list still blocks would
  // leave the reward as unreachable as it was before.
  const forced = useDailiesForcedComplete();
  const goalsQuery = useSelfCareGoalsQuery(userId, dailies.todayLocalDate);
  const goals = goalsQuery.data ?? [];

  const counts = countDayCompletion({
    guidedCompleted: dailies.guidedCompleted,
    handPickedCompleted: dailies.handPickedCompleted,
    breathHoldCompleted: dailies.breathHoldCompleted,
    todosDone: forced
      ? goals.length
      : goals.filter((goal) => goal.completedToday).length,
    todosTotal: goals.length,
  });

  const isLoading =
    dailies.isLoading || (userId != null && goalsQuery.isPending);
  const isSettling = dailies.isSettling || goalsQuery.isFetching;
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
