import {
  factorEffects,
  moodTrend,
  resetEffect,
  type AnalyticsActivityDay,
  type AnalyticsCheckIn,
  type FactorEffects,
  type InsightThresholds,
  type MoodTrendPoint,
  type ResetEffect,
} from './moodAnalytics';
import { weeklyReview, type WeeklyReview } from './weeklyReview';

/** Eight weeks of activity rows support the reset comparison. */
export const INSIGHT_ACTIVITY_DAYS = 56;

export interface MoodInsights {
  /** Null while activity is unknown: a week of zero days kept would be invented. */
  review: WeeklyReview | null;
  trend: MoodTrendPoint[];
  reset: ResetEffect | null;
  factors: FactorEffects | null;
}

export function moodInsights({
  checkIns,
  activity,
  todayLocalDate,
  trendDays,
  activityLimit,
  thresholds,
}: {
  checkIns: AnalyticsCheckIn[];
  /** Null while it is still loading. */
  activity: AnalyticsActivityDay[] | null;
  todayLocalDate: string;
  trendDays: number;
  activityLimit: number;
  thresholds?: InsightThresholds;
}): MoodInsights {
  return {
    review:
      activity == null ? null : weeklyReview(activity, checkIns, todayLocalDate),
    trend: moodTrend(checkIns, todayLocalDate, trendDays),
    reset:
      activity == null
        ? null
        : resetEffect(checkIns, activity, activityLimit, thresholds),
    factors: factorEffects(checkIns, thresholds),
  };
}
