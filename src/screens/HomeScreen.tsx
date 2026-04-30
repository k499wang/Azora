import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing, padding, margin } from '../theme/spacing';
import AppTopBar from '../components/common/AppTopBar';
import SectionHeader from '../components/common/SectionHeader';
import WeekCalendar from '../components/home/WeekCalendar';
import HeartHealthSection from '../components/home/HeartHealthSection';
import HomeTopMesh from '../components/home/HomeTopMesh';
import SessionStatsPager from '../components/home/SessionStatsPager';
import EmptyStateCard from '../components/home/EmptyStateCard';
import BreathingLibrary from '../components/home/BreathingLibrary';
import DailyPlanCard from '../components/home/DailyPlanCard';
import type { HomeScreenProps } from '../app/navigation';
import { useHomeStatsQuery } from '../queries/tracking/useHomeStatsQuery';
import { useAuthStore } from '../stores/authStore';

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return '2:00';
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export default function HomeScreen(_: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const homeStatsQuery = useHomeStatsQuery(user?.id ?? null);
  const stats = homeStatsQuery.data;
  const todayBreathHold = stats?.todayBreathHold ?? null;
  const todayHeartRate = stats?.todayHeartRate ?? null;
  const ibiMs = stats?.ibiSeries.map((point) => point.ibiMs) ?? [];
  const currentStreak = stats?.streak?.currentStreak ?? 0;
  const avgBpm = todayBreathHold?.avgBpm ?? todayHeartRate?.avgBpm ?? null;
  const healthScore = stats?.hrv.stress == null ? null : 100 - stats.hrv.stress;
  const hasPartialStatsError = stats != null && Object.values(stats.partialErrors).some(Boolean);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.topSection, { paddingTop: insets.top }]}>
          <HomeTopMesh />

          <AppTopBar streak={currentStreak} />

          <WeekCalendar completedDaysAgo={stats?.completedDaysAgo ?? []} />

          <View style={styles.planSection}>
            <DailyPlanCard
              duration={formatDuration(todayBreathHold?.holdSeconds)}
              streakDays={currentStreak}
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
            avgBpm={avgBpm}
            holdSeconds={todayBreathHold?.holdSeconds ?? null}
            healthScore={healthScore}
            ibiMs={ibiMs}
          />
        </View>

        <HeartHealthSection
          rmssd={stats?.hrv.rmssd ?? null}
          sdnn={stats?.hrv.sdnn ?? null}
          stress={stats?.hrv.stress ?? null}
          hrDrop={stats?.hrv.hrDrop ?? null}
        />

        <BreathingLibrary />

        <View style={styles.recentSection}>
          <SectionHeader title="Recently logged" />
          <EmptyStateCard
            title={
              todayHeartRate == null
                ? 'No heart rate logged yet'
                : `Latest heart rate: ${todayHeartRate.avgBpm ?? '--'} bpm`
            }
            subtitle={
              homeStatsQuery.isError
                ? 'Stats could not load from Supabase.'
                : hasPartialStatsError
                  ? 'Some Home stats could not refresh. The available data is still shown.'
                : todayHeartRate == null
                  ? 'Press the blue circle button on the menu bar to measure your heart rate.'
                  : 'Standalone heart-rate capture from today.'
            }
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
    paddingBottom: spacing['5xl'],
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
  },
  recentSection: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
    gap: spacing.md,
  },
});
