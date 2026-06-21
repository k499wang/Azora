import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, fonts } from '../theme/typography';
import AmbientBackground from '../components/common/AmbientBackground';
import AppTopBar from '../components/common/AppTopBar';
import { MeasureHeroCard } from '../components/heartRate/MeasureHeroCard';
import HeartRateStatsSection from '../components/heartRate/HeartRateStatsSection';
import HRVStatsSection from '../components/heartRate/HRVStatsSection';
import RecoveryStatsSection from '../components/heartRate/RecoveryStatsSection';
import { RecentlyLoggedSection } from '../components/heartRate/RecentlyLoggedSection';
import { colors } from '../theme/colors';
import { spacing, padding, margin } from '../theme/spacing';
import { useAuthStore } from '../stores/authStore';
import { useProfileQuery } from '../queries/profile/useProfileQuery';
import { useHeartRateStatsQuery } from '../queries/tracking/useHeartRateStatsQuery';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { FeatureKey } from '../services/subscriptions/featureAccess';
import { PaywallPlacement } from '../services/paywall';
import { trackFeatureGateHit } from '../services/analytics/tracking';
import type {
  FeatureAccessResult,
  FeatureKeyValue,
} from '../services/subscriptions/featureAccess';
import type { HeartTabScreenProps } from '../app/navigation';

export default function HeartTabScreen({ navigation }: HeartTabScreenProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const heartRateStatsQuery = useHeartRateStatsQuery(user?.id ?? null);
  const profileQuery = useProfileQuery(user?.id ?? null);
  const advancedStatsAccess = useFeatureAccess(FeatureKey.AdvancedStats);

  const stats = heartRateStatsQuery.data;
  const recentHeartRates = stats?.recent ?? [];
  const stressHistory = stats?.stressHistory ?? [];
  const ibiMs = stats?.ibiSeries.map((point) => point.ibiMs) ?? [];
  const advancedStatsLocked =
    !advancedStatsAccess.allowed && !advancedStatsAccess.isLoading;
  const partialStatsError =
    stats != null
      ? Object.values(stats.partialErrors).some(Boolean)
      : false;
  const recentHeartRatesError =
    heartRateStatsQuery.isError ||
    (stats?.partialErrors.recent ?? false);
  const hrvSource = stats?.hrvSource;
  const canonicalSession = hrvSource?.session ?? null;
  // Eyebrow string rendered above the Measure hero card so the user knows
  // whether the stats below reflect today's full reading, an older full
  // reading, or that there's no recent full reading at all.
  const measureEyebrow =
    hrvSource == null
      ? 'No recent full reading'
      : hrvSource.kind === 'no_recent_full'
        ? 'No recent full reading'
        : hrvSource.kind === 'today_full'
          ? undefined
          : hrvSource.ageDays === 1
            ? 'Yesterday'
            : `${hrvSource.ageDays} days ago`;

  const openProPaywall = useCallback(
    (
      feature: FeatureKeyValue,
      placement: typeof PaywallPlacement[keyof typeof PaywallPlacement],
      access: FeatureAccessResult,
      sourceAction?: string,
    ) => {
      trackFeatureGateHit({
        feature,
        placement,
        sourceScreen: 'Heart',
        sourceAction,
        access,
      });
      navigation.navigate('ProPaywall', {
        placement,
        sourceScreen: 'Heart',
        sourceAction,
        feature,
      });
    },
    [navigation],
  );

  const openMeasure = useCallback(() => {
    navigation.navigate('HeartRate');
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
          <AppTopBar leftSlot={<View />} />
          <View style={styles.titleSection}>
            <Text style={styles.title}>Heart</Text>
            <Text style={styles.subtitle}>
              Measure, track, and understand your heart.
            </Text>
          </View>
        </View>

        <View style={styles.heroSection}>
          {measureEyebrow ? (
            <Text style={styles.heroEyebrow}>{measureEyebrow}</Text>
          ) : null}
          <MeasureHeroCard onPress={openMeasure} />
        </View>

        {partialStatsError || heartRateStatsQuery.isError ? (
          <Text style={styles.partialErrorText}>
            Some stats may be out of date.
          </Text>
        ) : null}

        <HeartRateStatsSection
          hrDrop={canonicalSession == null ? null : stats?.hrv.hrDrop ?? null}
          minBpm={canonicalSession?.minBpm ?? null}
          avgBpm={canonicalSession?.avgBpm ?? null}
          age={profileQuery.data?.age ?? null}
          ibiMs={ibiMs}
          locked={advancedStatsLocked}
          onPressUpgrade={() =>
            openProPaywall(
              FeatureKey.AdvancedStats,
              PaywallPlacement.DailyResultProGate,
              advancedStatsAccess,
              'heart_rate_section',
            )
          }
        />

        <HRVStatsSection
          rmssd={stats?.hrv.rmssd ?? null}
          sdnn={stats?.hrv.sdnn ?? null}
          avgRmssd={stats?.hrv.avgRmssd ?? null}
          avgSdnn={stats?.hrv.avgSdnn ?? null}
          maxRmssd={stats?.hrv.maxRmssd ?? null}
          maxSdnn={stats?.hrv.maxSdnn ?? null}
          ibiMs={ibiMs}
          locked={advancedStatsLocked}
          onPressUpgrade={() =>
            openProPaywall(
              FeatureKey.AdvancedStats,
              PaywallPlacement.DailyResultProGate,
              advancedStatsAccess,
              'hrv_section',
            )
          }
        />

        <RecoveryStatsSection
          stress={canonicalSession == null ? null : stats?.hrv.stress ?? null}
          stressHistory={stressHistory}
          locked={advancedStatsLocked}
          onPressUpgrade={() =>
            openProPaywall(
              FeatureKey.AdvancedStats,
              PaywallPlacement.DailyResultProGate,
              advancedStatsAccess,
              'recovery_section',
            )
          }
        />

        <RecentlyLoggedSection
          items={recentHeartRates}
          hasError={recentHeartRatesError}
          isLoading={heartRateStatsQuery.isLoading}
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
  titleSection: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  title: {
    fontSize: 32,
    lineHeight: 36,
    fontFamily: 'Outfit-SemiBold',
    color: colors.text.primary,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.tertiary,
    fontFamily: 'Outfit-Medium',
  },
  heroSection: {
    marginTop: spacing.xs,
  },
  heroEyebrow: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginHorizontal: padding.screen.horizontal,
    marginBottom: spacing.xs,
  },
  partialErrorText: {
    color: colors.text.tertiary,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: padding.screen.horizontal,
  },
});
