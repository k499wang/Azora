import { formatLocalDate, parseLocalDate } from '../../../lib/calendar/weekCalendarDays';

export const COACHING_OFFER_DAYS = 3;

export interface CoachingOfferVisits {
  lastLocalDate: string;
  consecutiveDays: number;
  dismissed: boolean;
}

function dayAfter(localDate: string): string {
  const next = parseLocalDate(localDate);
  next.setDate(next.getDate() + 1);
  return formatLocalDate(next);
}

/** Reaching the target is permanent: a later missed day does not withdraw the offer. */
export function recordCoachingOfferVisit(
  previous: CoachingOfferVisits | null,
  todayLocalDate: string,
): CoachingOfferVisits {
  if (previous == null) {
    return { lastLocalDate: todayLocalDate, consecutiveDays: 1, dismissed: false };
  }
  if (previous.lastLocalDate === todayLocalDate) return previous;

  const consecutiveDays =
    previous.consecutiveDays >= COACHING_OFFER_DAYS
      ? previous.consecutiveDays
      : dayAfter(previous.lastLocalDate) === todayLocalDate
        ? previous.consecutiveDays + 1
        : 1;

  return { ...previous, lastLocalDate: todayLocalDate, consecutiveDays };
}
