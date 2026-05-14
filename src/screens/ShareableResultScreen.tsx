import { Fragment, useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing, padding, margin } from '../theme/spacing';
import { card } from '../theme/card';
import { HeartRateResultContent } from '../components/heartRate/HeartRateResultContent';
import SectionHeader from '../components/common/SectionHeader';
import type { DailyResultScreenProps } from '../app/navigation';
import { estimateLungAge, type LungHealthKey } from '../lib/lungAge';
import { getStressZone } from '../lib/heartRate/stress';
import StressGauge from '../components/heartRate/StressGauge';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { PaywallPlacement } from '../services/paywall';
import { FeatureKey } from '../services/subscriptions/featureAccess';

// ───────────��──────────────────────────────────────��─────────────────────────────

const LUNG_HEALTH_MAP: Record<
  LungHealthKey,
  { label: string; color: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }
> = {
  'elite':         { label: 'Elite Athlete', color: colors.primary.blue600, icon: 'trophy' },
  'very-healthy':  { label: 'Very Healthy',  color: colors.success[500],    icon: 'lungs' },
  'healthy':       { label: 'Healthy',       color: colors.success[700],    icon: 'leaf' },
  'average':       { label: 'Average',       color: colors.warning[500],    icon: 'minus-circle-outline' },
  'below-average': { label: 'Below Average', color: colors.orange[500],     icon: 'alert-circle-outline' },
  'light-smoker':  { label: 'Could Improve', color: colors.orange[600],    icon: 'arrow-up-bold-circle-outline' },
  'heavy-smoker':  { label: 'Needs Work',    color: colors.error[500],     icon: 'alert-circle-outline' },
};

const AGE_RING_SIZE = 260;
const AGE_RING_STROKE = 16;
const AGE_RING_START = 135;
const AGE_RING_SWEEP = 270;

const MINI_RING_SIZE = 76;
const MINI_RING_STROKE = 6;

function formatTime(secs: number) {
  const minutes = Math.floor(secs / 60);
  const seconds = secs % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function ShareableResultScreen({
  navigation,
  route,
}: DailyResultScreenProps) {
  const insets = useSafeAreaInsets();
  const advancedStatsAccess = useFeatureAccess(FeatureKey.AdvancedStats);
  const {
    holdSeconds,
    avgBpm,
    minBpm,
    rmssd,
    hrDrop,
    stress,
    confidence,
    sampleCount,
    hrvAvailabilityReason,
    ibiSamples = [],
  } = route.params;
  const lungEstimate = estimateLungAge({ holdSeconds, avgBpm, minBpm });
  const health = LUNG_HEALTH_MAP[lungEstimate.key];
  const holdTime = formatTime(holdSeconds);

  const ringCx = AGE_RING_SIZE / 2;
  const ringR = AGE_RING_SIZE / 2 - AGE_RING_STROKE;
  const ringRect = Skia.XYWHRect(ringCx - ringR, ringCx - ringR, ringR * 2, ringR * 2);
  const ageScore = Math.max(0, Math.min(1, (80 - lungEstimate.age) / (80 - 18)));
  const trackPath = Skia.Path.Make();
  trackPath.addArc(ringRect, AGE_RING_START, AGE_RING_SWEEP);
  const arcPath = Skia.Path.Make();
  arcPath.addArc(ringRect, AGE_RING_START, AGE_RING_SWEEP * ageScore);
  const advancedStatsLocked =
    !advancedStatsAccess.allowed && !advancedStatsAccess.isLoading;
  const showAdvancedStatsPaywall = useCallback(() => {
    navigation.navigate('ProPaywall', {
      placement: PaywallPlacement.DailyResultProGate,
      sourceScreen: 'DailyResult',
      feature: FeatureKey.AdvancedStats,
    });
  }, [navigation]);

  const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
  const heroStats: Array<{
    value: string;
    label: string;
    tint: string;
    score: number;
    unavailable?: boolean;
  }> = [
    {
      value: holdTime,
      label: 'Hold',
      tint: colors.primary.blue500,
      score: clamp01(holdSeconds / 120),
    },
    avgBpm != null
      ? {
          value: String(avgBpm),
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
    lungEstimate.hrDropBpm != null
      ? {
          value: String(lungEstimate.hrDropBpm),
          label: 'Max HR Drop',
          tint: colors.success[500],
          score: clamp01(lungEstimate.hrDropBpm / 20),
        }
      : {
          value: '—',
          label: 'Max HR Drop',
          tint: colors.success[500],
          score: 0,
          unavailable: true,
        },
  ];
  const stressZone = stress != null ? getStressZone(stress) : null;

  const miniCx = MINI_RING_SIZE / 2;
  const miniR = MINI_RING_SIZE / 2 - MINI_RING_STROKE;
  const miniRect = Skia.XYWHRect(miniCx - miniR, miniCx - miniR, miniR * 2, miniR * 2);
  const miniTrackPath = Skia.Path.Make();
  miniTrackPath.addArc(miniRect, AGE_RING_START, AGE_RING_SWEEP);
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            style={styles.closeButton}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
          >
            <MaterialCommunityIcons name="close" size={22} color={colors.text.secondary} />
          </Pressable>
          <Text style={styles.title}>Nice work!</Text>
        </View>

        <View style={styles.heroCardWrap}>
          <View style={styles.heroCard}>
            <Text style={styles.lungCardLabel}>Estimated lung age</Text>
            <View style={styles.ageRingWrap}>
              <Canvas style={StyleSheet.absoluteFill}>
                <Path
                  path={trackPath}
                  style="stroke"
                  strokeWidth={AGE_RING_STROKE}
                  strokeCap="round"
                  color={health.color + '26'}
                />
                <Path
                  path={arcPath}
                  style="stroke"
                  strokeWidth={AGE_RING_STROKE}
                  strokeCap="round"
                  color={health.color}
                />
              </Canvas>
              <View style={styles.ageRingCenter} pointerEvents="none">
                <Text style={styles.ageRingValue}>{lungEstimate.age}</Text>
                <Text style={styles.ageRingUnit}>years</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statsHeader}>
          <SectionHeader title="Statistics" />
        </View>

        <View style={styles.statTileRow}>
          {heroStats.map((stat, idx) => {
            const arc = Skia.Path.Make();
            arc.addArc(miniRect, AGE_RING_START, AGE_RING_SWEEP * stat.score);
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

        {stressZone != null && stress != null ? (
          <View style={styles.stressWrap}>
            <StressGauge value={stress} zone={stressZone} />
          </View>
        ) : null}

        <View style={styles.heartResultSection}>
          <HeartRateResultContent
            bpm={avgBpm ?? '—'}
            confidence={confidence}
            sampleCount={sampleCount}
            rmssd={rmssd}
            hrDrop={hrDrop}
            stress={stress}
            hrvAvailabilityReason={hrvAvailabilityReason}
            ibiSamples={ibiSamples}
            showHero={false}
            showRmssd={false}
            showStress={false}
            advancedStatsLocked={advancedStatsLocked}
            onPressUpgrade={showAdvancedStatsPaywall}
          />
        </View>
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

  heroCardWrap: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
  heroCard: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  lungCardLabel: {
    ...typography.label.small,
    color: colors.text.secondary,
    fontFamily: fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  ageRingWrap: {
    width: AGE_RING_SIZE,
    height: AGE_RING_SIZE,
    marginTop: spacing.sm,
    borderRadius: AGE_RING_SIZE / 2,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    shadowColor: colors.neutral[900],
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  ageRingCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageRingValue: {
    ...typography.display.display1,
    fontSize: 72,
    lineHeight: 78,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
  ageRingUnit: {
    ...typography.body.small,
    color: colors.text.tertiary,
    fontFamily: fonts.semibold,
    marginTop: 2,
  },
  statsHeader: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
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

  stressWrap: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: spacing.md,
  },
  heartResultSection: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
});
