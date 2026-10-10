import { PLAN_TODO_ACTIVITY_ID } from '../../features/program/domain/programTodoStep';
import { useTodayProgramDay } from '../useTodayProgramDay';
import type { DayUnitSource } from './dayUnit';

/**
 * The plan's "Do a to-do" step, on the days that ask for it.
 *
 * Absent rather than incomplete on any other day: an enrollment no build that
 * draws the step has adopted, a day before the one it was adopted on, or no
 * plan at all. Counting a row nothing asks for would hold back the day and the
 * room piece. Completed by the claim, not the tick, so it stays done when the
 * to-do is un-ticked.
 */
export function useTodoDayUnit(userId: string | null, forced: boolean): DayUnitSource {
  const program = useTodayProgramDay(userId);
  const todoStep = program.day?.todoStep;

  return {
    units:
      todoStep?.required === true
        ? [
            {
              kind: 'todo',
              id: PLAN_TODO_ACTIVITY_ID,
              title: 'Do a to-do',
              techniqueId: null,
              completed: forced || todoStep.claimed,
            },
          ]
        : [],
    isLoading: program.isLoading,
    isSettling: false,
  };
}
