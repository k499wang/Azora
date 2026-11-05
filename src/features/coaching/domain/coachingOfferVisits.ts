export const COACHING_OFFER_DAYS = 3;

export interface CoachingOfferVisits {
  lastLocalDate: string;
  daysVisited: number;
  dismissed: boolean;
}

/** Counts each day the app is open; the days need not be in a row. */
export function recordCoachingOfferVisit(
  previous: CoachingOfferVisits | null,
  todayLocalDate: string,
): CoachingOfferVisits {
  if (previous == null) {
    return { lastLocalDate: todayLocalDate, daysVisited: 1, dismissed: false };
  }
  if (previous.lastLocalDate === todayLocalDate) return previous;

  return {
    ...previous,
    lastLocalDate: todayLocalDate,
    daysVisited: previous.daysVisited + 1,
  };
}
