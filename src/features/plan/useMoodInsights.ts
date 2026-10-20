import { useMemo } from 'react';
import type { AnalyticsCheckIn } from './domain/moodAnalytics';
import { moodInsights } from './domain/moodInsights';

export { MOOD_INSIGHT_HISTORY_LIMIT } from './domain/moodInsights';

export function useMoodInsights(checkIns: AnalyticsCheckIn[], todayLocalDate: string) {
  return useMemo(
    () => moodInsights({ checkIns, todayLocalDate }),
    [checkIns, todayLocalDate],
  );
}
