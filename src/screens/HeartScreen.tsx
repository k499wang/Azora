import { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppTopBar from '../components/common/AppTopBar';
import GlassIconButton from '../components/common/GlassIconButton';
import Icon from '../components/common/icons/Icon';
import ScreenContent from '../components/common/ScreenContent';
import { Text } from '../components/common/Text';
import HeartRateStatsSection from '../components/heartRate/HeartRateStatsSection';
import HRVStatsSection from '../components/heartRate/HRVStatsSection';
import RecoveryStatsSection from '../components/heartRate/RecoveryStatsSection';
import { RecentlyLoggedSection } from '../components/heartRate/RecentlyLoggedSection';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { triggerTapHaptic } from '../native/tapHaptics';
import type { HeartScreenProps } from '../app/navigation';
import { useProfileQuery } from '../queries/profile/useProfileQuery';
import { useHeartRateStatsQuery } from '../queries/tracking/useHeartRateStatsQuery';
import { PaywallPlacement } from '../services/paywall';
import { trackFeatureGateHit } from '../services/analytics/tracking';
import {
  FeatureKey,
  type FeatureAccessResult,
  type FeatureKeyValue,
} from '../services/subscriptions/featureAccess';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../theme/colors';
import { margin, padding, spacing } from '../theme/spacing';
import { useTourTarget } from '../features/tour/tourTargets';

export default function HeartScreen({ navigation }: HeartScreenProps) {
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const statsQuery = useHeartRateStatsQuery(userId);
  const profileQuery = useProfileQuery(userId);
  const advancedStatsAccess = useFeatureAccess(FeatureKey.AdvancedStats);
  const dashboardLayout = useDashboardLayout();
  const startHeartMeasurementTarget = useTourTarget('startHeartMeasurement');
  const stats = statsQuery.data;
  const canonicalSession = stats?.hrvSource.session ?? null;
  const advancedStatsLocked =
    !advancedStatsAccess.allowed && !advancedStatsAccess.isLoading;
  const partialStatsError =
    statsQuery.isError ||
    (stats != null && Object.values(stats.partialErrors).some(Boolean));

  const openProPaywall = useCallback(
    (
      feature: FeatureKeyValue,
      placement: typeof PaywallPlacement[keyof typeof PaywallPlacement],
      access: FeatureAccessResult,
      sourceAction: string,
    ) => {
      trackFeatureGateHit({
        feature,
        placement,
        sourceScreen: 'Heart',
        sourceAction,
        access,
      });
      navigation.navigate('ProPaywall', {
        feature,
        placement,
        sourceScreen: 'Heart',
        sourceAction,
      });
    },
    [navigation],
  );

  const openAdvancedStatsPaywall = (sourceAction: string) =>
    openProPaywall(
      FeatureKey.AdvancedStats,
      PaywallPlacement.DailyResultProGate,
      advancedStatsAccess,
      sourceAction,
    );

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
        <ScreenContent width="dashboard">
          <AppTopBar showBack showAvatar={false} showStreak={false} />
          <View style={styles.statsContent}>
            {partialStatsError ? (
              <Text style={styles.partialErrorText}>Some stats may be out of date.</Text>
            ) : null}
            <RecoveryStatsSection
              stress={canonicalSession == null ? null : stats?.hrv.stress ?? null}
              locked={advancedStatsLocked}
              onPressUpgrade={() => openAdvancedStatsPaywall('recovery_section')}
            />
            <HeartRateStatsSection
              hrDrop={canonicalSession == null ? null : stats?.hrv.hrDrop ?? null}
              minBpm={canonicalSession?.minBpm ?? null}
              maxBpm={canonicalSession?.maxBpm ?? null}
              avgBpm={canonicalSession?.avgBpm ?? null}
              age={profileQuery.data?.age ?? null}
              bpmSamples={stats?.bpmSeries ?? []}
              numberForwardSummary
              locked={advancedStatsLocked}
              onPressUpgrade={() => openAdvancedStatsPaywall('heart_rate_section')}
            />
            <HRVStatsSection
              rmssd={stats?.hrv.rmssd ?? null}
              sdnn={stats?.hrv.sdnn ?? null}
              avgBpm={canonicalSession?.avgBpm ?? null}
              ibiMs={stats?.ibiSeries.map((point) => point.ibiMs) ?? []}
              locked={advancedStatsLocked}
              onPressUpgrade={() => openAdvancedStatsPaywall('hrv_section')}
            />
            <RecentlyLoggedSection
              items={stats?.recent ?? []}
              hasError={statsQuery.isError || (stats?.partialErrors.recent ?? false)}
              isLoading={statsQuery.isLoading}
            />
          </View>
        </ScreenContent>
      </ScrollView>
      <View
        {...startHeartMeasurementTarget}
        style={[
          styles.stickyAction,
          { top: insets.top + spacing.xs, right: dashboardLayout.actionInset },
        ]}
      >
        <GlassIconButton
          accessibilityLabel="Measure heart rate"
          onPress={() => {
            triggerTapHaptic();
            navigation.navigate('HeartRate');
          }}
          size={48}
          variant="regular"
        >
          <Icon name="plus" size={26} color={colors.text.secondary} />
        </GlassIconButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.canvas },
  scroll: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { paddingBottom: spacing['7xl'] + spacing.xl },
  statsContent: { paddingTop: spacing.md, gap: margin.sectionGap },
  stickyAction: { position: 'absolute', zIndex: 2, elevation: 2 },
  partialErrorText: {
    color: colors.text.tertiary,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: padding.screen.horizontal,
  },
});
