import { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Background2066 } from '../components/common/Background2066';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing, padding, margin } from '../theme/spacing';
import SectionHeader from '../components/common/SectionHeader';
import BPMChart from '../components/heartRate/BPMChart';
import GlassIconButton from '../components/common/GlassIconButton';
import ThermometerStatCard from '../components/heartRate/ThermometerStatCard';
import ScoreRing from '../components/exercise/ScoreRing';
import type { SessionCompleteScreenProps } from '../app/navigation';
import { useAuthStore } from '../stores/authStore';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';
import { buildAffirmation } from '../lib/affirmation';
import { buildBpmSeries } from '../lib/heartRate/bpmSeries';

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
  }, []);

  const user = useAuthStore((state) => state.user);
  const profileSummaryQuery = useProfileSummaryQuery(user?.id ?? null);
  const displayName = profileSummaryQuery.data?.profile?.displayName ?? null;
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
    (hrSamples.length > 0 ? buildBpmSeries(hrSamples).summary.avgBpm : null) ??
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

  const handleClose = () => {
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Fixed background image with quick fade to white */}
      <Background2066 style={styles.bgImage} />
      <LinearGradient
        colors={[
          'rgba(248,251,255,0)',
          'rgba(248,251,255,0.55)',
          'rgba(248,251,255,1)',
        ]}
        locations={[0, 0.25, 0.45]}
        style={styles.bgGradient}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Nice work!</Text>
        </View>

        <View style={styles.heroWrap}>
          <View style={styles.heroCard}>
            <ScoreRing
              value={breathCount}
              fill={breathScore}
              caption="Breaths"
              ringColors={[colors.primary.blue400, colors.primary.blue600]}
              gapLabel={null}
            />
            <Text style={styles.techniqueName}>{techniqueName}</Text>
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
            accent={colors.primary.blue500}
          />
          <ThermometerStatCard
            label="Avg HR"
            value={displayAvgBpm}
            unit="bpm"
            min={40}
            max={120}
            accent={colors.error[500]}
          />
        </View>

        {showGraph ? (
          <View style={styles.graphWrap}>
            <BPMChart
              bpmSamples={hrSamples}
              color={colors.primary.blue500}
              insightContext="breathing-exercise"
              breathingTechniqueProfile={breathingTechniqueProfile}
            />
          </View>
        ) : null}
      </ScrollView>

      {/* Glassmorphic close button — fixed above the scroll */}
      <GlassIconButton
        style={[styles.closeButton, { top: insets.top + padding.screen.vertical }]}
        onPress={handleClose}
      >
        <MaterialCommunityIcons name="close" size={22} color={colors.text.secondary} />
      </GlassIconButton>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  bgGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollContent: {
    paddingBottom: spacing['5xl'],
  },
  header: {
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: padding.screen.vertical,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    left: padding.screen.horizontal,
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  techniqueName: {
    ...typography.body.small,
    color: colors.text.secondary,
    fontFamily: fonts.semibold,
    marginTop: spacing.md,
  },
  affirmation: {
    ...typography.title.title2,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    marginTop: spacing.sm,
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
});
