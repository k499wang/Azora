import { Text } from '../components/common/Text';
import { useCallback, useEffect, useMemo } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing, padding, margin } from '../theme/spacing';
import { card } from '../theme/card';
import SectionHeader from '../components/common/SectionHeader';
import BPMChart from '../components/heartRate/BPMChart';
import GlassIconButton, {
  GLASS_ICON_BUTTON_SIZE,
} from '../components/common/GlassIconButton';
import AmbientBackground from '../components/common/AmbientBackground';
import ThermometerStatCard from '../components/heartRate/ThermometerStatCard';
import ScoreRing from '../components/exercise/ScoreRing';
import type { SessionCompleteScreenProps } from '../app/navigation';
import { useAuthStore } from '../stores/authStore';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';
import { buildAffirmation } from '../lib/affirmation';
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

export default function SessionCompleteScreen({
  navigation,
  route,
}: SessionCompleteScreenProps) {
  const insets = useSafeAreaInsets();
  const {
    techniqueName,
    techniqueBpmResponse,
    breathCount,
    targetBreaths,
    durationSec,
    avgBpm,
    hrSamples = [],
  } = route.params;

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    void maybeRequestSessionReview(ReviewTrigger.GuidedBreathing);
  }, []);

  const user = useAuthStore((state) => state.user);
  const profileSummaryQuery = useProfileSummaryQuery(user?.id ?? null);
  const summary = profileSummaryQuery.data;
  const displayName = summary?.profile?.displayName ?? null;
  const firstName = displayName?.trim().split(/\s+/)[0] ?? null;
  const affirmation = buildAffirmation({
    firstName,
    hour: new Date().getHours(),
    durationSec,
  });

  const breathScore = targetBreaths > 0 ? Math.max(0, Math.min(1, breathCount / targetBreaths)) : 0;

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
      <AmbientBackground />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{techniqueName}</Text>
        </View>

        <View style={styles.heroWrap}>
          <View style={styles.heroCard}>
            <ScoreRing
              value={breathCount}
              fill={breathScore}
              caption="Breaths"
              captionFontSize={18}
              captionPosition="bottom"
              captionTextTransform="none"
              ringColors={[colors.primary.blue400, colors.primary.blue600]}
              gapLabel={null}
            />
            <Text style={styles.affirmation}>{affirmation}</Text>
          </View>
        </View>

        <View style={styles.statsHeader}>
          <SectionHeader title="Statistics" />
        </View>

        <View style={styles.tileRow}>
          <ThermometerStatCard
            label="Duration"
            value={durationSec}
            unit=""
            valueText={formatDuration(durationSec)}
            min={30}
            max={300}
          />
          <ThermometerStatCard
            label="Avg HR"
            value={displayAvgBpm}
            unit="bpm"
            min={40}
            max={120}
          />
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

        <Pressable style={styles.shareCta} onPress={handleShare}>
          <MaterialCommunityIcons
            name="share-variant"
            size={20}
            color={colors.text.inverse}
          />
          <Text style={styles.shareCtaLabel}>Share my result</Text>
        </Pressable>

      </ScrollView>

      {/* Glassmorphic top buttons — fixed above the scroll */}
      <GlassIconButton
        style={[styles.closeButton, { top: insets.top + padding.screen.vertical }]}
        onPress={handleClose}
      >
        <MaterialCommunityIcons name="close" size={22} color={colors.text.secondary} />
      </GlassIconButton>
      <GlassIconButton
        style={[styles.shareButton, { top: insets.top + padding.screen.vertical }]}
        onPress={handleShare}
      >
        <MaterialCommunityIcons
          name="share-variant"
          size={20}
          color={colors.primary.blue600}
        />
      </GlassIconButton>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    paddingBottom: spacing['5xl'],
  },
  header: {
    // The close and share buttons float over this row, so the title column has
    // to stop short of them rather than at the screen edge.
    paddingHorizontal:
      padding.screen.horizontal + GLASS_ICON_BUTTON_SIZE + spacing.sm,
    paddingTop: padding.screen.vertical,
    alignItems: 'center',
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
  title: {
    ...typography.title.title1,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '500',
  },
  heroWrap: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
  heroCard: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  affirmation: {
    ...typography.title.title2,
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontWeight: '500',
    marginTop: spacing.md,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  statsHeader: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.resultSection,
    marginBottom: spacing.sm,
  },
  tileRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: padding.screen.horizontal,
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
    marginTop: margin.resultSection,
    paddingVertical: spacing.md,
    borderRadius: spacing.md,
    backgroundColor: colors.primary.blue600,
  },
  shareCtaLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.inverse,
  },
});
