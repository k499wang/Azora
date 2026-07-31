import {
  DEFAULT_DAILY_PLAN_SCHEDULE,
  type DailyPlanSchedule,
} from './types';

const CLOCK_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

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
