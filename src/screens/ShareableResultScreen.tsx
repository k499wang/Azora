import { Text } from '../components/common/Text';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing, padding, margin } from '../theme/spacing';
import DailyCompleteSheet from '../features/room/DailyCompleteSheet';
import GlassIconButton from '../components/common/GlassIconButton';
import ChunkyButton from '../components/common/ChunkyButton';
import { Rise } from '../components/common/Reveal';
import HelpfulnessQuestion from '../components/exercise/HelpfulnessQuestion';
import { BREATH_HOLD_FEEDBACK_ID } from '../lib/sessionKey';
import Icon from '../components/common/icons/Icon';
import { BREATH_HOLD_STYLE } from '../features/exercise/guidedBreathing/categoryPalette';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { card } from '../theme/card';
import HeartRateStatsSection from '../components/heartRate/HeartRateStatsSection';
import type { DailyResultScreenProps } from '../app/navigation';
import { estimateLungAge } from '../lib/lungAge';
import { benchmarkBreathHold } from '../lib/breathHoldPercentile';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { trackFeatureGateHit } from '../services/analytics/tracking';
import { PaywallPlacement } from '../services/paywall';
import { FeatureKey } from '../services/subscriptions/featureAccess';
import { useAuthStore } from '../stores/authStore';
import { useProfileQuery } from '../queries/profile/useProfileQuery';
import { APP_STORE_URL } from '../lib/appStoreLink';
import {
  maybeRequestSessionReview,
  ReviewTrigger,
} from '../services/reviews/storeReview';
import { useOpeningTransitionComplete } from '../app/navigation';
import { useRoomClaim } from '../features/room/useRoomClaim';
import {
  isDailyCompleteRewardReady,
  useDailyCompleteSnapshot,
} from '../features/room/useDailyCompleteSnapshot';
import { useTrackDailyCompletion } from '../features/room/useTrackDailyCompletion';
import { SESSION_GLASS_BUTTON_SIZE } from '../features/exercise/shared/components/SessionGlassButton';
import { duration, stagger } from '../theme/motion';
import { returnToHome } from '../app/navigation/returnToHome';
import ScreenContent from '../components/common/ScreenContent';

// The breath hold is not a guided technique, but feedback is stored per
// technique id, so it answers under its own key.

const HERO_FLAME_SIZE = 132;
const BREATH_HOLD_COMPLETION = { breathHold: true } as const;
const EMPTY_BPM_SAMPLES: { offsetMs: number; bpm: number }[] = [];

// Profile, feature access, room and dailies all resolve while this screen is
// on, and each commit lands mid-entrance and reconciles a whole SVG tree.
// Their props are already stable values, so memoizing lets the reveal own the
// frame.
const ResultHeartRateStatsSection = memo(HeartRateStatsSection);
const ResultHelpfulnessQuestion = memo(HelpfulnessQuestion);

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ShareableResultScreen({
  navigation,
  route,
}: DailyResultScreenProps) {
  const insets = useSafeAreaInsets();
  const advancedStatsAccess = useFeatureAccess(FeatureKey.AdvancedStats);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const profileQuery = useProfileQuery(userId);
  const userAge = profileQuery.data?.age ?? null;
  const firstName =
    profileQuery.data?.displayName?.trim().split(/\s+/)[0] ?? null;
  const todayLocalDate = useTodayLocalDate();
  const hue = BREATH_HOLD_STYLE.hue;
  const {
    holdSeconds,
    sessionKey,
    heartRateResultStatus = 'not_measured',
    avgBpm,
    minBpm,
    maxBpm,
    bpmSamples = EMPTY_BPM_SAMPLES,
  } = route.params;
  const hrDropBpm =
    minBpm != null && maxBpm != null ? Math.max(0, maxBpm - minBpm) : null;

  const [sheetDismissed, setSheetDismissed] = useState(false);
  const [sheetPresented, setSheetPresented] = useState(false);
  const [sheetExitStarted, setSheetExitStarted] = useState(false);
  const openingTransitionComplete =
    useOpeningTransitionComplete(navigation);
  const roomClaim = useRoomClaim(userId);
  const { snapshot, markSeen } = useDailyCompleteSnapshot({
    // Resolve while the native route is moving; presentation still waits for
    // `transitionEnd` below.
    active: true,
    claim: roomClaim,
    projection: BREATH_HOLD_COMPLETION,
  });
  useTrackDailyCompletion(snapshot, roomClaim);
  // Result data comes from the route, so the whole tree is mounted right away
  // and lays out under the opaque cover while the native slide is still
  // running. Nothing heavy is left to commit once the screen is on-screen —
  // `transitionEnd` only decides when things become *visible*.
  const sheetVisible =
    !sheetDismissed && snapshot != null && openingTransitionComplete;
  const showDailyCover = !sheetDismissed && !sheetPresented;
  const revealResults = sheetExitStarted || sheetDismissed;

  // Held until the sheet is gone — a store-review prompt landing on top of the
  // celebration would eat it.
  useEffect(() => {
    if (!sheetDismissed) return;
    void maybeRequestSessionReview(ReviewTrigger.BreathHold);
  }, [sheetDismissed]);

  const lungAge = estimateLungAge(holdSeconds, userAge);
  const benchmark =
    userAge != null ? benchmarkBreathHold(holdSeconds, userAge) : null;
  const comparisonLabel = benchmark
    ? `Top ${benchmark.topPercent}% of people your age`
    : null;
  const congratulation =
    firstName == null ? 'Nice work!' : `Nice work, ${firstName}!`;
  const advancedStatsLocked =
    !advancedStatsAccess.allowed && !advancedStatsAccess.isLoading;
  const advancedStatsTrackingAccess = useMemo(
    () => ({
      allowed: advancedStatsAccess.allowed,
      isPro: advancedStatsAccess.isPro,
      reason: advancedStatsAccess.reason,
      used: advancedStatsAccess.used,
      limit: advancedStatsAccess.limit,
    }),
    [
      advancedStatsAccess.allowed,
      advancedStatsAccess.isPro,
      advancedStatsAccess.limit,
      advancedStatsAccess.reason,
      advancedStatsAccess.used,
    ],
  );

  const celebrationStats = useMemo(
    () => [
      { label: 'Hold', value: formatDuration(holdSeconds) },
      { label: 'Lung age', value: `${lungAge.years}` },
    ],
    [holdSeconds, lungAge.years],
  );
  const celebrationContentRef = useRef<{
    title: string;
    stats: typeof celebrationStats;
  } | null>(null);
  if (snapshot != null && celebrationContentRef.current == null) {
    celebrationContentRef.current = {
      title: congratulation,
      stats: celebrationStats,
    };
  }
  const celebrationContent = celebrationContentRef.current;

  const handleClose = useCallback(() => {
    returnToHome(navigation);
  }, [navigation]);

  const handleSheetShow = useCallback(() => {
    markSeen();
    setSheetPresented(true);
  }, [markSeen]);

  const handleSheetDismiss = useCallback(() => {
    setSheetDismissed(true);
  }, []);

  const handleSheetExitStart = useCallback(() => {
    setSheetExitStarted(true);
  }, []);

  const handleChoosePiece = useCallback(() => {
    navigation.replace('RoomDecorate');
  }, [navigation]);

  const handleShare = useCallback(async () => {
    try {
      const message = benchmark
        ? `My lung age is ${lungAge.years}. I am in the top ${benchmark.topPercent}% of people my age. Can you beat me?\n\n${APP_STORE_URL}`
        : `My lung age is ${lungAge.years}. Can you beat me?\n\n${APP_STORE_URL}`;
      await Share.share({ message });
    } catch {
      Alert.alert('Could not share', 'Please try again.');
    }
  }, [benchmark, lungAge.years]);

  const showAdvancedStatsPaywall = useCallback(() => {
    trackFeatureGateHit({
      feature: FeatureKey.AdvancedStats,
      placement: PaywallPlacement.DailyResultProGate,
      sourceScreen: 'DailyResult',
      sourceAction: 'result_stats',
      access: advancedStatsTrackingAccess,
    });
    navigation.navigate('ProPaywall', {
      placement: PaywallPlacement.DailyResultProGate,
      sourceScreen: 'DailyResult',
      sourceAction: 'result_stats',
      feature: FeatureKey.AdvancedStats,
    });
  }, [
    advancedStatsTrackingAccess,
    navigation,
  ]);

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top,
          backgroundColor: showDailyCover
            ? hue.base
            : colors.background.canvas,
        },
      ]}
    >
      {sheetVisible && snapshot != null && celebrationContent != null ? (
        <DailyCompleteSheet
          visible
          hue={hue}
          title={celebrationContent.title}
          subtitle="The Azora Protocol"
          stats={celebrationContent.stats}
          state={snapshot.state}
          barFrom={snapshot.barFrom}
          rewardReady={isDailyCompleteRewardReady(
            snapshot.state,
            roomClaim.progress.canClaim,
          )}
          onShow={handleSheetShow}
          onExitStart={handleSheetExitStart}
          onChoosePiece={handleChoosePiece}
          onDismiss={handleSheetDismiss}
        />
      ) : null}

      <GlassIconButton
        accessibilityLabel="Close results"
        size={SESSION_GLASS_BUTTON_SIZE}
        style={[
          styles.floatingAction,
          styles.floatingClose,
          { top: insets.top + padding.screen.vertical },
        ]}
        onPress={handleClose}
      >
        <MaterialCommunityIcons
          name="close"
          size={20}
          color={colors.text.secondary}
        />
      </GlassIconButton>
      <GlassIconButton
        accessibilityLabel="Share result"
        size={SESSION_GLASS_BUTTON_SIZE}
        style={[
          styles.floatingAction,
          styles.floatingShare,
          { top: insets.top + padding.screen.vertical },
        ]}
        onPress={handleShare}
      >
        <MaterialCommunityIcons
          name="share-variant"
          size={20}
          color={colors.primary.blue600}
        />
      </GlassIconButton>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScreenContent>
          <Rise
            when={revealResults}
            durationMs={duration.base}
            style={styles.heroWrap}
          >
            <View style={styles.heroShadow}>
              <View style={[styles.heroCard, { backgroundColor: hue.base }]}>
                <Icon name="streakFilled" size={HERO_FLAME_SIZE} color={hue.soft} />
                <Text style={styles.heroTitle}>{congratulation}</Text>
                <Text style={styles.heroSubtitle}>
                  Breath hold · {formatDuration(holdSeconds)}
                </Text>
                {comparisonLabel == null ? null : (
                  <Text style={styles.heroBadge}>{comparisonLabel}</Text>
                )}
              </View>
            </View>
          </Rise>

          <Rise
            when={revealResults}
            delay={stagger.tight}
            durationMs={duration.base}
          >
            <View style={styles.statsSection}>
              <ResultHeartRateStatsSection
                hrDrop={hrDropBpm}
                minBpm={minBpm ?? null}
                maxBpm={maxBpm ?? null}
                avgBpm={avgBpm ?? null}
                age={userAge}
                bpmSamples={bpmSamples}
                locked={advancedStatsLocked}
                onPressUpgrade={showAdvancedStatsPaywall}
                emptyChartMessage={
                  heartRateResultStatus === 'insufficient_beats'
                    ? 'Not enough reliable heartbeats were detected during this hold to show heart-rate results.'
                    : 'Complete The Azora Protocol with heart rate enabled to see your BPM.'
                }
                insightContext="breath-hold"
              />
            </View>
          </Rise>

          <Rise
            when={revealResults}
            delay={stagger.tight * 2}
            durationMs={duration.base}
          >
            <View style={styles.bodySection}>
              <ResultHelpfulnessQuestion
                techniqueId={BREATH_HOLD_FEEDBACK_ID}
                localDate={todayLocalDate}
                sessionKey={sessionKey}
              />
            </View>

            <ChunkyButton
              label="Share my result"
              shape="card"
              style={styles.shareCta}
              icon={
                <MaterialCommunityIcons
                  name="share-variant"
                  size={20}
                  color={colors.text.inverse}
                />
              }
              onPress={handleShare}
            />
          </Rise>
        </ScreenContent>
      </ScrollView>

      {showDailyCover ? (
        <View style={[styles.dailyCover, { backgroundColor: hue.base }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  dailyCover: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingTop: padding.screen.vertical + SESSION_GLASS_BUTTON_SIZE,
    paddingBottom: spacing['5xl'],
  },
  floatingAction: {
    position: 'absolute',
    zIndex: 2,
  },
  floatingClose: {
    left: padding.screen.horizontal,
  },
  floatingShare: {
    right: padding.screen.horizontal,
  },
  heroWrap: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
  heroShadow: {
    ...card.blockShadow,
  },
  heroCard: {
    ...card.block,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  heroTitle: {
    ...typography.display.display3,
    color: colors.text.inverse,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  heroSubtitle: {
    ...typography.body.medium,
    color: colors.onBlock.textMuted,
    textAlign: 'center',
  },
  heroBadge: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
    backgroundColor: colors.onBlock.fill,
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  bodySection: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
    gap: margin.itemGap,
  },
  statsSection: {
    marginTop: margin.resultSection,
  },
  shareCta: {
    marginHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
});
