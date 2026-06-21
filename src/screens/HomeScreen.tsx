import { useCallback, useEffect, useState } from 'react';
import { AppState, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trackFeatureGateHit } from '../services/analytics/tracking';
import { colors } from '../theme/colors';
import { spacing, padding, margin } from '../theme/spacing';
import { typography, fonts } from '../theme/typography';
import AmbientBackground from '../components/common/AmbientBackground';
import AppTopBar from '../components/common/AppTopBar';
import TopBarWeekCalendar from '../components/common/TopBarWeekCalendar';
import SectionHeader from '../components/common/SectionHeader';
import TodayInsights from '../components/home/TodayInsights';
import InsightsFlashCard from '../components/home/InsightsFlashCard';
import { buildInsights, SAMPLE_INSIGHTS } from '../lib/insights';
import { estimateLungAge } from '../lib/lungAge';
import BreathingLibrary from '../components/home/BreathingLibrary';
import DailyPlanCard from '../components/home/DailyPlanCard';
import MoodChipRow from '../components/home/MoodChipRow';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';
import { formatLocalDate } from '../lib/calendar/weekCalendarDays';
import type { HomeScreenProps } from '../app/navigation';
import { useHomeStatsQuery } from '../queries/tracking/useHomeStatsQuery';
import { useAuthStore } from '../stores/authStore';
import { PaywallPlacement } from '../services/paywall';
import { FeatureKey } from '../services/subscriptions/featureAccess';
import type {
  FeatureAccessResult,
  FeatureKeyValue,
} from '../services/subscriptions/featureAccess';
import type { DailyActivitySummary } from '../services/tracking/types';

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
  const user = useAuthStore((state) => state.user);
  const profileSummaryQuery = useProfileSummaryQuery(user?.id ?? null);
  const displayName = profileSummaryQuery.data?.profile?.displayName ?? null;
  const dailyExerciseAccess = useFeatureAccess(FeatureKey.DailyExercise);
  const advancedStatsAccess = useFeatureAccess(FeatureKey.AdvancedStats);
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

  // The recently-logged list and its analytics now live on the Heart tab
  // (see RecentlyLoggedSection — it uses useIsFocused to gate the view event).

  const currentStreak = stats?.streak?.currentStreak ?? 0;
  const breathHoldAvgBpm = todayBreathHold?.avgBpm ?? null;
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
    feature: FeatureKeyValue,
    placement: typeof PaywallPlacement[keyof typeof PaywallPlacement],
    access: FeatureAccessResult,
    sourceAction?: string,
  ) => {
    trackFeatureGateHit({
      feature,
      placement,
      sourceScreen: 'Home',
      sourceAction,
      access,
    });
    navigation.navigate('ProPaywall', {
      placement,
      sourceScreen: 'Home',
      sourceAction,
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
            leftSlot={(
              <TopBarWeekCalendar
                todayLocalDate={todayLocalDate}
                selectedLocalDate={selectedLocalDate}
                completedDaysAgo={stats?.completedDaysAgo ?? []}
                streakDays={currentStreak}
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
                    dailyExerciseAccess,
                    'daily_plan',
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
              advancedStatsAccess,
              'insights_flash',
            );
          }}
          onStartTechnique={(techniqueId) => {
            if (!dailyExerciseAccess.allowed && !dailyExerciseAccess.isLoading) {
              showProPaywall(
                FeatureKey.DailyExercise,
                PaywallPlacement.ExercisePremiumGate,
                dailyExerciseAccess,
                'insights_technique',
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
});
