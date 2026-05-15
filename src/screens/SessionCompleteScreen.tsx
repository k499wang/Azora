import { Fragment, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing, padding, margin } from '../theme/spacing';
import { card } from '../theme/card';
import SectionHeader from '../components/common/SectionHeader';
import HRGraphCard from '../components/exercise/HRGraphCard';
import type { SessionCompleteScreenProps } from '../app/navigation';
import { useAuthStore } from '../stores/authStore';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';
import { buildAffirmation } from '../lib/affirmation';

const HERO_RING_SIZE = 260;
const HERO_RING_STROKE = 16;
const RING_START = 135;
const RING_SWEEP = 270;

const MINI_RING_SIZE = 76;
const MINI_RING_STROKE = 6;

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export default function SessionCompleteScreen({
  navigation,
  route,
}: SessionCompleteScreenProps) {
  const insets = useSafeAreaInsets();
  const {
    techniqueName,
    breathCount,
    targetBreaths,
    durationSec,
    targetSec,
    cycles,
    targetCycles,
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

  const ringCx = HERO_RING_SIZE / 2;
  const ringR = HERO_RING_SIZE / 2 - HERO_RING_STROKE;
  const ringRect = Skia.XYWHRect(ringCx - ringR, ringCx - ringR, ringR * 2, ringR * 2);
  const breathScore = clamp01(targetBreaths > 0 ? breathCount / targetBreaths : 0);
  const heroTrackPath = Skia.Path.Make();
  heroTrackPath.addArc(ringRect, RING_START, RING_SWEEP);
  const heroArcPath = Skia.Path.Make();
  heroArcPath.addArc(ringRect, RING_START, RING_SWEEP * breathScore);

  const heroColor = colors.primary.blue500;

  const miniCx = MINI_RING_SIZE / 2;
  const miniR = MINI_RING_SIZE / 2 - MINI_RING_STROKE;
  const miniRect = Skia.XYWHRect(miniCx - miniR, miniCx - miniR, miniR * 2, miniR * 2);
  const miniTrackPath = Skia.Path.Make();
  miniTrackPath.addArc(miniRect, RING_START, RING_SWEEP);

  const stats: Array<{
    value: string;
    label: string;
    tint: string;
    score: number;
    unavailable?: boolean;
  }> = [
    {
      value: formatDuration(durationSec),
      label: 'Duration',
      tint: colors.primary.blue500,
      score: clamp01(targetSec > 0 ? durationSec / targetSec : 0),
    },
    {
      value: String(cycles),
      label: 'Cycles',
      tint: colors.success[500],
      score: clamp01(targetCycles > 0 ? cycles / targetCycles : 0),
    },
    avgBpm != null
      ? {
          value: String(Math.round(avgBpm)),
          label: 'Avg HR',
          tint: colors.error[500],
          score: clamp01((100 - avgBpm) / 50),
        }
      : {
          value: '—',
          label: 'Avg HR',
          tint: colors.error[500],
          score: 0,
          unavailable: true,
        },
  ];

  const showGraph = hrSamples.length >= 10;

  const handleClose = () => {
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <MaterialCommunityIcons name="close" size={22} color={colors.text.secondary} />
          </Pressable>
          <Text style={styles.title}>Nice work!</Text>
        </View>

        <View style={styles.heroWrap}>
          <View style={styles.heroCard}>
            <View style={styles.ringWrap}>
              <Canvas style={StyleSheet.absoluteFill}>
                <Path
                  path={heroTrackPath}
                  style="stroke"
                  strokeWidth={HERO_RING_STROKE}
                  strokeCap="round"
                  color={heroColor + '26'}
                />
                <Path
                  path={heroArcPath}
                  style="stroke"
                  strokeWidth={HERO_RING_STROKE}
                  strokeCap="round"
                  color={heroColor}
                />
              </Canvas>
              <View style={styles.ringCenter} pointerEvents="none">
                <Text style={styles.ringValue}>{breathCount}</Text>
                <Text style={styles.ringUnit}>breaths</Text>
              </View>
            </View>
            <Text style={styles.techniqueName}>{techniqueName}</Text>
            <Text style={styles.affirmation}>{affirmation}</Text>
          </View>
        </View>

        <View style={styles.statsHeader}>
          <SectionHeader title="Statistics" />
        </View>

        <View style={styles.statTileRow}>
          {stats.map((stat, idx) => {
            const arc = Skia.Path.Make();
            arc.addArc(miniRect, RING_START, RING_SWEEP * stat.score);
            const arcColor = stat.unavailable ? colors.neutral[200] : stat.tint;
            return (
              <Fragment key={stat.label}>
                {idx > 0 && <View style={styles.statDivider} />}
                <View
                  style={[styles.statTile, stat.unavailable && styles.statTileUnavailable]}
                >
                  <View style={styles.miniRingWrap}>
                    <Canvas style={StyleSheet.absoluteFill}>
                      <Path
                        path={miniTrackPath}
                        style="stroke"
                        strokeWidth={MINI_RING_STROKE}
                        strokeCap="round"
                        color={arcColor + '26'}
                      />
                      {stat.score > 0 && (
                        <Path
                          path={arc}
                          style="stroke"
                          strokeWidth={MINI_RING_STROKE}
                          strokeCap="round"
                          color={arcColor}
                        />
                      )}
                    </Canvas>
                    <View style={styles.miniRingCenter} pointerEvents="none">
                      <Text
                        style={[
                          styles.statValue,
                          stat.unavailable && styles.statValueUnavailable,
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {stat.value}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              </Fragment>
            );
          })}
        </View>

        {showGraph ? (
          <View style={styles.graphWrap}>
            <HRGraphCard samples={hrSamples} durationSec={durationSec} />
          </View>
        ) : null}
      </ScrollView>
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
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: padding.screen.vertical,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: padding.screen.vertical,
    left: padding.screen.horizontal,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  title: {
    ...typography.title.title1,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '600',
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
  ringWrap: {
    width: HERO_RING_SIZE,
    height: HERO_RING_SIZE,
    borderRadius: HERO_RING_SIZE / 2,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    shadowColor: colors.neutral[900],
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    ...typography.display.display1,
    fontSize: 72,
    lineHeight: 78,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
  ringUnit: {
    ...typography.body.small,
    color: colors.text.tertiary,
    fontFamily: fonts.semibold,
    marginTop: 2,
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
  statTileRow: {
    ...card.base,
    ...card.shadow,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: padding.screen.horizontal,
    paddingVertical: spacing.sm,
    overflow: 'visible',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: colors.neutral[200],
    marginVertical: spacing.sm,
  },
  statTile: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniRingWrap: {
    width: MINI_RING_SIZE,
    height: MINI_RING_SIZE,
    borderRadius: MINI_RING_SIZE / 2,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    shadowColor: colors.neutral[900],
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  miniRingCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  statValue: {
    ...typography.title.title3,
    fontSize: 20,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
  statValueUnavailable: {
    color: colors.text.tertiary,
  },
  statTileUnavailable: {
    opacity: 0.75,
  },
  statLabel: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    fontFamily: fonts.semibold,
    marginTop: spacing.xs,
  },
  graphWrap: {
    paddingHorizontal: padding.screen.horizontal,
  },
});
