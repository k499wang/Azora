import { ICON_PATHS, type IconName } from '../../../components/common/icons/paths';

export const MAX_SELF_CARE_GOALS = 20;
export const MAX_SELF_CARE_GOAL_TITLE_LENGTH = 120;

/** What a to-do wears when it was written from scratch rather than picked. */
export const DEFAULT_SELF_CARE_GOAL_ICON: IconName = 'sparkle';

/**
 * When in the day a to-do belongs, named rather than clocked.
 *
 * A to-do is not an appointment — "before bed" is the useful answer and "9:14
 * PM" is not — so the sheet offers the four parts of a day and stores the hour
 * each one stands for. That keeps the column a real `time`, so the list can go
 * on ordering the day by it, while nothing in the UI ever asks anyone to pick a
 * minute they do not care about.
 */
export type SelfCareGoalDaypart = 'start' | 'afternoon' | 'evening' | 'bedtime';

interface DaypartSpec {
  id: SelfCareGoalDaypart;
  label: string;
  icon: IconName;
  /** the hour the part of the day is stored as */
  time: string;
  /** anything before this hour belongs to this part of the day */
  until: number;
}

export const SELF_CARE_GOAL_DAYPARTS: DaypartSpec[] = [
  { id: 'start', label: 'Start the day', icon: 'sunrise', time: '07:00', until: 11 },
  { id: 'afternoon', label: 'Afternoon', icon: 'sun', time: '13:00', until: 17 },
  { id: 'evening', label: 'Evening', icon: 'sunset', time: '18:00', until: 20 },
  { id: 'bedtime', label: 'Bedtime', icon: 'moon', time: '21:00', until: 24 },
];

export function selfCareGoalDaypartTime(part: SelfCareGoalDaypart): string {
  const spec = SELF_CARE_GOAL_DAYPARTS.find((entry) => entry.id === part);
  return spec?.time ?? SELF_CARE_GOAL_DAYPARTS[0].time;
}

/**
 * Reads a stored hour back as the part of the day it falls in, rather than only
 * recognising the four the picker writes. A row edited outside the app, or
 * written by a later version with its own hours, still lands somewhere real.
 */
export function selfCareGoalDaypart(
  scheduledTime: string | null,
): SelfCareGoalDaypart | null {
  if (scheduledTime == null) return null;
  const hour = Number(scheduledTime.split(':')[0]);
  if (!Number.isFinite(hour)) return null;
  const spec =
    SELF_CARE_GOAL_DAYPARTS.find((entry) => hour < entry.until) ??
    SELF_CARE_GOAL_DAYPARTS[SELF_CARE_GOAL_DAYPARTS.length - 1];
  return spec.id;
}

export function selfCareGoalDaypartLabel(scheduledTime: string | null): string {
  const part = selfCareGoalDaypart(scheduledTime);
  if (part == null) return 'Any time';
  return (
    SELF_CARE_GOAL_DAYPARTS.find((entry) => entry.id === part)?.label ??
    'Any time'
  );
}

export type SelfCareGoalRecurrence = 'daily' | 'weekdays' | 'once';

interface RecurrenceSpec {
  id: SelfCareGoalRecurrence;
  label: string;
  icon: IconName;
}

/** Carries an icon each, so a repeat choice is picked the same way an hour is. */
export const SELF_CARE_GOAL_RECURRENCES: RecurrenceSpec[] = [
  { id: 'daily', label: 'Daily', icon: 'streak' },
  { id: 'weekdays', label: 'Weekdays', icon: 'calendar' },
  { id: 'once', label: 'Once', icon: 'check' },
];

export function selfCareGoalRecurrenceLabel(
  recurrence: SelfCareGoalRecurrence,
): string {
  return (
    SELF_CARE_GOAL_RECURRENCES.find((entry) => entry.id === recurrence)
      ?.label ?? 'Daily'
  );
}

export const DEFAULT_SELF_CARE_GOAL_RECURRENCE: SelfCareGoalRecurrence = 'daily';

export function resolveSelfCareGoalRecurrence(
  value: string | null | undefined,
): SelfCareGoalRecurrence {
  return SELF_CARE_GOAL_RECURRENCES.some((entry) => entry.id === value)
    ? (value as SelfCareGoalRecurrence)
    : DEFAULT_SELF_CARE_GOAL_RECURRENCE;
}

/**
 * The column is a `time`, so it comes back with seconds on it. The app only
 * ever schedules to the minute, and carrying `:00` around would leak into every
 * comparison and every label.
 */
export function resolveSelfCareGoalTime(
  value: string | null | undefined,
): string | null {
  if (value == null) return null;
  const [hour, minute] = value.split(':');
  if (hour == null || minute == null) return null;
  return `${hour.padStart(2, '0')}:${minute}`;
}

export interface SelfCareGoal {
  id: string;
  title: string;
  icon: IconName;
  recurrence: SelfCareGoalRecurrence;
  /** 24-hour `HH:MM`, or null for a to-do with no hour attached to it */
  scheduledTime: string | null;
  createdAt: string;
  updatedAt: string;
  completedToday: boolean;
  /** singled out as today's one task of the day */
  featuredToday: boolean;
}

/**
 * The stored icon is free text and outlives the app version that wrote it, so a
 * name this build no longer draws is resolved back to the default here rather
 * than reaching the renderer and drawing nothing at all.
 */
export function resolveSelfCareGoalIcon(
  value: string | null | undefined,
): IconName {
  if (value != null && ICON_PATHS[value as IconName] != null) {
    return value as IconName;
  }
  return DEFAULT_SELF_CARE_GOAL_ICON;
}

export function normalizeSelfCareGoalTitle(title: string): string | null {
  const normalized = title.trim();
  if (
    normalized.length === 0 ||
    normalized.length > MAX_SELF_CARE_GOAL_TITLE_LENGTH
  ) {
    return null;
  }
  return normalized;
}

/**
 * The weekday a local date falls on, 0 for Sunday. Parsed as UTC on purpose:
 * the string is already the user's own day, and reading it in device time
 * would shift it back a day for anyone west of the meridian.
 */
function selfCareGoalWeekday(localDate: string): number | null {
  const [year, month, day] = localDate.split('-').map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(parsed.getTime()) ? null : parsed.getUTCDay();
}

/**
 * Whether a to-do belongs on a given day.
 *
 * `completedOnAnotherDay` is what makes `once` finish: a one-off stays on the
 * list until it is done, and only leaves once the day it was done on is behind
 * it — so the row you just checked does not vanish from under your finger.
 *
 * An unreadable date lets everything through. A to-do the app cannot place is
 * better shown on the wrong day than silently lost.
 */
export function isSelfCareGoalDueOn(
  goal: SelfCareGoal,
  localDate: string,
  completedOnAnotherDay: boolean,
): boolean {
  switch (goal.recurrence) {
    case 'weekdays': {
      const weekday = selfCareGoalWeekday(localDate);
      return weekday == null || (weekday >= 1 && weekday <= 5);
    }
    case 'once':
      return !completedOnAnotherDay;
    default:
      return true;
  }
}

/**
 * The day in the order it happens: to-dos with an hour on them run earliest
 * first, and the ones with no hour sink below in the order they were written.
 *
 * Completing one deliberately does not move it. A row that jumps out from under
 * the finger that just tapped it costs the user their place in the list, and
 * the check itself already says the goal is done.
 */
export function sortSelfCareGoals(goals: SelfCareGoal[]): SelfCareGoal[] {
  return [...goals].sort((left, right) => {
    if (left.scheduledTime !== right.scheduledTime) {
      if (left.scheduledTime == null) return 1;
      if (right.scheduledTime == null) return -1;
      return left.scheduledTime.localeCompare(right.scheduledTime);
    }
    return right.createdAt.localeCompare(left.createdAt);
  });
}

/**
 * Completed goals stay on the journey the way a completed daily does — the rail
 * filling up is the point of it. They only collapse behind a summary row once
 * there are enough of them to bury the goals still open.
 */
export const COMPLETED_COLLAPSE_THRESHOLD = 8;

export interface SelfCareGoalList {
  /** shown on the rail, open goals first */
  rail: SelfCareGoal[];
  /** completed goals folded behind the summary row; empty below the threshold */
  drawer: SelfCareGoal[];
}

export function planSelfCareGoalList(goals: SelfCareGoal[]): SelfCareGoalList {
  const sorted = sortSelfCareGoals(goals);
  const completed = sorted.filter((goal) => goal.completedToday);
  if (completed.length <= COMPLETED_COLLAPSE_THRESHOLD) {
    return { rail: sorted, drawer: [] };
  }
  return {
    rail: sorted.filter((goal) => !goal.completedToday),
    drawer: completed,
  };
}

export function completedGoalsSummary(count: number): string {
  return `${count} ${count === 1 ? 'to-do' : 'to-dos'} done today!`;
}
