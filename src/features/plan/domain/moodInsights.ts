import { MOOD_SCALES, type MoodLevel } from '../../mood/domain/moodCheckIn';
import { MOOD_FEELINGS } from '../../mood/domain/moodFeelings';
import { MOOD_TAGS } from '../../mood/domain/moodTags';
import {
  checkInMood,
  moodTrend,
  type AnalyticsCheckIn,
  type MoodTrendPoint,
} from './moodAnalytics';

/** One daily row per date: a year of history, the longest the trend draws. */
export const MOOD_INSIGHT_HISTORY_LIMIT = 366;
/** A short history still draws as a fortnight, so one dot is not the whole chart. */
const MIN_TREND_DAYS = 14;
const MAX_FEELINGS = 10;
const MAX_IMPACTS = 8;
const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;
/** Each band runs from its start hour to the next band's. Late wraps past midnight. */
const TIMES_OF_DAY = [
  { label: 'Morning', from: 5 },
  { label: 'Afternoon', from: 12 },
  { label: 'Evening', from: 17 },
  { label: 'Late', from: 21 },
] as const;

export interface MoodDistributionBucket {
  level: MoodLevel;
  label: string;
  days: number;
}

export interface FeelingInsight {
  feelingId: string;
  label: string;
  days: number;
  /** The mood this feeling was usually logged with. */
  level: MoodLevel;
}

/** A tag's rough days against its good days; okay days count for neither side. */
export interface ImpactInsight {
  tagId: string;
  label: string;
  roughDays: number;
  goodDays: number;
}

export interface MoodGroupInsight {
  label: string;
  days: number;
  distribution: MoodDistributionBucket[];
}

export interface MoodInsights {
  checkInCount: number;
  /** The first check-in the insights cover, or null before there is one. */
  since: string | null;
  /** The most logged mood; ties go to the lower one so the summary never flatters. */
  usualLevel: MoodLevel | null;
  trend: MoodTrendPoint[];
  distribution: MoodDistributionBucket[];
  feelings: FeelingInsight[];
  weekdays: MoodGroupInsight[];
  /** Check-ins saved before the time was recorded are left out. */
  timesOfDay: MoodGroupInsight[];
  impacts: ImpactInsight[];
}

function moodLevel(value: number): MoodLevel {
  return Math.max(1, Math.min(5, Math.round(value))) as MoodLevel;
}

function distribution(checkIns: AnalyticsCheckIn[]): MoodDistributionBucket[] {
  return MOOD_SCALES[0].labels.map((label, index) => {
    const level = (index + 1) as MoodLevel;
    const days = checkIns.filter((checkIn) => moodLevel(checkInMood(checkIn)) === level).length;
    return { level, label, days };
  });
}

function daysInclusive(from: string, to: string): number {
  const [start, end] = [from, to].map((date) => {
    const [year, month, day] = date.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  });
  return Math.round((end - start) / 86_400_000) + 1;
}

function group(label: string, checkIns: AnalyticsCheckIn[]): MoodGroupInsight {
  return { label, days: checkIns.length, distribution: distribution(checkIns) };
}

function weekdayIndex(localDate: string): number {
  const [year, month, day] = localDate.split('-').map(Number);
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

function timeOfDayIndex(createdAt: string): number {
  const hour = new Date(createdAt).getHours();
  const index = TIMES_OF_DAY.findLastIndex((band) => hour >= band.from);
  return index === -1 ? TIMES_OF_DAY.length - 1 : index;
}

const byCount = <T extends { days: number; label: string }>(a: T, b: T) =>
  b.days - a.days || a.label.localeCompare(b.label);

/** Everything logged up to today, in one picture. */
export function moodInsights({
  checkIns,
  todayLocalDate,
}: {
  checkIns: AnalyticsCheckIn[];
  todayLocalDate: string;
}): MoodInsights {
  const logged = checkIns.filter((checkIn) => checkIn.localDate <= todayLocalDate);
  const since = logged.reduce<string | null>(
    (first, checkIn) => (first == null || checkIn.localDate < first ? checkIn.localDate : first),
    null,
  );
  const trendDays = since == null
    ? MIN_TREND_DAYS
    : Math.min(Math.max(daysInclusive(since, todayLocalDate), MIN_TREND_DAYS), MOOD_INSIGHT_HISTORY_LIMIT);
  const overall = distribution(logged);
  const usual = overall.reduce((best, bucket) => (bucket.days > best.days ? bucket : best));

  const feelings = MOOD_FEELINGS.flatMap((feeling) => {
    const days = logged.filter((checkIn) => checkIn.feeling === feeling.id);
    if (days.length === 0) return [];
    const mean = days.reduce((sum, checkIn) => sum + checkInMood(checkIn), 0) / days.length;
    return [{
      feelingId: feeling.id, label: feeling.label,
      days: days.length, level: moodLevel(mean),
    }];
  }).sort(byCount).slice(0, MAX_FEELINGS);

  const impacts = MOOD_TAGS.flatMap((tag) => {
    const levels = logged
      .filter((checkIn) => checkIn.tags.includes(tag.id))
      .map((checkIn) => moodLevel(checkInMood(checkIn)));
    const roughDays = levels.filter((level) => level <= 2).length;
    const goodDays = levels.filter((level) => level >= 4).length;
    if (roughDays + goodDays === 0) return [];
    return [{ tagId: tag.id, label: tag.label, roughDays, goodDays }];
  })
    // The most-logged tags make the cut, then read positive first.
    .sort((a, b) => b.roughDays + b.goodDays - (a.roughDays + a.goodDays) || a.label.localeCompare(b.label))
    .slice(0, MAX_IMPACTS)
    .sort((a, b) => b.goodDays - b.roughDays - (a.goodDays - a.roughDays) || a.label.localeCompare(b.label));

  const timed = logged.filter((checkIn) => checkIn.createdAt != null);

  return {
    checkInCount: logged.length,
    since,
    usualLevel: usual.days === 0 ? null : usual.level,
    trend: moodTrend(logged, todayLocalDate, trendDays),
    distribution: overall,
    feelings,
    weekdays: WEEKDAY_LABELS.map((label, index) =>
      group(label, logged.filter((checkIn) => weekdayIndex(checkIn.localDate) === index))),
    timesOfDay: TIMES_OF_DAY.map((band, index) =>
      group(band.label, timed.filter((checkIn) => timeOfDayIndex(checkIn.createdAt as string) === index))),
    impacts,
  };
}
