import { Text } from '../components/common/Text';
import { useCallback } from 'react';
import {
  ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppTopBar from '../components/common/AppTopBar';
import GlassIconButton from '../components/common/GlassIconButton';
import Icon from '../components/common/icons/Icon';
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

function formatMeasuredTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function HeartTabScreen({ navigation }: HeartTabScreenProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const heartRateStatsQuery = useHeartRateStatsQuery(user?.id ?? null);
  const profileQuery = useProfileQuery(user?.id ?? null);
  const advancedStatsAccess = useFeatureAccess(FeatureKey.AdvancedStats);

  const stats = heartRateStatsQuery.data;
  const recentHeartRates = stats?.recent ?? [];
  const bpmSamples = stats?.bpmSeries ?? [];
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
  const lastMeasuredLabel = canonicalSession?.startedAt
    ? `last measured at ${formatMeasuredTime(canonicalSession.startedAt)}`
    : undefined;
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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
      >
        <AppTopBar
          showAvatar={false}
          rightSlot={<View style={styles.topBarActionPlaceholder} />}
        />

        <View style={styles.statsContent}>
          {partialStatsError || heartRateStatsQuery.isError ? (
            <Text style={styles.partialErrorText}>
              Some stats may be out of date.
            </Text>
          ) : null}

          <RecoveryStatsSection
            stress={canonicalSession == null ? null : stats?.hrv.stress ?? null}
            locked={advancedStatsLocked}
            onPressUpgrade={() =>
              openProPaywall(
                FeatureKey.AdvancedStats,
                PaywallPlacement.DailyResultProGate,
                advancedStatsAccess,
                'recovery_section',
              )
            }
            lastMeasuredLabel={lastMeasuredLabel}
          />

          <HeartRateStatsSection
            hrDrop={canonicalSession == null ? null : stats?.hrv.hrDrop ?? null}
            minBpm={canonicalSession?.minBpm ?? null}
            maxBpm={canonicalSession?.maxBpm ?? null}
            avgBpm={canonicalSession?.avgBpm ?? null}
            age={profileQuery.data?.age ?? null}
            bpmSamples={bpmSamples}
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
            avgBpm={canonicalSession?.avgBpm ?? null}
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
            lastMeasuredLabel={lastMeasuredLabel}
          />

          <RecentlyLoggedSection
            items={recentHeartRates}
            hasError={recentHeartRatesError}
            isLoading={heartRateStatsQuery.isLoading}
          />
        </View>
      </ScrollView>

      <GlassIconButton
        accessibilityLabel="Measure heart rate"
        onPress={openMeasure}
        size={48}
        style={[styles.stickyAction, { top: insets.top + spacing.xs }]}
        variant="regular"
      >
        <Icon name="plus" size={26} color={colors.text.secondary} />
      </GlassIconButton>
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
  },
  statsContent: {
    paddingTop: spacing.md,
    gap: margin.sectionGap,
  },
  topBarActionPlaceholder: {
    width: 48,
    height: 48,
  },
  stickyAction: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 1,
    elevation: 1,
  },
  partialErrorText: {
    color: colors.text.tertiary,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: padding.screen.horizontal,
  },
});
