import type { DailyPlanActionId } from '../../../services/dailyPlan/dailyPlanScheduleCore';
import type { DailyPlanSchedule } from '../../../services/dailyPlan/types';
import type {
  SelfCareGoal,
  SelfCareGoalPlaces,
} from '../../../features/selfCare/domain/selfCareGoal';

export type TodayJourneyId = `exercise:${DailyPlanActionId}` | `todo:${string}`;

export const exerciseJourneyId = (id: DailyPlanActionId): TodayJourneyId =>
  `exercise:${id}`;
export const todoJourneyId = (id: string): TodayJourneyId => `todo:${id}`;

const ACTION_IDS: DailyPlanActionId[] = ['session', 'handPicked', 'checkIn'];

function timePlace(value: string | null | undefined, fallback: number): number {
  if (value == null) return fallback;
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (match == null) return fallback;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Default Home order: exercises first, then to-dos; each group runs earliest first. */
export function defaultTodayJourneyOrder(
  actions: DailyPlanSchedule['actions'],
  goals: readonly SelfCareGoal[],
): TodayJourneyId[] {
  const exerciseIds = ACTION_IDS.map((id, index) => ({
    id: exerciseJourneyId(id),
    place: timePlace(actions[id], 24 * 60) * 100 + index,
  }))
    .sort((a, b) => a.place - b.place)
    .map(({ id }) => id);
  const todoIds = goals.map((goal, index) => ({
    id: todoJourneyId(goal.id),
    place: timePlace(goal.scheduledTime, 24 * 60) * 100 + index,
  }))
    .sort((a, b) => a.place - b.place)
    .map(({ id }) => id);
  return [...exerciseIds, ...todoIds];
}

/** Storage may outlive rows; missing live rows are appended in default order. */
export function sanitizeTodayJourneyOrder(
  raw: unknown,
  liveIds: readonly TodayJourneyId[],
): TodayJourneyId[] {
  const live = new Set(liveIds);
  const kept: TodayJourneyId[] = [];
  if (Array.isArray(raw)) {
    for (const value of raw) {
      if (
        typeof value === 'string' &&
        live.has(value as TodayJourneyId) &&
        !kept.includes(value as TodayJourneyId)
      ) {
        kept.push(value as TodayJourneyId);
      }
    }
  }
  for (const id of liveIds) if (!kept.includes(id)) kept.push(id);
  return kept;
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
