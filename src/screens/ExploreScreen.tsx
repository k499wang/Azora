import { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { usePostHog } from 'posthog-react-native';
import type { ExploreScreenProps } from '../app/navigation';
import AppTopBar from '../components/common/AppTopBar';
import SectionHeader from '../components/common/SectionHeader';
import BreathingLibrary from '../components/explore/BreathingLibrary';
import DailyPlanCard from '../components/explore/DailyPlanCard';
import ExerciseSearchBar from '../components/explore/ExerciseSearchBar';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { deriveHoldStats } from '../lib/holdStats';
import { useHomeStatsQuery } from '../queries/tracking/useHomeStatsQuery';
import { AnalyticsEvent } from '../services/analytics/events';
import { trackFeatureGateHit } from '../services/analytics/tracking';
import { PaywallPlacement } from '../services/paywall';
import { FeatureKey } from '../services/subscriptions/featureAccess';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../theme/colors';
import { margin, padding, spacing } from '../theme/spacing';

export default function ExploreScreen({ navigation }: ExploreScreenProps) {
  const posthog = usePostHog();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const todayLocalDate = useTodayLocalDate();
  const homeStatsQuery = useHomeStatsQuery(userId, todayLocalDate);
  const dailyExerciseAccess = useFeatureAccess(FeatureKey.DailyExercise);
  const stats = homeStatsQuery.data;
  const holdStats = deriveHoldStats(stats?.dailyActivity, todayLocalDate);
  const todayBreathHold = stats?.todayBreathHold ?? null;

  const startDailyBreathHold = useCallback(() => {
    posthog.capture(AnalyticsEvent.DailyPlanStarted, {
      streak_days: stats?.streak?.currentStreak ?? 0,
    });

    if (!dailyExerciseAccess.allowed && !dailyExerciseAccess.isLoading) {
      trackFeatureGateHit({
        feature: FeatureKey.DailyExercise,
        placement: PaywallPlacement.ExercisePremiumGate,
        sourceScreen: 'Explore',
        sourceAction: 'daily_plan',
        access: dailyExerciseAccess,
      });
      navigation.navigate('ProPaywall', {
        placement: PaywallPlacement.ExercisePremiumGate,
        sourceScreen: 'Explore',
        sourceAction: 'daily_plan',
        feature: FeatureKey.DailyExercise,
      });
      return;
    }

    navigation.navigate('DailyExercise');
  }, [dailyExerciseAccess, navigation, posthog, stats?.streak?.currentStreak]);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
      >
        <AppTopBar showAvatar={false} showStreak={false} />

        <View style={styles.searchWrap}>
          <ExerciseSearchBar
            mode="entry"
            onPress={() => navigation.navigate('ExerciseSearch')}
          />
        </View>

        <View style={styles.dailyPlanSection}>
          <SectionHeader title="Daily Breathhold" />
          <DailyPlanCard
            todayHoldSeconds={todayBreathHold?.holdSeconds ?? null}
            lastHoldSeconds={holdStats.lastHoldSeconds}
            onPress={startDailyBreathHold}
          />
        </View>

        <BreathingLibrary />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.accentSoft,
  },
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: spacing['7xl'] + spacing.xl,
    gap: margin.sectionGap,
  },
  searchWrap: {
    height: 48,
    paddingHorizontal: padding.screen.horizontal,
  },
  dailyPlanSection: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.md,
  },
});
