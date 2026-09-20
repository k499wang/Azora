/**
 * What a day asks for: the activities in the user's plan.
 *
 * Personal routine to-dos are separate from the plan and never affect a room
 * decoration. Keeping the count here plan-only makes the Home progress card,
 * reward eligibility, and completion sheet use the same rule.
 *
 * The dailies arrive as a count rather than a pair of flags. There is no fixed
 * number of them any more: a plan asks for one exercise in its first week and
 * three in its last, and a constant here would have told a user on week three
 * that two thirds of their day was the whole of it.
 */
export interface DayCompletionInput {
  dailiesDone: number;
  dailiesTotal: number;
}

export interface DayCompletionCounts {
  dailiesDone: number;
  dailiesTotal: number;
  /** Plan activities completed today. */
  done: number;
  total: number;
  /** Every plan activity is done right now. */
  liveCompleted: boolean;
}

export function countDayCompletion({
  dailiesDone,
  dailiesTotal,
}: DayCompletionInput): DayCompletionCounts {
  // A daily the plan has since stopped asking for cannot count past its list.
  const cappedDailiesDone = Math.min(dailiesDone, dailiesTotal);
  return {
    dailiesDone: cappedDailiesDone,
    dailiesTotal,
    done: cappedDailiesDone,
    total: dailiesTotal,
    liveCompleted:
      dailiesTotal > 0 &&
      cappedDailiesDone === dailiesTotal,
  };
}
