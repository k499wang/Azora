import type { ProgramEnrollmentV3 } from './programEnrollment';

/**
 * Home and Plan can claim the step. Enrollment adoption uses the compatible
 * RPC, which exists only once older apps can keep advancing without a claim.
 */
export const PLAN_TODO_STEP_ENABLED = true;

/** The completion row a claimed to-do step writes; matches `claim_plan_todo_step`. */
export const PLAN_TODO_ACTIVITY_ID = 'todo:claim';

/**
 * Whether this day of the plan asks for a claimed to-do.
 *
 * Applies to the new UI's completion and room reward. Server advancement keeps
 * the older app's rule, even on adopted enrollments: old builds have no card
 * for this step and must still finish their visible plan.
 */
export function programDayAsksForTodo(
  enrollment: Pick<ProgramEnrollmentV3, 'todoStepFromDay'>,
  programDay: number,
): boolean {
  return enrollment.todoStepFromDay != null && programDay >= enrollment.todoStepFromDay;
}

/**
 * `add`: nothing on the routine is due today. `open`: something is due and
 * nothing is ticked. `claimable`: a to-do is ticked today. `claimed`: done.
 */
export type TodoStepState = 'add' | 'open' | 'claimable' | 'claimed';

export interface TodoStepInput {
  required: boolean;
  claimed: boolean;
  /** Today's due to-dos. */
  goals: readonly { completedToday: boolean }[];
}

/**
 * The step's state, or null on a day that does not ask for it.
 *
 * The claim, not the tick, is the completion: once claimed it stays claimed,
 * even if the to-do that earned it is un-ticked afterwards.
 */
export function todoStepState({ required, claimed, goals }: TodoStepInput): TodoStepState | null {
  if (!required) return null;
  if (claimed) return 'claimed';
  if (goals.some((goal) => goal.completedToday)) return 'claimable';
  return goals.length === 0 ? 'add' : 'open';
}
