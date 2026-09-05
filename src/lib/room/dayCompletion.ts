import { DAILIES_PER_DAY } from '../dailies';

/**
 * What a day asks for: the three dailies and every to-do the user set for
 * today. Both lists earn the one decoration together, so the count they are
 * measured by has to be a single number rather than two rules that can
 * disagree on screen.
 *
 * A user with no to-dos is complete on the three dailies alone — an empty list
 * is a list with nothing left on it.
 */
export interface DayCompletionInput {
  guidedCompleted: boolean;
  handPickedCompleted: boolean;
  breathHoldCompleted: boolean;
  todosDone: number;
  todosTotal: number;
}

export interface DayCompletionCounts {
  dailiesDone: number;
  todosDone: number;
  todosTotal: number;
  /** dailies and to-dos together, which is what the progress bars count */
  done: number;
  total: number;
  /** Everything on both lists is done right now. */
  liveCompleted: boolean;
}

export function countDayCompletion({
  guidedCompleted,
  handPickedCompleted,
  breathHoldCompleted,
  todosDone,
  todosTotal,
}: DayCompletionInput): DayCompletionCounts {
  const dailiesDone = [
    guidedCompleted,
    handPickedCompleted,
    breathHoldCompleted,
  ].filter(Boolean).length;
  // A to-do completed and then archived would otherwise count past its list.
  const cappedTodosDone = Math.min(todosDone, todosTotal);

  return {
    dailiesDone,
    todosDone: cappedTodosDone,
    todosTotal,
    done: dailiesDone + cappedTodosDone,
    total: DAILIES_PER_DAY + todosTotal,
    liveCompleted:
      dailiesDone === DAILIES_PER_DAY && cappedTodosDone === todosTotal,
  };
}
