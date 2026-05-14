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
import AppTopBar from '../components/common/AppTopBar';
import TopBarWeekCalendar from '../components/common/TopBarWeekCalendar';
import SectionHeader from '../components/common/SectionHeader';
import HeartHealthSection from '../components/home/HeartHealthSection';
import RecoverySection from '../components/home/RecoverySection';
import SessionStatsPager from '../components/home/SessionStatsPager';
import EmptyStateCard from '../components/home/EmptyStateCard';
import BreathingLibrary from '../components/home/BreathingLibrary';
import DailyPlanCard from '../components/home/DailyPlanCard';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';
import { formatLocalDate } from '../lib/calendar/weekCalendarDays';
import type { HomeScreenProps } from '../app/navigation';
import { useHomeStatsQuery } from '../queries/tracking/useHomeStatsQuery';
import { useAuthStore } from '../stores/authStore';
import { PaywallPlacement } from '../services/paywall';
import { FeatureKey } from '../services/subscriptions/featureAccess';
import type { TodayHeartRateSummary } from '../services/tracking/types';

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return '2:00';
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

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
            : 'Press the blue circle button on the menu bar to measure your heart rate.'
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
  const avgBpm = todayBreathHold?.avgBpm ?? todayHeartRate?.avgBpm ?? null;
  const healthScore = stats?.hrv.stress == null ? null : 100 - stats.hrv.stress;
  const advancedStatsLocked = !advancedStatsAccess.allowed && !advancedStatsAccess.isLoading;
  const hasPartialStatsError = stats != null && Object.values(stats.partialErrors).some(Boolean);
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
            <DailyPlanCard
              duration={formatDuration(todayBreathHold?.holdSeconds)}
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

        <View style={styles.section}>
          {hasPartialStatsError || homeStatsQuery.isError ? (
            <Text style={styles.partialErrorText}>
              Some stats may be out of date.
            </Text>
          ) : null}
          <SessionStatsPager
            title={formatInsightTitle(selectedLocalDate, todayLocalDate)}
            avgBpm={avgBpm}
            holdSeconds={todayBreathHold?.holdSeconds ?? null}
            healthScore={healthScore}
            ibiMs={ibiMs}
          />
        </View>

        <BreathingLibrary />

        <HeartHealthSection
          rmssd={stats?.hrv.rmssd ?? null}
          sdnn={stats?.hrv.sdnn ?? null}
          locked={advancedStatsLocked}
          onPressUpgrade={() => {
            showProPaywall(
              FeatureKey.AdvancedStats,
              PaywallPlacement.DailyResultProGate,
            );
          }}
        />

        <RecoverySection
          rmssd={stats?.hrv.rmssd ?? null}
          sdnn={stats?.hrv.sdnn ?? null}
          stress={stats?.hrv.stress ?? null}
          hrDrop={stats?.hrv.hrDrop ?? null}
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
  },
  scrollContent: {
    paddingBottom: spacing['7xl'] + spacing.xl,
  },
  topSection: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    overflow: 'hidden',
  },
  section: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: spacing.md,
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
  greeting: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  recentSection: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
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
