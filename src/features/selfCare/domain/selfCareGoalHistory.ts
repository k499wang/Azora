import { isSelfCareGoalDueOn, type SelfCareGoal } from './selfCareGoal';

export type SelfCareGoalDayState =
  | 'done'
  | 'missed'
  | 'pending'
  | 'not-due'
  | 'before-start';

export interface SelfCareGoalDay {
  date: string;
  state: SelfCareGoalDayState;
}

export const SELF_CARE_GOAL_HISTORY_DAYS = 30;

const DAY_MS = 86_400_000;

function localDateToUtcMs(localDate: string): number {
  const [year, month, day] = localDate.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function utcMsToLocalDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function shiftSelfCareLocalDate(localDate: string, days: number): string {
  return utcMsToLocalDate(localDateToUtcMs(localDate) + days * DAY_MS);
}

/** The device-local day a timestamp fell on, matching how completions are dated. */
function localDateOf(timestamp: string): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * A habit's last `days` days, oldest first. It starts on the day it was
 * written: the anchor moves when the repeat is edited, and a habit kept for a
 * month should not lose that month to a change of cadence.
 */
export function selfCareGoalHistory(
  goal: Pick<SelfCareGoal, 'recurrence' | 'recurrenceAnchorDate' | 'createdAt'>,
  completedDates: ReadonlySet<string> | readonly string[],
  today: string,
  days = SELF_CARE_GOAL_HISTORY_DAYS,
): SelfCareGoalDay[] {
  const completed = new Set(completedDates);
  const start = localDateOf(goal.createdAt);
  const sortedCompletions = [...completed].sort();

  return Array.from({ length: days }, (_, index) => {
    const date = shiftSelfCareLocalDate(today, index - (days - 1));
    if (completed.has(date)) return { date, state: 'done' as const };
    if (date < start) return { date, state: 'before-start' as const };
    const completedEarlier = sortedCompletions.some((done) => done < date);
    if (!isSelfCareGoalDueOn(goal, date, completedEarlier)) {
      return { date, state: 'not-due' as const };
    }
    return { date, state: date === today ? 'pending' as const : 'missed' as const };
  });
}
