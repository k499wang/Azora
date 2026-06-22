import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trackFeatureGateHit } from '../services/analytics/tracking';
import { colors } from '../theme/colors';
import { spacing, padding, margin } from '../theme/spacing';
import { typography, fonts } from '../theme/typography';
import AmbientBackground from '../components/common/AmbientBackground';
import AppTopBar from '../components/common/AppTopBar';
import SectionHeader from '../components/common/SectionHeader';
import CardSurface from '../components/common/CardSurface';
import Icon from '../components/common/icons/Icon';
import BiologicalAgeRing from '../components/exercise/BiologicalAgeRing';
import InsightsFlashCard from '../components/home/InsightsFlashCard';
import ProUpgradeButton from '../components/common/ProUpgradeButton';
import ProfileBreathHoldTrendCard from '../components/profile/ProfileBreathHoldTrendCard';
import { buildInsights, SAMPLE_INSIGHTS } from '../lib/insights';
import { estimateLungAge } from '../lib/lungAge';
import { deriveHoldStats } from '../lib/holdStats';
import { formatLocalDate } from '../lib/calendar/weekCalendarDays';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useHomeStatsQuery } from '../queries/tracking/useHomeStatsQuery';
import { useProfileQuery } from '../queries/profile/useProfileQuery';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';
import { useAuthStore } from '../stores/authStore';
import { PaywallPlacement } from '../services/paywall';
import { FeatureKey } from '../services/subscriptions/featureAccess';
import type {
  FeatureAccessResult,
  FeatureKeyValue,
} from '../services/subscriptions/featureAccess';
import type { BreathTabScreenProps } from '../app/navigation';

export default function BreathScreen({ navigation }: BreathTabScreenProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const [todayLocalDate] = useState(() => formatLocalDate(new Date()));

  const homeStatsQuery = useHomeStatsQuery(user?.id ?? null, todayLocalDate);
  const profileSummaryQuery = useProfileSummaryQuery(user?.id ?? null);
  const profileQuery = useProfileQuery(user?.id ?? null);
  const advancedStatsAccess = useFeatureAccess(FeatureKey.AdvancedStats);
  const dailyExerciseAccess = useFeatureAccess(FeatureKey.DailyExercise);

  const stats = homeStatsQuery.data;
  const todayBreathHold = stats?.todayBreathHold ?? null;
  const todayHeartRate = stats?.todayHeartRate ?? null;
  const holdStats = deriveHoldStats(stats?.dailyActivity, todayLocalDate);
  const breathHoldTrend = profileSummaryQuery.data?.breathHoldTrend ?? [];
  const userAge = profileQuery.data?.age ?? null;

  const lungEstimate =
    todayBreathHold?.holdSeconds != null && todayBreathHold.holdSeconds > 0
      ? estimateLungAge({
          holdSeconds: todayBreathHold.holdSeconds,
          avgBpm: todayBreathHold.avgBpm ?? undefined,
          minBpm: todayBreathHold.minBpm ?? undefined,
        })
      : null;

  const advancedStatsLocked =
    !advancedStatsAccess.allowed && !advancedStatsAccess.isLoading;

  const showProPaywall = useCallback(
    (
      feature: FeatureKeyValue,
      placement: typeof PaywallPlacement[keyof typeof PaywallPlacement],
      access: FeatureAccessResult,
      sourceAction?: string,
    ) => {
      trackFeatureGateHit({
        feature,
        placement,
        sourceScreen: 'Breath',
        sourceAction,
        access,
      });
      navigation.navigate('ProPaywall', {
        placement,
        sourceScreen: 'Breath',
        sourceAction,
        feature,
      });
    },
    [navigation],
  );

  const measureHold = useCallback(() => {
    if (!dailyExerciseAccess.allowed && !dailyExerciseAccess.isLoading) {
      showProPaywall(
        FeatureKey.DailyExercise,
        PaywallPlacement.ExercisePremiumGate,
        dailyExerciseAccess,
        'breath_measure',
      );
      return;
    }
    navigation.navigate('DailyExercise');
  }, [dailyExerciseAccess, navigation, showProPaywall]);

  const openTrendPaywall = useCallback(
    () =>
      showProPaywall(
        FeatureKey.AdvancedStats,
        PaywallPlacement.DailyResultProGate,
        advancedStatsAccess,
        'breath_trend',
      ),
    [showProPaywall, advancedStatsAccess],
  );

  return (
    <View style={styles.screen}>
      <AmbientBackground />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.topSection, { paddingTop: insets.top }]}>
          <AppTopBar leftSlot={<Text style={styles.title}></Text>} />
        </View>

        <View style={styles.heroSection}>
          {lungEstimate ? (
            <BiologicalAgeRing
              lungAge={lungEstimate.age}
              userAge={userAge}
              size={240}
              gapLabel={null}
            />
          ) : (
            <CardSurface style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Lung age</Text>
              <Text style={styles.emptyText}>
                Complete a breath hold today to see your estimated lung age.
              </Text>
            </CardSurface>
          )}
        </View>

        <View style={styles.section}>
          <Pressable
            onPress={measureHold}
            accessibilityRole="button"
            accessibilityLabel="Measure breath hold"
            style={({ pressed }) => pressed && styles.measurePressed}
          >
            <CardSurface style={styles.measureCard}>
              <View style={styles.measureIconWrap}>
                <Icon name="breath-hold" size={24} color={colors.primary.blue600} />
              </View>
              <Text style={styles.measureTitle}>Ready to beat your record?</Text>
              <Icon name="chevron-right" size={22} color={colors.text.tertiary} />
            </CardSurface>
          </Pressable>
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Progress"
            right={
              advancedStatsLocked ? (
                <ProUpgradeButton onPress={openTrendPaywall} />
              ) : null
            }
          />
          <ProfileBreathHoldTrendCard
            data={breathHoldTrend}
            locked={advancedStatsLocked}
            onPressLocked={openTrendPaywall}
          />
        </View>

        <View style={styles.insightsHeader}>
          <SectionHeader title="Insights" />
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
  title: {
    fontFamily: fonts.semibold,
    fontSize: 22,
    color: colors.text.primary,
  },
  section: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.md,
  },
  heroSection: {
    paddingHorizontal: padding.screen.horizontal,
    alignItems: 'center',
    marginTop: -spacing.xl,
  },
  emptyCard: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.text.tertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  emptyText: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  measureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primary.blue500,
  },
  measureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.blue100,
  },
  measureTitle: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  measurePressed: {
    opacity: 0.85,
  },
  insightsHeader: {
    paddingHorizontal: padding.screen.horizontal,
  },
});
