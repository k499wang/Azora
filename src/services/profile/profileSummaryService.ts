import { requireSupabaseClient } from '../supabase';
import type { Database } from '../supabase/database.types';
import { getCompletedDaysAgoFromActivityDates } from '../../lib/calendar/weekCalendarDays';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type BreathHoldRow = Pick<
  Database['public']['Tables']['breath_hold_sessions']['Row'],
  'hold_seconds' | 'local_date'
>;
type DailyActivityRow = Pick<
  Database['public']['Tables']['daily_activity']['Row'],
  'activity_date' | 'qualifies_for_streak'
>;
type StreakRow = Database['public']['Views']['user_streaks_v']['Row'];

export interface ProfileSummary {
  profile: {
    displayName: string | null;
    avatarUrl: string | null;
    timezone: string;
  } | null;
  longestHoldSeconds: number | null;
  breathHoldCount: number;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
  completedDays: number[];
  completedDaysAgo: number[];
  breathHoldTrend: Array<{
    label: string;
    value: number;
  }>;
  partialErrors: ProfileSummaryPartialErrors;
}

export interface ProfileSummaryPartialErrors {
  profile: boolean;
  longestHold: boolean;
  breathHoldCount: boolean;
  activeDays: boolean;
  streak: boolean;
  completedDays: boolean;
  breathHoldTrend: boolean;
}

const RECENT_TREND_SESSION_LIMIT = 90;
const TREND_POINT_LIMIT = 30;

function getMonthRange(date: Date): { start: string; end: string } {
  const year = date.getFullYear();
  const month = date.getMonth();

  return {
    start: toDateKey(new Date(year, month, 1)),
    end: toDateKey(new Date(year, month + 1, 1)),
  };
}

function getRecentActivityStart(date: Date, days: number): string {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - (days - 1));

  return toDateKey(start);
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function secondsToDisplay(totalSeconds: number | null): string {
  if (totalSeconds == null) {
    return '0:00';
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');

  return `${minutes}:${seconds}`;
}

function mapCompletedDays(rows: DailyActivityRow[], monthStart: string, monthEnd: string): number[] {
  return rows
    .filter((row) => row.activity_date >= monthStart && row.activity_date < monthEnd)
    .filter((row) => row.qualifies_for_streak)
    .map((row) => {
      const [, , day] = row.activity_date.split('-').map(Number);
      return day;
    });
}

function mapCompletedDaysAgo(rows: DailyActivityRow[], today: Date): number[] {
  return getCompletedDaysAgoFromActivityDates(
    rows.map((row) => ({
      activityDate: row.activity_date,
      qualifiesForStreak: row.qualifies_for_streak,
    })),
    today,
  );
}

function mapTrend(rows: BreathHoldRow[]): ProfileSummary['breathHoldTrend'] {
  const byDate = new Map<string, number>();

  rows
    .slice()
    .reverse()
    .forEach((row) => {
      const currentBest = byDate.get(row.local_date) ?? 0;
      byDate.set(row.local_date, Math.max(currentBest, row.hold_seconds));
    });

  return Array.from(byDate.entries())
    .slice(-TREND_POINT_LIMIT)
    .map(([date, summary]) => ({
      label: String(Number(date.slice(8, 10))),
      value: summary,
    }));
}

export function formatProfileHoldTime(totalSeconds: number | null): string {
  return secondsToDisplay(totalSeconds);
}

export async function getProfileSummary(userId: string): Promise<ProfileSummary> {
  const supabase = requireSupabaseClient();
  const today = new Date();
  const { start, end } = getMonthRange(today);
  const recentStart = getRecentActivityStart(today, 28);
  const activityStart = start < recentStart ? start : recentStart;

  const profileQuery = supabase
    .from('profiles')
    .select('display_name, avatar_url, timezone')
    .eq('user_id', userId)
    .maybeSingle();

  const longestHoldQuery = supabase
    .from('breath_hold_sessions')
    .select('hold_seconds, local_date')
    .eq('user_id', userId)
    .order('hold_seconds', { ascending: false })
    .limit(1)
    .maybeSingle();

  const breathHoldCountQuery = supabase
    .from('breath_hold_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  const activeDaysQuery = supabase
    .from('daily_activity')
    .select('activity_date', { count: 'exact', head: true })
    .eq('user_id', userId);

  const streakQuery = supabase
    .from('user_streaks_v')
    .select('current_streak, longest_streak')
    .eq('user_id', userId)
    .maybeSingle();

  const completedDaysQuery = supabase
    .from('daily_activity')
    .select('activity_date, qualifies_for_streak')
    .eq('user_id', userId)
    .gte('activity_date', activityStart)
    .lt('activity_date', end)
    .order('activity_date', { ascending: true });

  const breathHoldTrendQuery = supabase
    .from('breath_hold_sessions')
    .select('hold_seconds, local_date')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(RECENT_TREND_SESSION_LIMIT);

  const [
    profileResult,
    longestHoldResult,
    breathHoldCountResult,
    activeDaysResult,
    streakResult,
    completedDaysResult,
    breathHoldTrendResult,
  ] = await Promise.allSettled([
    profileQuery,
    longestHoldQuery,
    breathHoldCountQuery,
    activeDaysQuery,
    streakQuery,
    completedDaysQuery,
    breathHoldTrendQuery,
  ]);

  const partialErrors: ProfileSummaryPartialErrors = {
    profile: profileResult.status === 'rejected' || profileResult.value.error != null,
    longestHold: longestHoldResult.status === 'rejected' || longestHoldResult.value.error != null,
    breathHoldCount:
      breathHoldCountResult.status === 'rejected' || breathHoldCountResult.value.error != null,
    activeDays: activeDaysResult.status === 'rejected' || activeDaysResult.value.error != null,
    streak: streakResult.status === 'rejected' || streakResult.value.error != null,
    completedDays:
      completedDaysResult.status === 'rejected' || completedDaysResult.value.error != null,
    breathHoldTrend:
      breathHoldTrendResult.status === 'rejected' || breathHoldTrendResult.value.error != null,
  };

  const profile =
    profileResult.status === 'fulfilled' && profileResult.value.error == null
      ? (profileResult.value.data as ProfileRow | null)
      : null;
  const longestHold =
    longestHoldResult.status === 'fulfilled' && longestHoldResult.value.error == null
      ? (longestHoldResult.value.data as BreathHoldRow | null)
      : null;
  const breathHoldCount =
    breathHoldCountResult.status === 'fulfilled' && breathHoldCountResult.value.error == null
      ? breathHoldCountResult.value.count
      : null;
  const activeDays =
    activeDaysResult.status === 'fulfilled' && activeDaysResult.value.error == null
      ? activeDaysResult.value.count
      : null;
  const streak =
    streakResult.status === 'fulfilled' && streakResult.value.error == null
      ? (streakResult.value.data as Pick<StreakRow, 'current_streak' | 'longest_streak'> | null)
      : null;
  const completedDays =
    completedDaysResult.status === 'fulfilled' && completedDaysResult.value.error == null
      ? ((completedDaysResult.value.data ?? []) as DailyActivityRow[])
      : [];
  const trendRows =
    breathHoldTrendResult.status === 'fulfilled' && breathHoldTrendResult.value.error == null
      ? ((breathHoldTrendResult.value.data ?? []) as BreathHoldRow[])
      : [];

  return {
    profile: profile == null
      ? null
      : {
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
          timezone: profile.timezone,
        },
    longestHoldSeconds: longestHold?.hold_seconds ?? null,
    breathHoldCount: breathHoldCount ?? 0,
    activeDays: activeDays ?? 0,
    currentStreak: streak?.current_streak ?? 0,
    longestStreak: streak?.longest_streak ?? 0,
    completedDays: mapCompletedDays(completedDays, start, end),
    completedDaysAgo: mapCompletedDaysAgo(completedDays, today),
    breathHoldTrend: mapTrend(trendRows),
    partialErrors,
  };
}
