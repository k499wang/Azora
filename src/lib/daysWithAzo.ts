import { formatLocalDate, parseLocalDate } from './calendar/weekCalendarDays';

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysWithAzo(createdAtIso: string, todayLocalDate: string): number {
  const signupDate = parseLocalDate(formatLocalDate(new Date(createdAtIso)));
  const today = parseLocalDate(todayLocalDate);
  const elapsedDays = Math.round((today.getTime() - signupDate.getTime()) / DAY_MS);

  return Math.max(1, elapsedDays + 1);
}
