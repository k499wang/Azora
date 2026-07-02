import { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trackFeatureGateHit } from '../services/analytics/tracking';
import { colors } from '../theme/colors';
import { spacing, padding, margin } from '../theme/spacing';
import { typography, fonts } from '../theme/typography';
import AmbientBackground from '../components/common/AmbientBackground';
import AppTopBar from '../components/common/AppTopBar';
import FeatureInfoDialog from '../components/common/FeatureInfoDialog';
import SectionHeader from '../components/common/SectionHeader';
import CardSurface from '../components/common/CardSurface';
import Icon from '../components/common/icons/Icon';
import ScoreRing from '../components/exercise/ScoreRing';
import ProUpgradeButton from '../components/common/ProUpgradeButton';
import ProfileBreathHoldTrendCard from '../components/profile/ProfileBreathHoldTrendCard';
import HeartRateStatsSection from '../components/heartRate/HeartRateStatsSection';
import { getBackgroundImageSource } from '../services/images/backgroundImageCache';
import { estimateAzoraScore, azoraScoreFill } from '../lib/azoraScore';
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
  const [infoVisible, setInfoVisible] = useState(false);

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

  const azoraEstimate =
    todayBreathHold?.holdSeconds != null && todayBreathHold.holdSeconds > 0
      ? estimateAzoraScore({
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
          <AppTopBar
            rightSlot={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="About breath holds"
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
          {azoraEstimate ? (
            <ScoreRing
              value={azoraEstimate.score}
              fill={azoraScoreFill(azoraEstimate.score)}
              size={235}
              valueFontSize={78}
              caption="Azora Score"
              captionPosition="bottom"
              captionTextTransform="none"
              gapLabel={null}
            />
          ) : (
            <ScoreRing
              value={0}
              fill={0}
              size={235}
              valueFontSize={78}
              placeholder
              caption="Azora Score"
              captionPosition="bottom"
              captionTextTransform="none"
              gapLabel={null}
            />
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
              <Text style={styles.measureTitle}>
                {azoraEstimate
                  ? 'Ready to beat your record?'
                  : 'Tap to measure your score'}
              </Text>
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
            bestHoldSeconds={holdStats.bestHoldSeconds}
            todayHoldSeconds={todayBreathHold?.holdSeconds ?? null}
            avgHoldSeconds={holdStats.avgHoldSeconds}
            locked={advancedStatsLocked}
            onPressLocked={openTrendPaywall}
          />
        </View>

        <HeartRateStatsSection
          hrDrop={azoraEstimate?.hrDropBpm ?? null}
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

      <FeatureInfoDialog
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        title="Breath Holds"
        intro="A breath hold is the fastest way to reset your mind — pausing your breath calms your nervous system, melts stress, and pulls you out of your head and into the present in under a minute. It's also an honest measure of fitness: longer holds signal greater lung capacity, better oxygen efficiency, and a steadier stress response, which is why divers and elite athletes train it. We turn each hold into an Azora Score from 0 to 100 — longer holds and a bigger heart-rate drop score higher — so you can watch it climb over time. Every hold is logged, and most people add seconds within their first week. Take a minute, hold your breath, and feel the reset — then beat your record and use the personalized insights to go further."
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
  measureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primary.blue200,
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
    color: colors.text.secondary,
    flex: 1,
  },
  measurePressed: {
    opacity: 0.85,
  },
  infoPressed: {
    opacity: 0.6,
  },
});
