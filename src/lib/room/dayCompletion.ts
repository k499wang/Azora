/**
 * What a day asks for: the dailies and every to-do the user set for today.
 * Both lists earn the one decoration together, so the count they are measured
 * by has to be a single number rather than two rules that can disagree on
 * screen.
 *
 * A user with no to-dos is complete on the dailies alone — an empty list is a
 * list with nothing left on it.
 *
 * The dailies arrive as a count rather than a pair of flags. There is no fixed
 * number of them any more: a plan asks for one exercise in its first week and
 * three in its last, and a constant here would have told a user on week three
 * that two thirds of their day was the whole of it.
 */
export interface DayCompletionInput {
  dailiesDone: number;
  dailiesTotal: number;
  todosDone: number;
  todosTotal: number;
}

export interface DayCompletionCounts {
  dailiesDone: number;
  dailiesTotal: number;
  todosDone: number;
  todosTotal: number;
  /** dailies and to-dos together, which is what the progress bars count */
  done: number;
  total: number;
  /** Everything on both lists is done right now. */
  liveCompleted: boolean;
}

export function countDayCompletion({
  dailiesDone,
  dailiesTotal,
  todosDone,
  todosTotal,
}: DayCompletionInput): DayCompletionCounts {
  // A to-do completed and then archived would otherwise count past its list,
  // and the same guard covers a daily the plan has since stopped asking for.
  const cappedDailiesDone = Math.min(dailiesDone, dailiesTotal);
  const cappedTodosDone = Math.min(todosDone, todosTotal);

  return {
    dailiesDone: cappedDailiesDone,
    dailiesTotal,
    todosDone: cappedTodosDone,
    todosTotal,
    done: cappedDailiesDone + cappedTodosDone,
    total: dailiesTotal + todosTotal,
    liveCompleted:
      dailiesTotal > 0 &&
      cappedDailiesDone === dailiesTotal &&
      cappedTodosDone === todosTotal,
  };
}
