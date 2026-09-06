import {
  DEFAULT_DAILY_PLAN_SCHEDULE,
  type DailyPlanSchedule,
} from './types';

const CLOCK_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

export type DailyPlanActionId = keyof DailyPlanSchedule['actions'];

const DAILY_PLAN_ACTION_TIE_ORDER: readonly DailyPlanActionId[] = [
  'session',
  'handPicked',
  'checkIn',
];

export function createDefaultDailyPlanSchedule(): DailyPlanSchedule {
  return {
    version: 1,
    timeMode: 'device_local',
    actions: { ...DEFAULT_DAILY_PLAN_SCHEDULE.actions },
  };
}

export function normalizeDailyPlanTime(
  value: unknown,
  fallback: string,
): string {
  if (typeof value !== 'string' || !CLOCK_TIME_PATTERN.test(value)) {
    return fallback;
  }

  return value.slice(0, 5);
}

export function sanitizeDailyPlanSchedule(raw: unknown): DailyPlanSchedule {
  if (raw == null || typeof raw !== 'object') {
    return createDefaultDailyPlanSchedule();
  }

  const record = raw as {
    version?: unknown;
    timeMode?: unknown;
    actions?: {
      session?: unknown;
      handPicked?: unknown;
      checkIn?: unknown;
    };
  };

  if (
    record.version !== 1 ||
    record.timeMode !== 'device_local' ||
    record.actions == null ||
    typeof record.actions !== 'object'
  ) {
    return createDefaultDailyPlanSchedule();
  }

  return {
    version: 1,
    timeMode: 'device_local',
    actions: {
      session: normalizeDailyPlanTime(
        record.actions.session,
        DEFAULT_DAILY_PLAN_SCHEDULE.actions.session,
      ),
      handPicked: normalizeDailyPlanTime(
        record.actions.handPicked,
        DEFAULT_DAILY_PLAN_SCHEDULE.actions.handPicked,
      ),
      checkIn: normalizeDailyPlanTime(
        record.actions.checkIn,
        DEFAULT_DAILY_PLAN_SCHEDULE.actions.checkIn,
      ),
    },
  };
}

export function formatDailyPlanTime(
  value: unknown,
  fallback: string,
): string {
  const normalized = normalizeDailyPlanTime(value, fallback);
  const [hourText, minute] = normalized.split(':');
  const hour24 = Number(hourText);
  const suffix = hour24 < 12 ? 'AM' : 'PM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return `${hour12}:${minute} ${suffix}`;
}

export function sortDailyPlanActionIdsByTime(
  actions: Partial<Record<DailyPlanActionId, unknown>>,
): DailyPlanActionId[] {
  return [...DAILY_PLAN_ACTION_TIE_ORDER].sort((left, right) => {
    const leftTime = normalizeDailyPlanTime(
      actions[left],
      DEFAULT_DAILY_PLAN_SCHEDULE.actions[left],
    );
    const rightTime = normalizeDailyPlanTime(
      actions[right],
      DEFAULT_DAILY_PLAN_SCHEDULE.actions[right],
    );
    const [leftHour, leftMinute] = leftTime.split(':').map(Number);
    const [rightHour, rightMinute] = rightTime.split(':').map(Number);
    const timeDifference =
      leftHour * 60 + leftMinute - (rightHour * 60 + rightMinute);

    if (timeDifference !== 0) return timeDifference;
    return (
      DAILY_PLAN_ACTION_TIE_ORDER.indexOf(left) -
      DAILY_PLAN_ACTION_TIE_ORDER.indexOf(right)
    );
  });
}

/**
 * The order the user dragged the three dailies into, if it is still an order of
 * exactly those three.
 *
 * Storage is free text and outlives the version that wrote it, and a daily that
 * appeared or was renamed since would leave a list that is no longer the day.
 * Anything short of the full set is refused so the caller falls back to the
 * schedule instead of drawing a partial one.
 */
export function sanitizeDailyPlanOrder(
  raw: unknown,
): DailyPlanActionId[] | null {
  if (!Array.isArray(raw)) return null;
  if (raw.length !== DAILY_PLAN_ACTION_TIE_ORDER.length) return null;

  const seen = new Set<string>();
  for (const actionId of raw) {
    if (typeof actionId !== 'string') return null;
    if (!DAILY_PLAN_ACTION_TIE_ORDER.includes(actionId as DailyPlanActionId)) {
      return null;
    }
    if (seen.has(actionId)) return null;
    seen.add(actionId);
  }

  return raw as DailyPlanActionId[];
}

/**
 * The order to draw the dailies in: the one the user arranged, or the order the
 * day happens in for anyone who never has.
 *
 * Dragging a daily is a change to this list and to nothing else — the hours
 * stay where they were set, so the reminder for a daily keeps firing when it
 * always did and the card keeps saying so.
 */
export function resolveDailyPlanOrder(
  stored: unknown,
  actions: Partial<Record<DailyPlanActionId, unknown>>,
): DailyPlanActionId[] {
  return sanitizeDailyPlanOrder(stored) ?? sortDailyPlanActionIdsByTime(actions);
}
