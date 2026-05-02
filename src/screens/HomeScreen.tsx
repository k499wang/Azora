import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing, padding, margin } from '../theme/spacing';
import { typography, fonts } from '../theme/typography';
import { card } from '../theme/card';
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
import type { TodayHeartRateSummary } from '../services/tracking/types';

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return '2:00';
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatLoggedAt(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function RecentHeartRateList({
  items,
  hasError,
  onPressItem,
}: {
  items: TodayHeartRateSummary[];
  hasError: boolean;
  onPressItem: (sessionId: string) => void;
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
      {items.map((item) => (
        <Pressable
          key={item.sessionId}
          onPress={() => onPressItem(item.sessionId)}
          style={({ pressed }) => [
            styles.recentCard,
            pressed ? styles.recentCardPressed : null,
          ]}
        >
          <View>
            <Text style={styles.recentLabel}>{formatLoggedAt(item.startedAt)}</Text>
            <Text style={styles.recentMeta}>
              {item.durationSeconds}s reading
              {item.rmssd == null ? '' : ` - RMSSD ${item.rmssd} ms`}
            </Text>
          </View>
          <View style={styles.recentBpmWrap}>
            <Text style={styles.recentBpm}>{item.avgBpm ?? '--'}</Text>
            <Text style={styles.recentBpmUnit}>bpm</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const homeStatsQuery = useHomeStatsQuery(user?.id ?? null);
  const stats = homeStatsQuery.data;
  const todayBreathHold = stats?.todayBreathHold ?? null;
  const todayHeartRate = stats?.todayHeartRate ?? null;
  const recentHeartRates = stats?.recentHeartRates ?? [];
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

        <BreathingLibrary />

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

        <View style={styles.recentSection}>
          <SectionHeader title="Recently logged" />
          <RecentHeartRateList
            items={recentHeartRates}
            hasError={homeStatsQuery.isError || stats?.partialErrors.recentHeartRates === true}
            onPressItem={(sessionId) => {
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
  recentList: {
    gap: spacing.sm,
  },
  recentCard: {
    ...card.base,
    ...card.shadow,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  recentCardPressed: {
    opacity: 0.75,
  },
  recentLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  recentMeta: {
    ...typography.body.small,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
  },
  recentBpmWrap: {
    alignItems: 'flex-end',
    minWidth: 64,
  },
  recentBpm: {
    fontSize: 28,
    lineHeight: 32,
    fontFamily: fonts.bold,
    color: colors.primary.blue600,
  },
  recentBpmUnit: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
  },
});
