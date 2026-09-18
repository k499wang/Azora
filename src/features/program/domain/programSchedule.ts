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

/**
 * The slots a day of this size actually uses.
 *
 * A reminder may only be booked against a slot in this list. The schedule always
 * holds all three hours — they are written at onboarding while the answers that
 * place them are still in hand — but a plan asking for one exercise must not
 * produce three notifications, and the hour existing is not the plan asking for
 * it.
 */
export function programSlotsInUse(
  activityCount: number,
): readonly DailyPlanActionId[] {
  const count = Number.isFinite(activityCount)
    ? Math.max(0, Math.min(Math.floor(activityCount), PROGRAM_SLOT_ORDER.length))
    : 0;

  return PROGRAM_SLOT_ORDER.slice(0, count);
}

/**
 * The slots to book reminders against for a user with no plan.
 *
 * Someone who finished onboarding before plans existed, or whose backend has no
 * enrollment tables, keeps exactly the two reminders they have today. The third
 * belongs to the plan, so without one it is never booked.
 */
export const SLOTS_WITHOUT_A_PROGRAM: readonly DailyPlanActionId[] = [
  'session',
  'handPicked',
];
