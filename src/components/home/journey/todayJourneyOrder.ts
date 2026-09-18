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

export type TodayJourneyId =
  | `exercise:${DailyPlanActionId}`
  | `todo:${string}`
  | 'mood:today'
  | 'lesson:today';

export const exerciseJourneyId = (id: DailyPlanActionId): TodayJourneyId =>
  `exercise:${id}`;
export const todoJourneyId = (id: string): TodayJourneyId => `todo:${id}`;

/**
 * The daily check-in's place in the list.
 *
 * One id rather than one per day: it is the same row every day, and a dated id
 * would leave the user's arrangement behind at midnight — they would drag it
 * where they want it and find it back at the bottom tomorrow.
 */
export const MOOD_JOURNEY_ID = 'mood:today' as const satisfies TodayJourneyId;

/**
 * The day's lesson, on the days that have one.
 *
 * One id for the same reason the check-in has one, and not the lesson's own id:
 * the row is "today's reading" wherever the user drags it, and keying it to the
 * lesson would hand them a fresh row at the bottom every time the plan reached
 * a day with a new one.
 */
export const LESSON_JOURNEY_ID = 'lesson:today' as const satisfies TodayJourneyId;

/**
 * The rows that own no hour, in the order they lead the day.
 *
 * An exercise and a to-do have a time, and time sorts them. These do not, and
 * deliberately: an hour is a thing to be late for, and neither the row that
 * asks how you are nor the one that explains what changed today should be able
 * to make somebody late.
 *
 * So they need an order of their own, and this is it — a list rather than a
 * rule, because there are two of them and there will not be many. The check-in
 * leads because it asks a question rather than asking for work, and answering
 * it first is what lets the rest of the day be about what it found. The lesson
 * follows it, before the work it is usually explaining.
 *
 * A row missing from here still sorts, after both of these, rather than
 * vanishing — a new kind of row that nobody remembered to place is a row at the
 * top of the untimed group, never a row that is not on the list.
 */
const UNTIMED_JOURNEY_ORDER: readonly TodayJourneyId[] = [
  MOOD_JOURNEY_ID,
  LESSON_JOURNEY_ID,
];

function untimedJourneyRank(id: TodayJourneyId): number {
  const rank = UNTIMED_JOURNEY_ORDER.indexOf(id);
  return rank === -1 ? UNTIMED_JOURNEY_ORDER.length : rank;
}

/**
 * Every hour an exercise can take, in the order the day runs them.
 *
 * The default order has to know all three even though a day early in a plan
 * fills only the first: the order is a baseline the user's arrangement is
 * reconciled against, and a slot missing from here could never take its place
 * in the list on the day the plan grows into it.
 */
const ACTION_IDS: DailyPlanActionId[] = ['session', 'handPicked', 'windDown'];

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

/**
 * Default Home order: the untimed rows, then each daypart's exercises and its
 * to-dos.
 *
 * `untimed` is what the day actually has today — the check-in when the backend
 * can hold one, the lesson on a day that has one. The caller decides what
 * exists; this decides where it goes. Passing rows that are not on screen would
 * put them in the baseline the user's saved arrangement is reconciled against,
 * which is how a row nobody can see takes a place in the list.
 */
export function defaultTodayJourneyOrder(
  actions: DailyPlanSchedule['actions'],
  goals: readonly SelfCareGoal[],
  untimed: readonly TodayJourneyId[] = [MOOD_JOURNEY_ID],
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
  return [
    ...[...untimed].sort(
      (left, right) => untimedJourneyRank(left) - untimedJourneyRank(right),
    ),
    ...[...exerciseIds, ...todoIds]
      .sort((left, right) =>
        left.daypart - right.daypart ||
        left.kind - right.kind ||
        left.minute - right.minute ||
        left.stableIndex - right.stableIndex,
      )
      .map(({ id }) => id),
  ];
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
