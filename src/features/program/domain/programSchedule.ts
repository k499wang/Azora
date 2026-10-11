/**
 * Which hour of the user's day each of the plan's exercises takes.
 *
 * The plan authors a day *in time order*, and the user owns the hours. This is
 * the join between the two: the first exercise takes their main session hour,
 * the second their midday one, the third the hour before they wind down.
 *
 * Kept apart from both sides on purpose. The catalogue must not know what a
 * schedule is — an authored plan is the same plan whatever hours someone keeps
 * — and the schedule must not know what a program is, because it also holds the
 * hours for a user who has no plan at all.
 */

import type { DailyPlanActionId } from '../../../services/dailyPlan/dailyPlanScheduleCore';

/** Position in the day → the schedule slot that supplies its hour. */
export const PROGRAM_SLOT_ORDER = [
  'session',
  'handPicked',
  'windDown',
] as const satisfies readonly DailyPlanActionId[];

export function programSlotAt(position: number): DailyPlanActionId | null {
  return PROGRAM_SLOT_ORDER[position] ?? null;
}
