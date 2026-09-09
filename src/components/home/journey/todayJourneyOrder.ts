import type { DailyPlanActionId } from '../../../services/dailyPlan/dailyPlanScheduleCore';
import type { DailyPlanSchedule } from '../../../services/dailyPlan/types';
import type {
  SelfCareGoal,
  SelfCareGoalPlaces,
} from '../../../features/selfCare/domain/selfCareGoal';
import {
  SELF_CARE_GOAL_DAYPARTS,
  selfCareGoalDaypart,
} from '../../../features/selfCare/domain/selfCareGoal';

export type TodayJourneyId = `exercise:${DailyPlanActionId}` | `todo:${string}`;

export const exerciseJourneyId = (id: DailyPlanActionId): TodayJourneyId =>
  `exercise:${id}`;
export const todoJourneyId = (id: string): TodayJourneyId => `todo:${id}`;

const ACTION_IDS: DailyPlanActionId[] = ['session', 'handPicked', 'checkIn'];

function journeyTime(value: string | null | undefined): {
  daypart: number;
  minute: number;
} {
  const fallback = 24 * 60;
  if (value == null) {
    return { daypart: SELF_CARE_GOAL_DAYPARTS.length, minute: fallback };
  }
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (match == null) {
    return { daypart: SELF_CARE_GOAL_DAYPARTS.length, minute: fallback };
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    return { daypart: SELF_CARE_GOAL_DAYPARTS.length, minute: fallback };
  }
  const daypart = selfCareGoalDaypart(value);
  return {
    daypart: SELF_CARE_GOAL_DAYPARTS.findIndex(({ id }) => id === daypart),
    minute: hour * 60 + minute,
  };
}

/** Default Home order: each daypart's exercises, then its to-dos. */
export function defaultTodayJourneyOrder(
  actions: DailyPlanSchedule['actions'],
  goals: readonly SelfCareGoal[],
): TodayJourneyId[] {
  const exerciseIds = ACTION_IDS.map((id, index) => ({
    id: exerciseJourneyId(id),
    ...journeyTime(actions[id]),
    kind: 0,
    stableIndex: index,
  }));
  const todoIds = goals.map((goal, index) => ({
    id: todoJourneyId(goal.id),
    ...journeyTime(goal.scheduledTime),
    kind: 1,
    stableIndex: index,
  }));
  return [...exerciseIds, ...todoIds]
    .sort((left, right) =>
      left.daypart - right.daypart ||
      left.kind - right.kind ||
      left.minute - right.minute ||
      left.stableIndex - right.stableIndex,
    )
    .map(({ id }) => id);
}

/**
 * Keeps temporarily absent to-dos in storage so recurring rows return to the
 * same place, while dropping exercise IDs that no longer belong to the plan.
 * To-dos leave this baseline only after a confirmed archive/delete mutation.
 */
export function reconcileTodayJourneyMembership(
  stored: readonly TodayJourneyId[],
  liveIds: readonly TodayJourneyId[],
): TodayJourneyId[] {
  const live = new Set(liveIds);
  const kept: TodayJourneyId[] = [];
  for (const id of stored) {
    if (
      (id.startsWith('todo:') || live.has(id)) &&
      !kept.includes(id)
    ) {
      kept.push(id);
    }
  }
  for (const id of liveIds) if (!kept.includes(id)) kept.push(id);
  return kept;
}

export function removeTodayJourneyItem(
  order: readonly TodayJourneyId[],
  id: TodayJourneyId,
): TodayJourneyId[] {
  return order.filter((candidate) => candidate !== id);
}

/** Reorders visible rows without losing the places of rows folded away. */
export function mergeVisibleTodayJourneyOrder(
  fullOrder: readonly TodayJourneyId[],
  visibleOrder: readonly TodayJourneyId[],
): TodayJourneyId[] | null {
  const visible = new Set(visibleOrder);
  const slots = fullOrder.filter((id) => visible.has(id));
  if (
    slots.length !== visibleOrder.length ||
    visibleOrder.some((id) => !slots.includes(id))
  ) return null;
  let index = 0;
  return fullOrder.map((id) =>
    visible.has(id) ? visibleOrder[index++] : id,
  );
}

/** One-time fallback from the two preferences used by the old split lists. */
export function migrateLegacyTodayJourneyOrder(
  defaults: readonly TodayJourneyId[],
  dailyOrder: readonly DailyPlanActionId[] | null,
  goalPlaces: SelfCareGoalPlaces,
): TodayJourneyId[] {
  const dailySlots = defaults.filter((id) => id.startsWith('exercise:'));
  let dailyIndex = 0;
  const withDailies = dailyOrder == null
    ? [...defaults]
    : defaults.map((id) =>
        dailySlots.includes(id)
          ? exerciseJourneyId(dailyOrder[dailyIndex++])
          : id,
      );
  if (Object.keys(goalPlaces).length === 0) return withDailies;
  const todoIds = withDailies
    .filter((id) => id.startsWith('todo:'))
    .sort((left, right) =>
      (goalPlaces[left.slice(5)] ?? Number.POSITIVE_INFINITY) -
      (goalPlaces[right.slice(5)] ?? Number.POSITIVE_INFINITY),
    );
  let todoIndex = 0;
  return withDailies.map((id) =>
    id.startsWith('todo:') ? todoIds[todoIndex++] : id,
  );
}

/**
 * Keeps a saved order stable while reconciling its membership with live rows.
 * A missing combined preference is the only case that consults the old split
 * preferences; after that, new rows append and temporarily absent to-dos keep
 * their slots. Confirmed archive/delete actions remove their IDs explicitly.
 */
export function reconcileTodayJourneyOrder(
  stored: TodayJourneyId[] | null,
  defaults: readonly TodayJourneyId[],
  dailyOrder: readonly DailyPlanActionId[] | null,
  goalPlaces: SelfCareGoalPlaces,
): TodayJourneyId[] {
  return stored == null
    ? migrateLegacyTodayJourneyOrder(defaults, dailyOrder, goalPlaces)
    : reconcileTodayJourneyMembership(stored, defaults);
}
