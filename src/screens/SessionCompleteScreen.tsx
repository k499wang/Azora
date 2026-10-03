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
import ChunkyButton, {
  chunkyToneOnHue,
} from '../components/common/ChunkyButton';
import HelpfulnessQuestion from '../components/exercise/HelpfulnessQuestion';
import AzoAnimation from '../components/common/AzoAnimation';
import { CATEGORY_STYLE } from '../features/exercise/guidedBreathing/categoryPalette';
import { getTechnique } from '../features/exercise/guidedBreathing/techniques';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import BPMChart from '../components/heartRate/BPMChart';
import RestingHeartRateBar from '../components/heartRate/RestingHeartRateBar';
import ThermometerStatCard from '../components/heartRate/ThermometerStatCard';
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
const AZO_MAX_WIDTH = 240;

// Everything below re-renders on every query that resolves while the screen is
// on — profile, summary, room, dailies, feedback — and each of those commits
// lands mid-entrance and reconciles a whole SVG tree. Their props are already
// stable values, so memoizing lets the reveal own the frame.
const ResultBPMChart = memo(BPMChart);
const ResultThermometerStatCard = memo(ThermometerStatCard);
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
    celebrateDay = false,
    preview = false,
  } = route.params;

  useEffect(() => {
    triggerLightHaptic();
  }, []);

  const user = useAuthStore((state) => state.user);
  const profileQuery = useProfileQuery(user?.id ?? null);
  const [sheetDismissed, setSheetDismissed] = useState(false);
  const [sheetPresented, setSheetPresented] = useState(false);
  const openingTransitionComplete = useOpeningTransitionComplete(navigation);
  const roomClaim = useRoomClaim(user?.id ?? null);
  const todayLocalDate = useTodayLocalDate();
  const dailies = roomClaim.dailies;

  // The celebration is for the day, so only the session that finishes it gets
  // one. Matching on technique id rather than on how the session was launched
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
          dailies.units.every(
            (unit) => unit.completed || unit.techniqueId === techniqueId,
          ))));
  const [dailyEligibility, setDailyEligibility] = useState<boolean | null>(
    () => (dailies.isLoading ? null : currentlyDaily),
  );

  useEffect(() => {
    if (dailyEligibility != null || dailies.isLoading) return;
    setDailyEligibility(currentlyDaily);
  }, [currentlyDaily, dailies.isLoading, dailyEligibility]);

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
  // The native stack owns the base result entrance. Transition completion only
  // sequences the optional daily celebration sheet over that content.
  const sheetVisible =
    isDaily &&
    (!sheetDismissed || reward.handingOver) &&
    snapshot != null &&
    openingTransitionComplete;
  // Cover only while a celebration is actually coming. Eligibility resolves
  // synchronously from cache in the normal flow; the transition guard just
  // avoids flashing results mid-slide on a cold start.
  const showDailyCover =
    (isDaily || (dailyEligibility == null && !openingTransitionComplete)) &&
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
  const technique = getTechnique(techniqueId);
  const categoryStyle = CATEGORY_STYLE[technique?.category ?? 'calm'];
  const hue = categoryStyle.hue;
  const doneTone = useMemo(() => chunkyToneOnHue(hue), [hue]);
  const congratulation =
    firstName == null ? 'Nice work!' : `Nice work, ${firstName}!`;

  // Completion already derived this from the same exercise-mode series the
  // chart uses. Reusing it avoids sorting and summarizing the samples again.
  const displayAvgBpm = avgBpm ?? null;

  const showGraph = hrSamples.length >= 10;
  // Duration and breath count were only ever context for the heart-rate
  // readout; without a reading there is nothing for them to frame.
  const hasHeartRate = displayAvgBpm != null || hrSamples.length > 0;
  // The reference layout fills the first screen; any heart-rate detail sits
  // below it for whoever scrolls.
  const foldHeight =
    window.height -
    insets.top -
    insets.bottom -
    styles.scrollContent.paddingTop -
    spacing.lg;
  const azoWidth = Math.min(AZO_MAX_WIDTH, window.width * 0.6);
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
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top,
          backgroundColor: showDailyCover ? CELEBRATION_HUE.base : hue.soft,
        },
      ]}
    >
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
            rewardReady={isDailyCompleteRewardReady(
              snapshot.state,
              roomClaim.progress.canClaim,
            )}
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

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenContent>
          <View style={[styles.fold, { minHeight: foldHeight }]}>
            <View style={styles.header}>
              <Text style={[styles.overline, { color: hue.ink }]}>
                You've completed
              </Text>
              <Text style={[styles.title, { color: hue.ink }]}>
                {techniqueName}
              </Text>
            </View>

            <View style={styles.stage}>
              <AzoAnimation pose="proud" width={azoWidth} />
            </View>

            <ResultHelpfulnessQuestion
              techniqueId={techniqueId}
              localDate={todayLocalDate}
              sessionKey={sessionKey}
              hue={hue}
              preview={preview}
            />

            <ChunkyButton
              label="Done"
              shape="card"
              tone={doneTone}
              style={styles.done}
              onPress={handleClose}
            />
          </View>

          {hasHeartRate ? (
            <View style={styles.statSection}>
              <View style={styles.statRow}>
                <ResultThermometerStatCard
                  label="Duration"
                  icon="breath-timer"
                  value={durationSec}
                  valueText={formatDuration(durationSec)}
                  unit=""
                  min={0}
                  max={1}
                  accent={colors.primary.blue500}
                  iconColor={colors.primary.blue500}
                  presentation="number"
                />
                <ResultThermometerStatCard
                  label="Breaths"
                  icon="stat-breath-flow"
                  value={breathCount}
                  valueText={`${breathCount}`}
                  unit=""
                  min={0}
                  max={1}
                  accent={colors.primary.blue500}
                  iconColor={colors.primary.blue500}
                  presentation="number"
                />
              </View>

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
    right: padding.screen.horizontal,
  },
  fold: {
    paddingHorizontal: padding.screen.horizontal,
    gap: margin.itemGap,
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: margin.sectionGap,
  },
  overline: {
    ...typography.overline,
    fontSize: typography.body.small.fontSize,
    textAlign: 'center',
  },
  title: {
    ...typography.display.display3,
    textAlign: 'center',
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  done: {
    marginTop: -spacing.sm,
  },
  statSection: {
    marginHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
    gap: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
