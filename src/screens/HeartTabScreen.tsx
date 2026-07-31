import { Text } from '../components/common/Text';
import { useCallback } from 'react';
import {
  ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
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
import { getBackgroundImageSource } from '../services/images/backgroundImageCache';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { FeatureKey } from '../services/subscriptions/featureAccess';
import { PaywallPlacement } from '../services/paywall';
import { trackFeatureGateHit } from '../services/analytics/tracking';
import type {
  FeatureAccessResult,
  FeatureKeyValue,
} from '../services/subscriptions/featureAccess';
import type { HeartTabScreenProps } from '../app/navigation';

const HERO_FRAME_ASPECT_RATIO = 1.1;
const HERO_OVERSCROLL_BLEED = 120;

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
  const { width: windowWidth } = useWindowDimensions();
  const user = useAuthStore((state) => state.user);
  const heartRateStatsQuery = useHeartRateStatsQuery(user?.id ?? null);
  const profileQuery = useProfileQuery(user?.id ?? null);
  const advancedStatsAccess = useFeatureAccess(FeatureKey.AdvancedStats);

  const stats = heartRateStatsQuery.data;
  const recentHeartRates = stats?.recent ?? [];
  const lastMeasuredDate = recentHeartRates[0]?.localDate ?? null;
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
  const heroBackdropHeight = windowWidth / HERO_FRAME_ASPECT_RATIO + HERO_OVERSCROLL_BLEED;

  return (
    <View style={styles.screen}>
      <AmbientBackground />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
      >
        <View style={[styles.topSection, { paddingTop: insets.top }]}>
          <View
            style={[styles.heroBackdrop, { height: heroBackdropHeight }]}
            pointerEvents="none"
          >
            <MaskedView
              style={StyleSheet.absoluteFill}
              maskElement={(
                <LinearGradient
                  colors={['transparent', 'black', 'black', 'transparent']}
                  locations={[0, 0.34, 0.65, 1]}
                  style={StyleSheet.absoluteFill}
                />
              )}
            >
              <Image
                source={getBackgroundImageSource('heartHero')}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                contentPosition="center"
              />
            </MaskedView>
          </View>
          <AppTopBar />
        </View>

        <View style={styles.heroSection}>
          <MeasureHeroCard onPress={openMeasure} />
          <View style={styles.lastMeasuredSlot}>
            {lastMeasuredDate ? (
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
    position: 'relative',
    paddingTop: spacing.md,
  },
  heroBackdrop: {
    position: 'absolute',
    top: -HERO_OVERSCROLL_BLEED,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  heroSection: {
    marginTop: -spacing.xl,
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
