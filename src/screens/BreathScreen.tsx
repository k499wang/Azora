import { useCallback, useState } from 'react';
import {
  ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trackFeatureGateHit } from '../services/analytics/tracking';
import { colors } from '../theme/colors';
import { spacing, padding, margin } from '../theme/spacing';
import AmbientBackground from '../components/common/AmbientBackground';
import AppTopBar from '../components/common/AppTopBar';
import CompactActionBanner from '../components/common/CompactActionBanner';
import SectionHeader from '../components/common/SectionHeader';
import ScoreRing from '../components/exercise/ScoreRing';
import ProUpgradeButton from '../components/common/ProUpgradeButton';
import ProfileBreathHoldTrendCard from '../components/profile/ProfileBreathHoldTrendCard';
import HeartRateStatsSection from '../components/heartRate/HeartRateStatsSection';
import { getBackgroundImageSource } from '../services/images/backgroundImageCache';
import {
  estimateLungAge,
  lungAgeRingFill,
  lungAgeToneMeta,
} from '../lib/lungAge';
import { benchmarkBreathHold } from '../lib/breathHoldPercentile';
import { deriveHoldStats } from '../lib/holdStats';
import { formatLocalDate } from '../lib/calendar/weekCalendarDays';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useHomeStatsQuery } from '../queries/tracking/useHomeStatsQuery';
import { useBreathHoldBpmSeriesQuery } from '../queries/tracking/useBreathHoldBpmSeriesQuery';
import { useProfileQuery } from '../queries/profile/useProfileQuery';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';import { useAuthStore } from '../stores/authStore';
import { PaywallPlacement } from '../services/paywall';
import { FeatureKey } from '../services/subscriptions/featureAccess';
import type {
  FeatureAccessResult,
  FeatureKeyValue,
} from '../services/subscriptions/featureAccess';
import type { BreathTabScreenProps } from '../app/navigation';

const HERO_FRAME_ASPECT_RATIO = 1.1;
const HERO_OVERSCROLL_BLEED = 120;

export default function BreathScreen({ navigation }: BreathTabScreenProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const user = useAuthStore((state) => state.user);
  const [todayLocalDate] = useState(() => formatLocalDate(new Date()));

  const homeStatsQuery = useHomeStatsQuery(user?.id ?? null, todayLocalDate);
  const profileSummaryQuery = useProfileSummaryQuery(user?.id ?? null);
  const profileQuery = useProfileQuery(user?.id ?? null);
  const advancedStatsAccess = useFeatureAccess(FeatureKey.AdvancedStats);
  const dailyExerciseAccess = useFeatureAccess(FeatureKey.DailyExercise);

  const stats = homeStatsQuery.data;
  const todayBreathHold = stats?.todayBreathHold ?? null;
  const breathHoldBpmSeriesQuery = useBreathHoldBpmSeriesQuery(
    user?.id ?? null,
    todayBreathHold?.sessionId ?? null,
  );
  const holdStats = deriveHoldStats(stats?.dailyActivity, todayLocalDate);
  const profileSummary = profileSummaryQuery.data;
  const breathHoldTrend = profileSummary?.breathHoldTrend ?? [];
  const userAge = profileQuery.data?.age ?? null;

  const holdSeconds =
    todayBreathHold?.holdSeconds != null && todayBreathHold.holdSeconds > 0
      ? todayBreathHold.holdSeconds
      : null;

  const hrDropBpm =
    todayBreathHold?.avgBpm != null && todayBreathHold.minBpm != null
      ? Math.max(0, todayBreathHold.avgBpm - todayBreathHold.minBpm)
      : null;

  const lungAge =
    holdSeconds != null ? estimateLungAge(holdSeconds, userAge) : null;
  const benchmark =
    holdSeconds != null && userAge != null
      ? benchmarkBreathHold(holdSeconds, userAge)
      : null;
  const comparisonLabel = benchmark
    ? `You are in the top ${benchmark.topPercent}% of people your age`
    : null;
  const lungAgeTone = lungAgeToneMeta(lungAge?.deltaYears ?? null);

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
                source={getBackgroundImageSource('breathHero')}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                contentPosition="center"
              />
            </MaskedView>
          </View>
          <AppTopBar />
        </View>

        <View style={styles.heroSection}>
          <ScoreRing
            value={lungAge?.years ?? 0}
            fill={lungAge != null ? lungAgeRingFill(lungAge.years) : 0}
            placeholder={lungAge == null}
            size={250}
            valueFontSize={90}
            ringColors={lungAgeTone.ringColors}
            caption="years"
            captionPosition="bottom"
            captionTextTransform="none"
            captionFontSize={16}
            gapLabel={comparisonLabel}
            gapTextColor={lungAgeTone.textColor}
            gapDirection={lungAgeTone.direction}
          />
        </View>

        <View style={styles.section}>
          <CompactActionBanner
            icon="breath-hold"
            label={lungAge
              ? 'Ready to beat your record?'
              : 'Tap to measure your lung age'}
            onPress={measureHold}
            accessibilityLabel="Measure breath hold"
          />
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
            bestHoldSeconds={holdStats.bestHoldSeconds}
            todayHoldSeconds={todayBreathHold?.holdSeconds ?? null}
            avgHoldSeconds={holdStats.avgHoldSeconds}
            locked={advancedStatsLocked}
            onPressLocked={openTrendPaywall}
          />
        </View>

        <HeartRateStatsSection
          hrDrop={hrDropBpm}
          minBpm={todayBreathHold?.minBpm ?? null}
          maxBpm={todayBreathHold?.maxBpm ?? null}
          avgBpm={todayBreathHold?.avgBpm ?? null}
          age={userAge}
          bpmSamples={breathHoldBpmSeriesQuery.data ?? []}
          locked={advancedStatsLocked}
          onPressUpgrade={openTrendPaywall}
          emptyChartMessage="Complete today's breath hold with heart rate enabled to see your BPM."
          insightContext="breath-hold"
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
  section: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.md,
  },
  heroSection: {
    paddingHorizontal: padding.screen.horizontal,
    alignItems: 'center',
    marginTop: -margin.sectionGap,
  },
});
