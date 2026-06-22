import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, fonts } from '../theme/typography';
import AmbientBackground from '../components/common/AmbientBackground';
import AppTopBar from '../components/common/AppTopBar';
import FeatureInfoDialog from '../components/common/FeatureInfoDialog';
import Icon from '../components/common/icons/Icon';
import { MeasureHeroCard } from '../components/heartRate/MeasureHeroCard';
import HeartRateStatsSection from '../components/heartRate/HeartRateStatsSection';
import HRVStatsSection from '../components/heartRate/HRVStatsSection';
import RecoveryStatsSection from '../components/heartRate/RecoveryStatsSection';
import { RecentlyLoggedSection } from '../components/heartRate/RecentlyLoggedSection';
import Skeleton from '../components/common/Skeleton';
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

function formatLocalDate(localDate: string): string {
  const [year, month, day] = localDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

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
  const [infoVisible, setInfoVisible] = useState(false);

  const stats = heartRateStatsQuery.data;
  const recentHeartRates = stats?.recent ?? [];
  const lastMeasuredDate = recentHeartRates[0]?.localDate ?? null;
  const stressHistory = stats?.stressHistory ?? [];
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
  // Eyebrow string rendered above the Measure hero card to tell the user how
  // old the full reading the stats reflect is. Today's reading and the
  // no-recent-reading cases render nothing.
  const measureEyebrow =
    hrvSource == null || hrvSource.kind === 'no_recent_full'
      ? undefined
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
          <AppTopBar
            leftSlot={<Text style={styles.title}>Heart Rate</Text>}
            rightSlot={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="About heart rate"
                hitSlop={12}
                onPress={() => setInfoVisible(true)}
                style={({ pressed }) => pressed && styles.infoPressed}
              >
                <Icon name="info" size={24} color={colors.text.tertiary} />
              </Pressable>
            }
          />
        </View>

        <View style={styles.heroSection}>
          {measureEyebrow ? (
            <Text style={styles.heroEyebrow}>{measureEyebrow}</Text>
          ) : null}
          <MeasureHeroCard onPress={openMeasure} />
          <View style={styles.lastMeasuredSlot}>
            {heartRateStatsQuery.isLoading ? (
              <Skeleton width={120} height={10} radius={5} />
            ) : lastMeasuredDate ? (
              <Text style={styles.lastMeasuredText}>
                Last measured {formatLocalDate(lastMeasuredDate)}
              </Text>
            ) : null}
          </View>
        </View>

        {partialStatsError || heartRateStatsQuery.isError ? (
          <Text style={styles.partialErrorText}>
            Some stats may be out of date.
          </Text>
        ) : null}

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
          lastMeasuredLabel={lastMeasuredLabel}
        />

        <RecentlyLoggedSection
          items={recentHeartRates}
          hasError={recentHeartRatesError}
          isLoading={heartRateStatsQuery.isLoading}
        />
      </ScrollView>

      <FeatureInfoDialog
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        title="Heart Rate"
        intro="Rest your fingertip on the camera and our PPG engine reads your pulse in seconds — the same optics used in pulse oximeters and the Apple Watch, with no wearable needed. It's built on peer-reviewed methods and benchmarked against medical-grade ECG, drawing on research from institutions like Harvard and Stanford. One reading gives you your resting, average, and peak heart rate plus how far it drops after exertion — all signs of a strong, fit heart. It also measures HRV, the micro-timing between beats, where higher variability means a well-rested, resilient nervous system. From that we track a stress score over time, so you always know when to push and when to rest."
      />
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
  infoPressed: {
    opacity: 0.6,
  },
  heroSection: {
    marginTop: 0,
  },
  heroEyebrow: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginHorizontal: padding.screen.horizontal,
    marginBottom: spacing.xs,
  },
  lastMeasuredSlot: {
    marginTop: spacing.sm,
    height: typography.caption.caption2.lineHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lastMeasuredText: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  partialErrorText: {
    color: colors.text.tertiary,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: padding.screen.horizontal,
  },
});
