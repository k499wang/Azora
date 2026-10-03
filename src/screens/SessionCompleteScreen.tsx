import { Text } from '../components/common/Text';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, padding, margin } from '../theme/spacing';
import { triggerLightHaptic } from '../native/tapHaptics';
import {
  isDayCompleteForced,
  takeForcedDayComplete,
} from '../features/room/devDayCompleteOverride';
import DailyCompleteSheet, {
  CELEBRATION_HUE,
} from '../features/room/DailyCompleteSheet';
import GlassIconButton from '../components/common/GlassIconButton';
import ChunkyButton from '../components/common/ChunkyButton';
import CoinFlightLayer from '../components/common/CoinFlightLayer';
import EarnedCoinBalance from '../components/common/EarnedCoinBalance';
import HeaderStripStatCard, {
  EarnedCoinsCard,
  HeaderStripStatRow,
} from '../components/common/HeaderStripStatCard';
import { Land, RiseUnlessReducedMotion } from '../components/common/Reveal';
import ActivityRewardHero from '../features/plan/ActivityRewardHero';
import {
  REWARD_BEAT,
  REWARD_CARDS_LANDED_MS,
  rewardHeroWidth,
} from '../features/plan/rewardEntrance';
import { useCoinRewardFlight } from '../hooks/useCoinRewardFlight';
import HelpfulnessQuestion from '../components/exercise/HelpfulnessQuestion';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import BPMChart from '../components/heartRate/BPMChart';
import RestingHeartRateBar from '../components/heartRate/RestingHeartRateBar';
import type { SessionCompleteScreenProps } from '../app/navigation';
import { useAuthStore } from '../stores/authStore';
import { useProfileQuery } from '../queries/profile/useProfileQuery';
import { APP_STORE_URL } from '../lib/appStoreLink';
import {
  maybeRequestSessionReview,
  ReviewTrigger,
} from '../services/reviews/storeReview';
import { useOpeningTransitionComplete } from '../app/navigation';
import { useRoomClaim } from '../features/room/useRoomClaim';
import { hasPieceToEarn } from '../lib/room/roomProgress';
import { useDailyRewardStage } from '../features/room/useDailyRewardStage';
import DailyRewardFlow from '../features/room/DailyRewardFlow';
import DailyRewardSurface from '../features/room/DailyRewardSurface';
import RoomSealFlow from '../features/room/RoomSealFlow';
import {
  isDailyCompleteRewardReady,
  useDailyCompleteSnapshot,
} from '../features/room/useDailyCompleteSnapshot';
import { useTrackDailyCompletion } from '../features/room/useTrackDailyCompletion';
import { SESSION_GLASS_BUTTON_SIZE } from '../features/exercise/shared/components/SessionGlassButton';
import { returnToHome } from '../app/navigation/returnToHome';
import ScreenContent from '../components/common/ScreenContent';

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const EMPTY_HR_SAMPLES: { offsetMs: number; bpm: number }[] = [];
const QUESTION_HUE = {
  base: colors.playful.sky.base,
  tint: colors.playful.sky.soft,
  ink: colors.playful.sky.ink,
};


// Everything below re-renders on every query that resolves while the screen is
// on — profile, summary, room, dailies, feedback — and each of those commits
// lands mid-entrance and reconciles a whole SVG tree. Their props are already
// stable values, so memoizing lets the reveal own the frame.
const ResultBPMChart = memo(BPMChart);
const ResultRestingHeartRateBar = memo(RestingHeartRateBar);
const ResultHelpfulnessQuestion = memo(HelpfulnessQuestion);

export default function SessionCompleteScreen({
  navigation,
  route,
}: SessionCompleteScreenProps) {
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const {
    techniqueId,
    techniqueName,
    sessionKey,
    techniqueBpmResponse,
    breathCount,
    durationSec,
    avgBpm,
    hrSamples = EMPTY_HR_SAMPLES,
    coins = 0,
    celebrateDay = false,
    preview = false,
  } = route.params;

  useEffect(() => {
    triggerLightHaptic();
  }, []);

  const reducedMotion = useReducedMotion();
  const flight = useCoinRewardFlight({ coins, landedAfterMs: REWARD_CARDS_LANDED_MS });
  const user = useAuthStore((state) => state.user);
  const profileQuery = useProfileQuery(user?.id ?? null);
  /** Continue was tapped: the day's celebration follows the coins, never covers them */
  const [celebrationRequested, setCelebrationRequested] = useState(false);
  const [sheetDismissed, setSheetDismissed] = useState(false);
  const [sheetPresented, setSheetPresented] = useState(false);
  const openingTransitionComplete = useOpeningTransitionComplete(navigation);
  const roomClaim = useRoomClaim(user?.id ?? null);
  const todayLocalDate = useTodayLocalDate();
  const dailies = roomClaim.dailies;

  // The celebration is for the day's piece, so only the session that finishes
  // the day with one still to earn gets it. Matching on technique id rather than on how the session was launched
  // is deliberate: running today's technique from the library really does
  // complete the daily, and the screen should say so. The one exception is
  // the exercise a check-in offered after finishing the day itself: the day
  // was done before it began, and its result is where that gets celebrated.
  // The dev switch in Settings stands in for the rest of the day.
  const currentlyDaily =
    !preview &&
    (celebrateDay ||
      (dailies.units.some((unit) => unit.techniqueId === techniqueId) &&
        (isDayCompleteForced() ||
          (hasPieceToEarn(roomClaim.progress) &&
            dailies.units.every(
              (unit) => unit.completed || unit.techniqueId === techniqueId,
            )))));
  const [dailyEligibility, setDailyEligibility] = useState<boolean | null>(
    () => (roomClaim.isLoading ? null : currentlyDaily),
  );

  useEffect(() => {
    if (dailyEligibility != null || roomClaim.isLoading) return;
    setDailyEligibility(currentlyDaily);
  }, [currentlyDaily, roomClaim.isLoading, dailyEligibility]);

  const isDaily = dailyEligibility === true;

  // Spent once the result has committed to celebrating, not while deciding:
  // a render may run twice, and deciding must not use it up.
  useEffect(() => {
    if (isDaily) takeForcedDayComplete();
  }, [isDaily]);
  const completionProjection = useMemo(() => ({ techniqueId }), [techniqueId]);
  /**
   * The day's piece opens here rather than on a screen of its own. Replacing
   * this screen with the decorate screen was a navigation in the middle of a
   * reward, and it left the two ways of finishing a day — a session here, a
   * to-do on Home — running two different flows.
   */
  const reward = useDailyRewardStage({
    userId: user?.id ?? null,
    claim: roomClaim,
    todayLocalDate,
  });

  const { snapshot, markSeen } = useDailyCompleteSnapshot({
    // Resolve against cached state while the native route is still moving.
    // Only the presentation remains gated on `transitionEnd`.
    active: isDaily,
    claim: roomClaim,
    projection: completionProjection,
  });
  useTrackDailyCompletion(snapshot, roomClaim);
  const sheetVisible =
    isDaily &&
    celebrationRequested &&
    (!sheetDismissed || reward.handingOver) &&
    snapshot != null;
  // Between Continue and the sheet arriving, so the result never shows through.
  const showDailyCover =
    celebrationRequested &&
    dailyEligibility !== false &&
    !sheetDismissed &&
    !sheetPresented;
  // Held until the sheet has had its turn — a store-review prompt landing on
  // top of the celebration would eat it.
  const sheetPending =
    !openingTransitionComplete ||
    dailyEligibility == null ||
    (isDaily && !sheetDismissed);

  useEffect(() => {
    if (sheetPending || preview) return;
    void maybeRequestSessionReview(ReviewTrigger.GuidedBreathing);
  }, [sheetPending, preview]);

  const displayName = profileQuery.data?.displayName ?? null;
  const firstName = displayName?.trim().split(/\s+/)[0] ?? null;
  const congratulation =
    firstName == null ? 'Nice work!' : `Nice work, ${firstName}!`;

  // Completion already derived this from the same exercise-mode series the
  // chart uses. Reusing it avoids sorting and summarizing the samples again.
  const displayAvgBpm = avgBpm ?? null;

  const showGraph = hrSamples.length >= 10;
  const showHeartRate = displayAvgBpm != null || showGraph;
  // The reward fills the first screen; any heart-rate detail sits below it for
  // whoever scrolls.
  const foldHeight =
    window.height -
    insets.top -
    insets.bottom -
    styles.scrollContent.paddingTop -
    spacing.lg;
  const heroWidth = rewardHeroWidth(window.width, window.height);
  const breathingTechniqueProfile = useMemo(
    () =>
      techniqueBpmResponse == null
        ? null
        : {
            name: techniqueName,
            response: techniqueBpmResponse,
          },
    [techniqueBpmResponse, techniqueName],
  );

  // Back to wherever the session was started — Home, the plan's "Start my
  // plan", Explore, a search — the way Android's back already went. A session
  // that finished the day has had its celebration here, so nothing is left for
  // Home to play. Home only when there is nothing underneath to return to.
  const handleClose = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    returnToHome(navigation);
  }, [navigation]);

  const handleContinue = useCallback(() => {
    if (dailyEligibility === false || sheetPresented) {
      handleClose();
      return;
    }
    setCelebrationRequested(true);
  }, [dailyEligibility, handleClose, sheetPresented]);

  // Continue landed before the day was known, and it was not the day's last.
  useEffect(() => {
    if (celebrationRequested && dailyEligibility === false) handleClose();
  }, [celebrationRequested, dailyEligibility, handleClose]);

  const handleSheetShow = useCallback(() => {
    markSeen();
    setSheetPresented(true);
  }, [markSeen]);

  const handleSheetDismiss = useCallback(() => {
    setSheetDismissed(true);
  }, []);

  const handleChoosePiece = useCallback(() => {
    setSheetDismissed(true);
    reward.open({ handOver: true });
  }, [reward]);

  /**
   * The reward ends where the day ended.
   *
   * It used to hand over to Home, on the reasoning that the piece belongs in
   * the room and the room is on Home. But the result behind this is the thing
   * the user came here for, and taking it away the moment they finish looking
   * at a decoration is the app deciding they are done. They leave when they
   * leave.
   */
  const handleRewardDone = useCallback(() => {
    reward.close();
  }, [reward]);

  const celebrationContentRef = useRef<{
    title: string;
    subtitle: string;
  } | null>(null);
  if (snapshot != null && celebrationContentRef.current == null) {
    celebrationContentRef.current = {
      title: congratulation,
      // The technique name alone read as a label. What they just did, in their
      // own numbers, is what the moment is about.
      subtitle: `${breathCount} breaths of ${techniqueName}`,
    };
  }
  const celebrationContent = celebrationContentRef.current;

  const shareMessage = useMemo(() => {
    const parts = [
      `${breathCount} breaths of ${techniqueName} in ${formatDuration(durationSec)}.`,
    ];
    if (displayAvgBpm != null) {
      parts.push(`Heart rate settled at ${Math.round(displayAvgBpm)} bpm.`);
    }
    return `${parts.join(' ')}\n\nBreathe with me:\n${APP_STORE_URL}`;
  }, [breathCount, displayAvgBpm, durationSec, techniqueName]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({ message: shareMessage });
    } catch {
      Alert.alert('Could not share', 'Please try again.');
    }
  }, [shareMessage]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* One presentation from the flame through to the piece landing;
          see `DailyRewardSurface` for why it cannot be two. */}
      <DailyRewardSurface
        visible={sheetVisible || reward.decorating || reward.sealing}
      >
        {sheetVisible && snapshot != null && celebrationContent != null ? (
          <DailyCompleteSheet
            hosted
            visible
            title={celebrationContent.title}
            subtitle={celebrationContent.subtitle}
            state={snapshot.state}
            barFrom={snapshot.barFrom}
            onShow={handleSheetShow}
            onChoosePiece={handleChoosePiece}
            onDismiss={handleSheetDismiss}
          />
        ) : null}

        {reward.decorating ? (
          <DailyRewardFlow
            hosted
            // No room on a result screen, so nothing to shrink back into. The
            // reward slides back down the way it came, leaving the result
            // underneath exactly as it was.
            room={roomClaim.room}
            progress={roomClaim.progress}
            rewardReady={isDailyCompleteRewardReady(
              snapshot?.state ?? { unlocked: true },
              roomClaim.progress.canClaim,
            )}
            onSealFrom={reward.setSealFrom}
            onPlace={reward.place}
            onDismiss={handleRewardDone}
          />
        ) : null}

        {reward.sealing ? (
          <RoomSealFlow
            userId={user?.id ?? null}
            room={roomClaim.room}
            from={reward.sealFrom}
            onDone={reward.endSeal}
          />
        ) : null}
      </DailyRewardSurface>

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
          color={colors.primary.blue500}
        />
      </GlassIconButton>

      {coins > 0 ? (
        <View
          ref={flight.balanceRef}
          collapsable={false}
          style={[
            styles.floatingAction,
            styles.floatingCoins,
            { top: insets.top + padding.screen.vertical },
          ]}
        >
          <EarnedCoinBalance
            userId={user?.id ?? null}
            coins={coins}
            earnedShown={flight.earnedShown}
          />
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenContent>
          <View style={[styles.fold, { minHeight: foldHeight }]}>
            <View style={styles.stage}>
              <ActivityRewardHero
                width={heroWidth}
                delay={REWARD_BEAT.hero}
                reducedMotion={reducedMotion}
              />
              <RiseUnlessReducedMotion delay={REWARD_BEAT.title} reducedMotion={reducedMotion}>
                <Text style={styles.title}>Yay! You did it!</Text>
              </RiseUnlessReducedMotion>
              <RiseUnlessReducedMotion delay={REWARD_BEAT.subtitle} reducedMotion={reducedMotion}>
                <Text style={styles.subtitle}>{techniqueName} complete.</Text>
              </RiseUnlessReducedMotion>
              <RiseUnlessReducedMotion
                delay={REWARD_BEAT.cards}
                reducedMotion={reducedMotion}
                style={styles.cards}
              >
                <HeaderStripStatRow>
                  <HeaderStripStatCard
                    label="Duration"
                    value={formatDuration(durationSec)}
                    tone="sky"
                  />
                  <HeaderStripStatCard
                    label="Breaths"
                    value={`${breathCount}`}
                    tone="sky"
                  />
                  {coins > 0 ? (
                    <EarnedCoinsCard ref={flight.sourceRef} coins={coins} />
                  ) : null}
                </HeaderStripStatRow>
              </RiseUnlessReducedMotion>
            </View>

            <RiseUnlessReducedMotion delay={REWARD_BEAT.cta} reducedMotion={reducedMotion}>
              <ResultHelpfulnessQuestion
                techniqueId={techniqueId}
                localDate={todayLocalDate}
                sessionKey={sessionKey}
                hue={QUESTION_HUE}
                preview={preview}
              />
            </RiseUnlessReducedMotion>

            <Land delay={REWARD_BEAT.cta}>
              <ChunkyButton label="Continue" shape="card" onPress={handleContinue} />
            </Land>
          </View>

          {showHeartRate ? (
            <View style={styles.statSection}>
              {displayAvgBpm == null ? null : (
                <ResultRestingHeartRateBar
                  bpm={displayAvgBpm}
                  age={profileQuery.data?.age ?? null}
                  title="Average heart rate"
                />
              )}

              {showGraph ? (
                <ResultBPMChart
                  bpmSamples={hrSamples}
                  insightContext="breathing-exercise"
                  breathingTechniqueProfile={breathingTechniqueProfile}
                />
              ) : null}
            </View>
          ) : null}
        </ScreenContent>
      </ScrollView>

      {coins > 0 ? (
        <CoinFlightLayer
          ref={flight.flightRef}
          targetRef={flight.balanceRef}
          onReady={flight.onFlightReady}
        />
      ) : null}

      {showDailyCover ? (
        <View
          style={[styles.dailyCover, { backgroundColor: CELEBRATION_HUE.base }]}
        />
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
  },
  floatingAction: {
    position: 'absolute',
    zIndex: 2,
  },
  floatingShare: {
    left: padding.screen.horizontal,
  },
  floatingCoins: {
    right: padding.screen.horizontal,
    height: SESSION_GLASS_BUTTON_SIZE,
    justifyContent: 'center',
  },
  fold: {
    paddingHorizontal: padding.screen.horizontal,
    gap: margin.itemGap,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title.title1,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  subtitle: {
    ...typography.body.large,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  cards: {
    alignSelf: 'stretch',
    marginTop: spacing.lg,
  },
  statSection: {
    marginHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
    gap: spacing.sm,
  },
});
