import { Text } from '../components/common/Text';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, padding, margin } from '../theme/spacing';
import { triggerLightHaptic } from '../native/tapHaptics';
import DailyCompleteSheet from '../features/room/DailyCompleteSheet';
import GlassIconButton from '../components/common/GlassIconButton';
import ChunkyButton from '../components/common/ChunkyButton';
import HelpfulnessQuestion from '../components/exercise/HelpfulnessQuestion';
import BlobCharacter from '../components/home/BlobCharacter';
import { CATEGORY_STYLE } from '../features/exercise/guidedBreathing/categoryPalette';
import { getTechnique } from '../features/exercise/guidedBreathing/techniques';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { card } from '../theme/card';
import BPMChart from '../components/heartRate/BPMChart';
import RestingHeartRateBar from '../components/heartRate/RestingHeartRateBar';
import ThermometerStatCard from '../components/heartRate/ThermometerStatCard';
import type { SessionCompleteScreenProps } from '../app/navigation';
import { useAuthStore } from '../stores/authStore';
import { useProfileQuery } from '../queries/profile/useProfileQuery';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';
import { withTodaysSession } from '../lib/weeklyProgress';
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
import { SESSION_GLASS_BUTTON_SIZE } from '../features/exercise/shared/components/SessionGlassButton';
import { returnToHome } from '../app/navigation/returnToHome';

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const HERO_BLOB_SIZE = 132;
const EMPTY_HR_SAMPLES: { offsetMs: number; bpm: number }[] = [];

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
  const {
    techniqueId,
    techniqueName,
    sessionKey,
    techniqueBpmResponse,
    breathCount,
    durationSec,
    avgBpm,
    hrSamples = EMPTY_HR_SAMPLES,
  } = route.params;

  useEffect(() => {
    triggerLightHaptic();
  }, []);

  const user = useAuthStore((state) => state.user);
  const profileSummaryQuery = useProfileSummaryQuery(user?.id ?? null);
  const profileQuery = useProfileQuery(user?.id ?? null);
  const [sheetDismissed, setSheetDismissed] = useState(false);
  const [sheetPresented, setSheetPresented] = useState(false);
  const openingTransitionComplete =
    useOpeningTransitionComplete(navigation);
  const roomClaim = useRoomClaim(user?.id ?? null);
  const dailies = roomClaim.dailies;

  // Only the three dailies move the room forward, so only they get the
  // celebration. Matching on technique id rather than on how the session was
  // launched is deliberate: running today's technique from the library really
  // does complete the daily, and the screen should say so.
  const currentlyDaily =
    techniqueId === dailies.guidedTechnique?.id ||
    techniqueId === dailies.handPickedTechnique?.id;
  const [dailyEligibility, setDailyEligibility] = useState<boolean | null>(() =>
    dailies.isLoading ? null : currentlyDaily,
  );

  useEffect(() => {
    if (dailyEligibility != null || dailies.isLoading) return;
    setDailyEligibility(currentlyDaily);
  }, [currentlyDaily, dailies.isLoading, dailyEligibility]);

  const isDaily = dailyEligibility === true;
  const completionProjection = useMemo(
    () => ({
      guided: techniqueId === dailies.guidedTechnique?.id,
      handPicked: techniqueId === dailies.handPickedTechnique?.id,
    }),
    [
      dailies.guidedTechnique?.id,
      dailies.handPickedTechnique?.id,
      techniqueId,
    ],
  );
  const { snapshot, markSeen } = useDailyCompleteSnapshot({
    // Resolve against cached state while the native route is still moving.
    // Only the presentation remains gated on `transitionEnd`.
    active: isDaily,
    claim: roomClaim,
    projection: completionProjection,
  });
  // The native stack owns the base result entrance. Transition completion only
  // sequences the optional daily celebration sheet over that content.
  const sheetVisible =
    isDaily && !sheetDismissed && snapshot != null && openingTransitionComplete;
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
    if (sheetPending) return;
    void maybeRequestSessionReview(ReviewTrigger.GuidedBreathing);
  }, [sheetPending]);

  const summary = profileSummaryQuery.data;
  const displayName = summary?.profile?.displayName ?? null;
  const firstName = displayName?.trim().split(/\s+/)[0] ?? null;
  const technique = getTechnique(techniqueId);
  const categoryStyle = CATEGORY_STYLE[technique?.category ?? 'calm'];
  const hue = categoryStyle.hue;
  const congratulation =
    firstName == null ? 'Nice work' : `Nice work, ${firstName}`;
  const todayLocalDate = useTodayLocalDate();

  // Completion already derived this from the same exercise-mode series the
  // chart uses. Reusing it avoids sorting and summarizing the samples again.
  const displayAvgBpm = avgBpm ?? null;

  const showGraph = hrSamples.length >= 10;
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

  const streakView = useMemo(
    () =>
      summary == null
        ? null
        : withTodaysSession(summary.currentStreak, summary.completedDaysAgo),
    [summary],
  );

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

  const handleChoosePiece = useCallback(() => {
    navigation.replace('RoomDecorate');
  }, [navigation]);

  const celebrationStats = useMemo(
    () => [
      { label: 'Time', value: formatDuration(durationSec) },
      { label: 'Breaths', value: `${breathCount}` },
    ],
    [breathCount, durationSec],
  );
  const celebrationContentRef = useRef<{
    title: string;
    subtitle: string;
    stats: typeof celebrationStats;
  } | null>(null);
  if (snapshot != null && celebrationContentRef.current == null) {
    celebrationContentRef.current = {
      title: congratulation,
      subtitle: techniqueName,
      stats: celebrationStats,
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
    if (streakView != null && streakView.currentStreak >= 2) {
      parts.push(`Day ${streakView.currentStreak} in a row.`);
    }
    return `${parts.join(' ')}\n\nBreathe with me:\n${APP_STORE_URL}`;
  }, [breathCount, displayAvgBpm, durationSec, streakView, techniqueName]);

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
          character={categoryStyle.character}
          title={celebrationContent.title}
          subtitle={celebrationContent.subtitle}
          stats={celebrationContent.stats}
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
        <View style={styles.heroWrap}>
          <View style={styles.heroShadow}>
            <View style={[styles.heroCard, { backgroundColor: hue.base }]}>
              <BlobCharacter
                character={categoryStyle.character}
                faceExpression="cheer"
                size={HERO_BLOB_SIZE}
                bodyColor={hue.soft}
                faceColor={hue.ink}
              />
              <Text style={styles.heroTitle}>{congratulation}</Text>
              <Text style={styles.heroSubtitle}>
                {techniqueName} · {formatDuration(durationSec)}
              </Text>
            </View>
          </View>
        </View>

        <View>
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
                iconColor={colors.primary.blue600}
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
                iconColor={colors.primary.blue600}
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
          </View>
        </View>

        {showGraph ? (
          <View style={styles.graphWrap}>
            <ResultBPMChart
              bpmSamples={hrSamples}
              insightContext="breathing-exercise"
              breathingTechniqueProfile={breathingTechniqueProfile}
            />
          </View>
        ) : null}

        <View>
          <View style={styles.bodySection}>
            <ResultHelpfulnessQuestion
              techniqueId={techniqueId}
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
        </View>
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
  bodySection: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
    gap: margin.itemGap,
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
  graphWrap: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: spacing.sm,
  },
  shareCta: {
    marginHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
});
