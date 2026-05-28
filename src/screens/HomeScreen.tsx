import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePostHog } from 'posthog-react-native';
import { getStressZone } from '../lib/heartRate/stress';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnalyticsEvent } from '../services/analytics/events';
import { colors } from '../theme/colors';
import { spacing, padding, margin } from '../theme/spacing';
import { typography, fonts } from '../theme/typography';
import { card } from '../theme/card';
import AmbientBackground from '../components/common/AmbientBackground';
import AppTopBar from '../components/common/AppTopBar';
import TopBarWeekCalendar from '../components/common/TopBarWeekCalendar';
import SectionHeader from '../components/common/SectionHeader';
import HRVSection from '../components/home/HRVSection';
import HeartRateSection from '../components/home/HeartRateSection';
import RecoverySection from '../components/home/RecoverySection';
import TodayInsights from '../components/home/TodayInsights';
import InsightsFlashCard from '../components/home/InsightsFlashCard';
import { buildInsights, SAMPLE_INSIGHTS } from '../lib/insights';
import { estimateLungAge } from '../lib/lungAge';
import EmptyStateCard from '../components/home/EmptyStateCard';
import BreathingLibrary from '../components/home/BreathingLibrary';
import DailyPlanCard from '../components/home/DailyPlanCard';
import MoodChipRow from '../components/home/MoodChipRow';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';
import { useProfileQuery } from '../queries/profile/useProfileQuery';
import { formatLocalDate } from '../lib/calendar/weekCalendarDays';
import type { HomeScreenProps } from '../app/navigation';
import { useHomeStatsQuery } from '../queries/tracking/useHomeStatsQuery';
import { useAuthStore } from '../stores/authStore';
import { PaywallPlacement } from '../services/paywall';
import { FeatureKey } from '../services/subscriptions/featureAccess';
import type { DailyActivitySummary, TodayHeartRateSummary } from '../services/tracking/types';

function formatInsightTitle(localDate: string, todayLocalDate: string): string {
  const [year, month, day] = localDate.split('-').map(Number);
  const selected = new Date(year, month - 1, day);

  if (localDate === todayLocalDate) {
    return 'Today\'s insights';
  }

  return `${new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(selected)} insights`;
}

function getMsUntilNextLocalDay(): number {
  const now = new Date();
  const nextDay = new Date(now);
  nextDay.setHours(24, 0, 1, 0);

  return Math.max(1000, nextDay.getTime() - now.getTime());
}

function formatRelativeDay(value: string): string {
  const date = new Date(value);
  const now = new Date();
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(date);
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatReadingDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

function deriveHoldStats(
  dailyActivity: DailyActivitySummary[] | undefined,
  todayLocalDate: string,
): { lastHoldSeconds: number | null; bestHoldSeconds: number | null; avgHoldSeconds: number | null } {
  if (!dailyActivity || dailyActivity.length === 0) {
    return { lastHoldSeconds: null, bestHoldSeconds: null, avgHoldSeconds: null };
  }

  const sorted = [...dailyActivity].sort((a, b) =>
    a.activityDate < b.activityDate ? 1 : a.activityDate > b.activityDate ? -1 : 0,
  );

  const lastEntry = sorted.find(
    (row) => row.activityDate !== todayLocalDate && row.bestHoldSeconds != null,
  );

  let max: number | null = null;
  let sum = 0;
  let count = 0;
  for (const row of sorted) {
    if (row.bestHoldSeconds == null) continue;
    if (max == null || row.bestHoldSeconds > max) max = row.bestHoldSeconds;
    if (row.activityDate !== todayLocalDate && count < 7) {
      sum += row.bestHoldSeconds;
      count += 1;
    }
  }

  return {
    lastHoldSeconds: lastEntry?.bestHoldSeconds ?? null,
    bestHoldSeconds: max,
    avgHoldSeconds: count > 0 ? sum / count : null,
  };
}

function computeStress(rmssd: number | null, avgBpm: number | null): number | null {
  if (rmssd == null || avgBpm == null) return null;
  const rmssdScore = Math.max(0, 100 - (rmssd / 60) * 100);
  const hrScore = Math.max(0, ((avgBpm - 50) / 30) * 100);
  return Math.max(0, Math.min(100, Math.round(rmssdScore * 0.7 + hrScore * 0.3)));
}

function MetricInline({
  iconColor,
  iconBg,
  value,
}: {
  iconColor: string;
  iconBg: string;
  value: string;
}) {
  return (
    <View style={styles.metricInline}>
      <View style={[styles.metricDot, { backgroundColor: iconBg }]}>
        <View style={[styles.metricDotInner, { backgroundColor: iconColor }]} />
      </View>
      <Text style={styles.metricInlineValue}>{value}</Text>
    </View>
  );
}

function RecentHeartRateList({
  items,
  hasError,
  onPressItem,
}: {
  items: TodayHeartRateSummary[];
  hasError: boolean;
  onPressItem: (sessionId: string, position: number) => void;
}) {
  if (items.length === 0) {
    return (
      <EmptyStateCard
        title="No heart rate logged yet"
        subtitle={
          hasError
            ? 'Stats could not load from Supabase.'
            : 'Press the circle button on the bottom and click the measure heart rate button to log a reading.'
        }
      />
    );
  }

  return (
    <View style={styles.recentList}>
      {items.map((item, index) => {
        const stress = computeStress(item.rmssd, item.avgBpm);
        const stressZone = stress == null ? null : getStressZone(stress);
        const metrics: {
          key: string;
          iconColor: string;
          iconBg: string;
          value: string;
        }[] = [];
        if (stress != null && stressZone != null) {
          metrics.push({
            key: 'stress',
            iconColor: stressZone.color,
            iconBg: stressZone.color + '22',
            value: `${stressZone.label} stress`,
          });
        }
        if (item.hrDrop != null) {
          metrics.push({
            key: 'hrDrop',
            iconColor: colors.primary.blue600,
            iconBg: colors.primary.blue100,
            value: `${item.hrDrop} HR drop`,
          });
        }

        return (
          <Pressable
            key={item.sessionId}
            onPress={() => onPressItem(item.sessionId, index)}
            style={({ pressed }) => [
              styles.recentCard,
              pressed ? styles.recentCardPressed : null,
            ]}
          >
            <View style={styles.recentThumb}>
              <Text style={styles.recentThumbBpm}>{item.avgBpm ?? '--'}</Text>
              <Text style={styles.recentThumbUnit}>bpm</Text>
            </View>
            <View style={styles.recentBody}>
              <View style={styles.recentRowTop}>
                <Text style={styles.recentLabel}>
                  {formatRelativeDay(item.startedAt)}
                </Text>
                <Text style={styles.recentTime}>{formatTime(item.startedAt)}</Text>
              </View>
              <Text style={styles.recentDuration}>
                {formatReadingDuration(item.durationSeconds)} reading
              </Text>
              {metrics.length > 0 ? (
                <View style={styles.metricRow}>
                  {metrics.map((m) => (
                    <MetricInline
                      key={m.key}
                      iconColor={m.iconColor}
                      iconBg={m.iconBg}
                      value={m.value}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function StreakNudge({
  streakDays,
  todayDone,
}: {
  streakDays: number;
  todayDone: boolean;
}) {
  let message: string;
  if (todayDone) {
    if (streakDays <= 0) return null;
    message =
      streakDays === 1
        ? 'Day 1 locked in — see you tomorrow'
        : `${streakDays}-day streak locked in for today`;
  } else if (streakDays <= 0) {
    message = 'Start your streak with today’s hold';
  } else if (streakDays === 1) {
    message = 'Day 1 in the books — keep it going today';
  } else {
    message = `${streakDays}-day streak — don’t break it today`;
  }

  return (
    <Text style={styles.streakNudge} numberOfLines={1} ellipsizeMode="tail">
      {message}
    </Text>
  );
}

function Greeting({ displayName }: { displayName: string | null | undefined }) {
  const firstName = displayName?.trim().split(/\s+/)[0];
  if (!firstName) return null;
  return (
    <Text style={styles.greeting} numberOfLines={1} ellipsizeMode="tail">
      Hi, {firstName}
    </Text>
  );
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const posthog = usePostHog();
  const user = useAuthStore((state) => state.user);
  const profileSummaryQuery = useProfileSummaryQuery(user?.id ?? null);
  const profileQuery = useProfileQuery(user?.id ?? null);
  const displayName = profileSummaryQuery.data?.profile?.displayName ?? null;
  const dailyExerciseAccess = useFeatureAccess(FeatureKey.DailyExercise);
  const advancedStatsAccess = useFeatureAccess(FeatureKey.AdvancedStats);
  const sessionHistoryAccess = useFeatureAccess(FeatureKey.SessionHistory);
  const [todayLocalDate, setTodayLocalDate] = useState(() => formatLocalDate(new Date()));
  const [selectedLocalDate, setSelectedLocalDate] = useState(todayLocalDate);
  const refreshTodayLocalDate = useCallback(() => {
    const nextTodayLocalDate = formatLocalDate(new Date());

    if (nextTodayLocalDate === todayLocalDate) {
      return;
    }

    setTodayLocalDate(nextTodayLocalDate);
    setSelectedLocalDate((currentSelectedLocalDate) =>
      currentSelectedLocalDate === todayLocalDate
        ? nextTodayLocalDate
        : currentSelectedLocalDate,
    );
  }, [todayLocalDate]);
  const homeStatsQuery = useHomeStatsQuery(user?.id ?? null, selectedLocalDate);
  const stats = homeStatsQuery.data;
  const todayBreathHold = stats?.todayBreathHold ?? null;
  const todayHeartRate = stats?.todayHeartRate ?? null;
  const recentHeartRates = stats?.recentHeartRates ?? [];
  const recentHeartRatesError =
    homeStatsQuery.isError || stats?.partialErrors.recentHeartRates === true;
  const recentlyLoggedViewedRef = useRef(false);
  useEffect(() => {
    const timeout = setTimeout(refreshTodayLocalDate, getMsUntilNextLocalDay());

    return () => clearTimeout(timeout);
  }, [refreshTodayLocalDate]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshTodayLocalDate();
      }
    });

    return () => subscription.remove();
  }, [refreshTodayLocalDate]);

  useEffect(() => {
    if (recentlyLoggedViewedRef.current) return;
    if (homeStatsQuery.isLoading) return;
    recentlyLoggedViewedRef.current = true;
    posthog.capture(AnalyticsEvent.RecentlyLoggedViewed, {
      item_count: recentHeartRates.length,
      has_error: recentHeartRatesError,
    });
  }, [homeStatsQuery.isLoading, posthog, recentHeartRates.length, recentHeartRatesError]);
  const ibiMs = stats?.ibiSeries.map((point) => point.ibiMs) ?? [];
  const currentStreak = stats?.streak?.currentStreak ?? 0;
  const breathHoldAvgBpm = todayBreathHold?.avgBpm ?? null;
  const heartRateAvgBpm = todayHeartRate?.avgBpm ?? null;
  const lungEstimate =
    todayBreathHold?.holdSeconds != null && todayBreathHold.holdSeconds > 0
      ? estimateLungAge({
          holdSeconds: todayBreathHold.holdSeconds,
          avgBpm: todayBreathHold.avgBpm ?? undefined,
          minBpm: todayBreathHold.minBpm ?? undefined,
        })
      : null;
  const advancedStatsLocked = !advancedStatsAccess.allowed && !advancedStatsAccess.isLoading;
  const hasPartialStatsError = stats != null && Object.values(stats.partialErrors).some(Boolean);
  const holdStats = deriveHoldStats(stats?.dailyActivity, todayLocalDate);
  const showProPaywall = useCallback((
    feature: typeof FeatureKey[keyof typeof FeatureKey],
    placement: typeof PaywallPlacement[keyof typeof PaywallPlacement],
  ) => {
    navigation.navigate('ProPaywall', {
      placement,
      sourceScreen: 'Home',
      feature,
    });
  }, [navigation]);

  return (
    <View style={styles.screen}>
      <AmbientBackground />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.topSection, { paddingTop: insets.top }]}>
          <AppTopBar
            streak={currentStreak}
            leftSlot={(
              <TopBarWeekCalendar
                todayLocalDate={todayLocalDate}
                selectedLocalDate={selectedLocalDate}
                completedDaysAgo={stats?.completedDaysAgo ?? []}
                onSelectDay={setSelectedLocalDate}
              />
            )}
          />

          <View style={styles.planSection}>
            <Greeting displayName={displayName} />
            <StreakNudge
              streakDays={currentStreak}
              todayDone={todayBreathHold?.holdSeconds != null}
            />
            <DailyPlanCard
              todayHoldSeconds={todayBreathHold?.holdSeconds ?? null}
              lastHoldSeconds={holdStats.lastHoldSeconds}
              bestHoldSeconds={holdStats.bestHoldSeconds}
              streakDays={currentStreak}
              onPress={() => {
                if (!dailyExerciseAccess.allowed && !dailyExerciseAccess.isLoading) {
                  showProPaywall(
                    FeatureKey.DailyExercise,
                    PaywallPlacement.ExercisePremiumGate,
                  );
                  return;
                }

                navigation.navigate('DailyExercise');
              }}
            />
          </View>
        </View>

        <BreathingLibrary />

        <View style={styles.moodChipSection}>
          <View style={styles.moodHeader}>
            <SectionHeader title="How are you feeling?" />
          </View>
          <MoodChipRow />
        </View>

        <View style={styles.section}>
          {hasPartialStatsError || homeStatsQuery.isError ? (
            <Text style={styles.partialErrorText}>
              Some stats may be out of date.
            </Text>
          ) : null}
          <TodayInsights
            title={formatInsightTitle(selectedLocalDate, todayLocalDate)}
            avgBpm={breathHoldAvgBpm}
            holdSeconds={todayBreathHold?.holdSeconds ?? null}
            bestHoldSeconds={holdStats.bestHoldSeconds}
            lungAge={lungEstimate?.age ?? null}
            lungAgeTier={lungEstimate?.key ?? null}
          />
        </View>

        <InsightsFlashCard
          locked={advancedStatsLocked}
          onPressUpgrade={() => {
            showProPaywall(
              FeatureKey.AdvancedStats,
              PaywallPlacement.DailyResultProGate,
            );
          }}
          onStartTechnique={(techniqueId) => {
            if (!dailyExerciseAccess.allowed && !dailyExerciseAccess.isLoading) {
              showProPaywall(
                FeatureKey.DailyExercise,
                PaywallPlacement.ExercisePremiumGate,
              );
              return;
            }
            navigation.navigate('ExerciseSession', { techniqueId });
          }}
          insights={
            advancedStatsLocked
              ? SAMPLE_INSIGHTS
              : buildInsights({
                  rmssd: stats?.hrv.rmssd ?? null,
                  avgRmssd: stats?.hrv.avgRmssd ?? null,
                  sdnn: stats?.hrv.sdnn ?? null,
                  hrDrop: stats?.hrv.hrDrop ?? null,
                  minBpm: todayHeartRate?.minBpm ?? null,
                  stress: stats?.hrv.stress ?? null,
                  stressHistory: stats?.stressHistory ?? [],
                  todayHoldSeconds: todayBreathHold?.holdSeconds ?? null,
                  bestHoldSeconds: holdStats.bestHoldSeconds,
                })
          }
        />

        <HRVSection
          rmssd={stats?.hrv.rmssd ?? null}
          sdnn={stats?.hrv.sdnn ?? null}
          avgRmssd={stats?.hrv.avgRmssd ?? null}
          avgSdnn={stats?.hrv.avgSdnn ?? null}
          maxRmssd={stats?.hrv.maxRmssd ?? null}
          maxSdnn={stats?.hrv.maxSdnn ?? null}
          ibiMs={ibiMs}
          locked={advancedStatsLocked}
          onPressUpgrade={() => {
            showProPaywall(
              FeatureKey.AdvancedStats,
              PaywallPlacement.DailyResultProGate,
            );
          }}
        />

        <HeartRateSection
          hrDrop={stats?.hrv.hrDrop ?? null}
          minBpm={todayHeartRate?.minBpm ?? null}
          avgBpm={heartRateAvgBpm}
          age={profileQuery.data?.age ?? null}
          ibiMs={ibiMs}
          locked={advancedStatsLocked}
          onPressUpgrade={() => {
            showProPaywall(
              FeatureKey.AdvancedStats,
              PaywallPlacement.DailyResultProGate,
            );
          }}
        />

        <RecoverySection
          stress={stats?.hrv.stress ?? null}
          stressHistory={stats?.stressHistory ?? []}
          locked={advancedStatsLocked}
          onPressUpgrade={() => {
            showProPaywall(
              FeatureKey.AdvancedStats,
              PaywallPlacement.DailyResultProGate,
            );
          }}
        />

        <View style={styles.recentSection}>
          <SectionHeader title="Recently logged" />
          <RecentHeartRateList
            items={recentHeartRates}
            hasError={recentHeartRatesError}
            onPressItem={(sessionId, position) => {
              posthog.capture(AnalyticsEvent.RecentlyLoggedSessionOpened, {
                session_id: sessionId,
                position,
                item_count: recentHeartRates.length,
              });
              if (sessionHistoryAccess.isLoading) return;

              if (
                position > 0 &&
                !sessionHistoryAccess.allowed &&
                !sessionHistoryAccess.isLoading
              ) {
                showProPaywall(
                  FeatureKey.SessionHistory,
                  PaywallPlacement.DailyResultProGate,
                );
                return;
              }
              navigation.navigate('HeartRateSessionDetail', { sessionId });
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: spacing['7xl'] + spacing.xl,
    gap: margin.sectionGap,
  },
  topSection: {
    paddingTop: spacing.md,
  },
  section: {
    paddingHorizontal: padding.screen.horizontal,
  },
  partialErrorText: {
    color: colors.text.tertiary,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  planSection: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  moodChipSection: {
    gap: spacing.sm,
  },
  moodHeader: {
    paddingHorizontal: padding.screen.horizontal,
  },
  greeting: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  streakNudge: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
    marginTop: -spacing.xs,
  },
  recentSection: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.md,
  },
  recentList: {
    gap: spacing.sm,
  },
  recentCard: {
    ...card.base,
    ...card.shadow,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  recentCardPressed: {
    opacity: 0.75,
  },
  recentThumb: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
  },
  recentThumbBpm: {
    fontSize: 32,
    lineHeight: 34,
    fontFamily: fonts.semibold,
    color: colors.error[500],
    letterSpacing: -0.8,
  },
  recentThumbUnit: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    color: colors.error[500],
    marginTop: 1,
    letterSpacing: 0.5,
  },
  recentBody: {
    flex: 1,
    gap: spacing.xs,
  },
  recentRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  recentTime: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
  },
  recentDuration: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metricDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metricInlineValue: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
});
