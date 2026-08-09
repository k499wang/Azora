import { Text } from '../components/common/Text';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing, padding, margin } from '../theme/spacing';
import DailyCompleteSheet from '../features/room/DailyCompleteSheet';
import HelpfulnessQuestion from '../components/exercise/HelpfulnessQuestion';
import BlobCharacter from '../components/home/BlobCharacter';
import { CATEGORY_STYLE } from '../features/exercise/guidedBreathing/categoryPalette';
import { getTechnique } from '../features/exercise/guidedBreathing/techniques';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { useDailiesCompletion } from '../hooks/useDailiesCompletion';
import { card } from '../theme/card';
import BPMChart from '../components/heartRate/BPMChart';
import GlassIconButton from '../components/common/GlassIconButton';
import { SESSION_GLASS_BUTTON_SIZE } from '../features/exercise/shared/components/SessionGlassButton';
import RestingHeartRateBar from '../components/heartRate/RestingHeartRateBar';
import ThermometerStatCard from '../components/heartRate/ThermometerStatCard';
import type { SessionCompleteScreenProps } from '../app/navigation';
import { useAuthStore } from '../stores/authStore';
import { useProfileQuery } from '../queries/profile/useProfileQuery';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';
import { buildBpmSeries } from '../lib/heartRate/bpmSeries';
import { withTodaysSession } from '../lib/weeklyProgress';
import { APP_STORE_URL } from '../lib/appStoreLink';
import {
  maybeRequestSessionReview,
  ReviewTrigger,
} from '../services/reviews/storeReview';

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const HERO_BLOB_SIZE = 132;

export default function SessionCompleteScreen({
  navigation,
  route,
}: SessionCompleteScreenProps) {
  const insets = useSafeAreaInsets();
  const {
    techniqueId,
    techniqueName,
    techniqueBpmResponse,
    breathCount,
    durationSec,
    avgBpm,
    hrSamples = [],
  } = route.params;

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const user = useAuthStore((state) => state.user);
  const [sheetDismissed, setSheetDismissed] = useState(false);
  const dailies = useDailiesCompletion(user?.id ?? null);

  // Only the three dailies move the room forward, so only they get the
  // celebration. Matching on technique id rather than on how the session was
  // launched is deliberate: running today's technique from the library really
  // does complete the daily, and the screen should say so.
  const isDaily =
    techniqueId === dailies.guidedTechnique?.id ||
    techniqueId === dailies.handPickedTechnique?.id;
  const sheetVisible = !sheetDismissed && !dailies.isLoading && isDaily;
  // Whether this session earns the sheet is not known until the dailies resolve.
  // Painting the results underneath in the meantime is what made the wrong
  // screen flash before the right one — so hold everything until we know.
  const undecided = dailies.isLoading;
  // The results screen carries a chart, three stat cards and a query. Mounting
  // it while the sheet animates puts all of that on the same thread as the
  // entrance, which is what made it stutter. It waits for the sheet to settle.
  const [sheetSettled, setSheetSettled] = useState(false);
  const showResults = !undecided && (!sheetVisible || sheetSettled);

  // Held until the sheet has had its turn — a store-review prompt landing on
  // top of the celebration would eat it.
  const sheetPending = dailies.isLoading || sheetVisible;

  useEffect(() => {
    if (sheetPending) return;
    void maybeRequestSessionReview(ReviewTrigger.GuidedBreathing);
  }, [sheetPending]);

  const profileSummaryQuery = useProfileSummaryQuery(user?.id ?? null);
  const profileQuery = useProfileQuery(user?.id ?? null);
  const summary = profileSummaryQuery.data;
  const displayName = summary?.profile?.displayName ?? null;
  const firstName = displayName?.trim().split(/\s+/)[0] ?? null;
  const technique = getTechnique(techniqueId);
  const categoryStyle = CATEGORY_STYLE[technique?.category ?? 'calm'];
  const hue = categoryStyle.hue;
  const congratulation =
    firstName == null ? 'Nice work' : `Nice work, ${firstName}`;
  const todayLocalDate = useTodayLocalDate();

  // Derive Avg HR from the same smoothed series the graph plots so the stat
  // and the line agree. Falls back to the raw session average when there are
  // too few samples to build a series.
  const displayAvgBpm =
    (hrSamples.length > 0
      ? buildBpmSeries(hrSamples, { mode: 'exercise' }).summary.avgBpm
      : null) ??
    avgBpm ??
    null;

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
    navigation.navigate('MainTabs', { screen: 'Home' });
  }, [navigation]);

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
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <DailyCompleteSheet
        visible={sheetVisible}
        hue={hue}
        character={categoryStyle.character}
        title={congratulation}
        subtitle={techniqueName}
        stats={[
          { label: 'Time', value: formatDuration(durationSec) },
          { label: 'Breaths', value: `${breathCount}` },
        ]}
        onSettled={() => setSheetSettled(true)}
        onDismiss={() => setSheetDismissed(true)}
      />

      {showResults ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroWrap}>
            <View style={styles.heroShadow}>
              <View style={[styles.heroCard, { backgroundColor: hue.base }]}>
                <BlobCharacter
                  character={categoryStyle.character}
                  faceExpression="energy"
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

          <View style={styles.statSection}>
            <View style={styles.statRow}>
              <ThermometerStatCard
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
              <ThermometerStatCard
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
              <RestingHeartRateBar
                bpm={displayAvgBpm}
                age={profileQuery.data?.age ?? null}
                title="Average heart rate"
              />
            )}
          </View>

          {showGraph ? (
            <View style={styles.graphWrap}>
              <BPMChart
                bpmSamples={hrSamples}
                insightContext="breathing-exercise"
                breathingTechniqueProfile={breathingTechniqueProfile}
              />
            </View>
          ) : null}

          <View style={styles.bodySection}>
            <HelpfulnessQuestion
              techniqueId={techniqueId}
              localDate={todayLocalDate}
            />
          </View>

          <Pressable style={styles.shareCta} onPress={handleShare}>
            <MaterialCommunityIcons
              name="share-variant"
              size={20}
              color={colors.text.inverse}
            />
            <Text style={styles.shareCtaLabel}>Share my result</Text>
          </Pressable>
        </ScrollView>
      ) : null}

      {showResults ? (
        <>
          {/* Glassmorphic top buttons — fixed above the scroll */}
          <GlassIconButton
            size={SESSION_GLASS_BUTTON_SIZE}
            style={[
              styles.closeButton,
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
            size={SESSION_GLASS_BUTTON_SIZE}
            style={[
              styles.shareButton,
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
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  scrollContent: {
    paddingBottom: spacing['5xl'],
  },
  closeButton: {
    position: 'absolute',
    left: padding.screen.horizontal,
    zIndex: 1,
  },
  shareButton: {
    position: 'absolute',
    right: padding.screen.horizontal,
    zIndex: 1,
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
    ...card.shadow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
    paddingVertical: spacing.md,
    borderRadius: spacing.md,
    backgroundColor: colors.primary.blue600,
  },
  shareCtaLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.inverse,
  },
});
