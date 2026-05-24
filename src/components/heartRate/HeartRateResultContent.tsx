import type { ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing, margin } from '../../theme/spacing';
import { card } from '../../theme/card';
import LineGraph, { type DataPoint } from '../analytics/LineGraph';
import SectionHeader from '../common/SectionHeader';
import ProUpgradeButton from '../common/ProUpgradeButton';
import StressGauge from './StressGauge';
import HRVTrackStatCard from '../home/HRVTrackStatCard';
import { getStressZone } from '../../lib/heartRate/stress';
import {
  buildGraphBpmValuePointsFromIbis,
  smoothBpmValuePoints,
} from '../../lib/heartRate/bpmSmoothing';
import type { HrvAvailabilityReason, HrvConfidence, IbiSample } from '../../lib/heartRate/types';

interface HeartRateResultContentProps {
  bpm: number | string;
  confidence?: number;
  sampleCount?: number | null;
  rmssd?: number | null;
  sdnn?: number | null;
  hrDrop?: number | null;
  stress?: number | null;
  hrvConfidence?: HrvConfidence;
  hrvAvailabilityReason?: HrvAvailabilityReason;
  ibiSamples?: IbiSample[];
  holdStartOffsetSeconds?: number;
  bpmSeries?: DataPoint[];
  rrSeries?: DataPoint[];
  context?: string;
  metaText?: string;
  heartScale?: Animated.Value;
  showConfidence?: boolean;
  showHero?: boolean;
  advancedStatsLocked?: boolean;
  onPressUpgrade?: () => void;
  showRmssd?: boolean;
  showStress?: boolean;
}

const HERO_RING_SIZE = 240;
const HERO_RING_STROKE = 16;
const HERO_RING_START = 135;
const HERO_RING_SWEEP = 270;
const HERO_BPM_MIN = 40;
const HERO_BPM_MAX = 120;

function getHrvUnavailableMessage(
  reason: HrvAvailabilityReason | undefined,
): string | null {
  switch (reason) {
    case 'not_enough_clean_beats':
      return 'HRV unavailable. Please try again with your finger steady over the camera.';
    case 'low_signal_quality':
      return 'HRV unavailable. Please try again in a quiet position with steady pressure.';
    default:
      return null;
  }
}

function downsampleIbi(
  samples: IbiSample[],
  toDataPoint: (s: IbiSample) => number,
  maxPoints = 24,
): DataPoint[] {
  if (samples.length === 0) return [];
  const fmt = (offsetMs: number) => `${Math.round(offsetMs / 1000)}s`;
  if (samples.length <= maxPoints) {
    return samples.map((s) => ({ label: fmt(s.offsetMs), value: toDataPoint(s) }));
  }
  const step = (samples.length - 1) / (maxPoints - 1);
  const out: DataPoint[] = [];
  for (let i = 0; i < maxPoints; i++) {
    const s = samples[Math.round(i * step)];
    out.push({ label: fmt(s.offsetMs), value: toDataPoint(s) });
  }
  return out;
}

function findClosestIbiIndex(samples: IbiSample[], offsetSeconds: number | undefined): number | undefined {
  if (offsetSeconds == null || samples.length === 0) return undefined;
  const offsetMs = offsetSeconds * 1000;
  let bestIndex = 0;
  let bestDistance = Math.abs(samples[0].offsetMs - offsetMs);
  for (let i = 1; i < samples.length; i++) {
    const distance = Math.abs(samples[i].offsetMs - offsetMs);
    if (distance < bestDistance) {
      bestIndex = i;
      bestDistance = distance;
    }
  }
  return bestIndex;
}

export function HeartRateResultContent({
  bpm,
  confidence,
  sampleCount,
  rmssd,
  sdnn,
  hrDrop,
  stress,
  hrvConfidence,
  hrvAvailabilityReason,
  ibiSamples = [],
  holdStartOffsetSeconds,
  bpmSeries,
  rrSeries,
  context,
  metaText,
  heartScale,
  showConfidence = true,
  showHero = true,
  advancedStatsLocked = false,
  onPressUpgrade,
  showRmssd = true,
  showStress = true,
}: HeartRateResultContentProps) {
  const rmssdValue =
    rmssd != null && Number.isFinite(rmssd)
      ? `${Math.round(rmssd)}`
      : null;
  const stressValue = stress?.toString() ?? null;
  const hrvUnavailableMessage = getHrvUnavailableMessage(hrvAvailabilityReason);
  const showLowHrvConfidence =
    hrvConfidence === 'low' &&
    hrvUnavailableMessage == null &&
    (rmssdValue != null || sdnn != null);

  const rmssdNumeric =
    rmssd != null && Number.isFinite(rmssd)
      ? rmssd
      : advancedStatsLocked
        ? 48
        : null;
  const sdnnFromProp =
    sdnn != null && Number.isFinite(sdnn) && sdnn > 0 ? sdnn : null;
  const sdnnNumeric = sdnnFromProp ?? (advancedStatsLocked ? 55 : null);
  const resolvedBpmSeries = bpmSeries != null
    ? smoothBpmValuePoints(bpmSeries)
    : buildGraphBpmValuePointsFromIbis(
        ibiSamples,
        (sample) => `${Math.round(sample.offsetMs / 1000)}s`,
      );
  const resolvedRrSeries = rrSeries ?? downsampleIbi(ibiSamples, (s) => Math.round(s.ibiMs));
  const holdStartHighlightIndex =
    bpmSeries == null && resolvedBpmSeries.length >= 2
      ? findClosestIbiIndex(ibiSamples, holdStartOffsetSeconds)
      : undefined;
  const rrHoldStartHighlightIndex =
    rrSeries == null && resolvedRrSeries.length >= 2 && ibiSamples.length <= 24
      ? holdStartHighlightIndex
      : undefined;
  const placeholderBpmSeries: DataPoint[] = Array.from({ length: 12 }, (_, i) => ({
    label: `${i * 2}s`,
    value: 72 + Math.round(Math.sin(i * 0.6) * 6),
  }));
  const placeholderRrSeries: DataPoint[] = Array.from({ length: 12 }, (_, i) => ({
    label: `${i * 2}s`,
    value: 820 + Math.round(Math.cos(i * 0.5) * 40),
  }));
  const showBpmGraph =
    resolvedBpmSeries.length >= 2 || advancedStatsLocked;
  const showRrGraph =
    resolvedRrSeries.length >= 2 || advancedStatsLocked;
  const displayBpmSeries =
    resolvedBpmSeries.length >= 2 ? resolvedBpmSeries : placeholderBpmSeries;
  const displayRrSeries =
    resolvedRrSeries.length >= 2 ? resolvedRrSeries : placeholderRrSeries;
  const stressForDisplay =
    stress != null ? stress : advancedStatsLocked ? 42 : null;
  const stressZoneForDisplay =
    stressForDisplay != null ? getStressZone(stressForDisplay) : null;

  const heroBpmNumber = typeof bpm === 'number' ? bpm : Number(bpm);
  const heroScore =
    Number.isFinite(heroBpmNumber)
      ? Math.max(0, Math.min(1, (HERO_BPM_MAX - heroBpmNumber) / (HERO_BPM_MAX - HERO_BPM_MIN)))
      : 0;
  const heroCx = HERO_RING_SIZE / 2;
  const heroR = HERO_RING_SIZE / 2 - HERO_RING_STROKE;
  const heroRect = Skia.XYWHRect(heroCx - heroR, heroCx - heroR, heroR * 2, heroR * 2);
  const heroTrack = Skia.Path.Make();
  heroTrack.addArc(heroRect, HERO_RING_START, HERO_RING_SWEEP);
  const heroArc = Skia.Path.Make();
  heroArc.addArc(heroRect, HERO_RING_START, HERO_RING_SWEEP * heroScore);

  const heroRing = (
    <View style={styles.heroRingWrap}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Path
          path={heroTrack}
          style="stroke"
          strokeWidth={HERO_RING_STROKE}
          strokeCap="round"
          color={colors.error[500] + '26'}
        />
        {heroScore > 0 && (
          <Path
            path={heroArc}
            style="stroke"
            strokeWidth={HERO_RING_STROKE}
            strokeCap="round"
            color={colors.error[500]}
          />
        )}
      </Canvas>
      <View style={styles.heroRingCenter} pointerEvents="none">
        <Text style={styles.heroRingValue}>{bpm}</Text>
        <Text style={styles.heroRingUnit}>bpm</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.content}>
      {showHero ? (
        heartScale != null ? (
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            {heroRing}
          </Animated.View>
        ) : (
          heroRing
        )
      ) : null}

      {showRmssd ||
      (showStress && stressZoneForDisplay != null && stressForDisplay != null) ? (
        <>
          <View style={styles.sectionHeaderWrap}>
            <SectionHeader
              title="Statistics"
              right={
                advancedStatsLocked ? (
                  <ProUpgradeButton onPress={onPressUpgrade} />
                ) : null
              }
            />
          </View>
            {showStress && stressZoneForDisplay != null && stressForDisplay != null ? (
              <View style={styles.gaugeWrap}>
                <StressGauge
                  value={stressForDisplay}
                  zone={stressZoneForDisplay}
                  locked={advancedStatsLocked}
                  onPressLocked={onPressUpgrade}
                />
              </View>
            ) : null}

            {showRmssd ? (
              <View style={styles.proStatsColumn}>
                <HRVTrackStatCard
                  label="RMSSD"
                  value={rmssdNumeric}
                  unit="ms"
                  max={80}
                  lowBound={20}
                  highBound={50}
                  locked={advancedStatsLocked}
                  onPressLocked={onPressUpgrade}
                />
                <HRVTrackStatCard
                  label="Avg HRV"
                  value={sdnnNumeric}
                  unit="ms"
                  max={100}
                  lowBound={30}
                  highBound={70}
                  locked={advancedStatsLocked}
                  onPressLocked={onPressUpgrade}
                />
              </View>
            ) : null}
        </>
      ) : null}

      {showBpmGraph || showRrGraph ? (
        <>
          <View style={styles.sectionHeaderWrap}>
            <SectionHeader
              title="Advanced statistics"
              right={
                advancedStatsLocked ? (
                  <ProUpgradeButton onPress={onPressUpgrade} />
                ) : null
              }
            />
          </View>
            {showBpmGraph ? (
              <View style={[styles.graphCard, advancedStatsLocked && styles.lockedGraphCard]}>
                <Text style={[styles.graphTitle, advancedStatsLocked && styles.lockedTitleText]}>
                  Heart rate
                </Text>
                <LineGraph
                  data={displayBpmSeries}
                  unit=""
                  height={180}
                  lineColor={colors.primary.blue500}
                  fillColor={colors.primary.blue100}
                  dotColor={colors.primary.blue600}
                  highlightIndex={holdStartHighlightIndex}
                />
                {advancedStatsLocked ? (
                  <>
                    <BlurView
                      intensity={24}
                      tint="light"
                      pointerEvents="none"
                      style={StyleSheet.absoluteFill}
                    />
                    <Text style={[styles.graphTitle, styles.clearGraphTitle]}>
                      Heart rate
                    </Text>
                    {onPressUpgrade ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={onPressUpgrade}
                        style={StyleSheet.absoluteFill}
                      />
                    ) : null}
                  </>
                ) : null}
              </View>
            ) : null}

            {showRrGraph ? (
              <View style={[styles.graphCard, advancedStatsLocked && styles.lockedGraphCard]}>
                <Text style={[styles.graphTitle, advancedStatsLocked && styles.lockedTitleText]}>
                  Heart rate variability
                </Text>
                <LineGraph
                  data={displayRrSeries}
                  unit=""
                  height={180}
                  lineColor={colors.error[500]}
                  fillColor={`${colors.error[500]}1A`}
                  dotColor={colors.error[500]}
                  highlightIndex={rrHoldStartHighlightIndex}
                />
                {advancedStatsLocked ? (
                  <>
                    <BlurView
                      intensity={24}
                      tint="light"
                      pointerEvents="none"
                      style={StyleSheet.absoluteFill}
                    />
                    <Text style={[styles.graphTitle, styles.clearGraphTitle]}>
                      Heart rate variability
                    </Text>
                    {onPressUpgrade ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={onPressUpgrade}
                        style={StyleSheet.absoluteFill}
                      />
                    ) : null}
                  </>
                ) : null}
              </View>
            ) : null}
        </>
      ) : null}

      {!advancedStatsLocked &&
      showLowHrvConfidence ? (
        <View style={styles.hrvUnavailableCard}>
          <MaterialCommunityIcons
            name="information-outline"
            size={16}
            color={colors.text.secondary}
          />
          <Text style={styles.hrvUnavailableText}>Lower confidence HRV reading.</Text>
        </View>
      ) : null}

      {!advancedStatsLocked &&
      rmssdValue == null &&
      stressValue == null &&
      hrvUnavailableMessage != null ? (
        <View style={styles.hrvUnavailableCard}>
          <MaterialCommunityIcons
            name="information-outline"
            size={16}
            color={colors.text.secondary}
          />
          <Text style={styles.hrvUnavailableText}>{hrvUnavailableMessage}</Text>
        </View>
      ) : null}

      {context != null ? (
        <View style={styles.contextCard}>
          <Text style={styles.contextLabel}>Context</Text>
          <Text style={styles.contextValue}>{context}</Text>
        </View>
      ) : null}
    </View>
  );
}

interface LockedOverlayProps {
  locked: boolean;
  onPressUpgrade?: () => void;
  children: ReactNode;
}

export function LockedOverlay({ locked, onPressUpgrade, children }: LockedOverlayProps) {
  if (!locked) {
    return <>{children}</>;
  }
  return (
    <View style={styles.lockedWrap}>
      <View pointerEvents="none" style={styles.lockedContent}>
        {children}
      </View>
      <BlurView
        intensity={18}
        tint="light"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient
        pointerEvents="none"
        colors={[
          'rgba(255,255,255,0)',
          'rgba(255,255,255,0.45)',
          'rgba(255,255,255,0.45)',
          'rgba(255,255,255,0)',
        ]}
        locations={[0, 0.25, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.lockedCenter} pointerEvents="box-none">
        <Pressable
          disabled={onPressUpgrade == null}
          onPress={onPressUpgrade}
          style={({ pressed }) => [
            styles.lockedCta,
            pressed && styles.lockedCtaPressed,
          ]}
        >
          <MaterialCommunityIcons
            name="lock"
            size={18}
            color={colors.text.inverse}
          />
          <Text style={styles.lockedCtaText}>Get Pro to unlock</Text>
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        </Pressable>
        <View style={styles.lockedSubtextPill}>
          <Text style={styles.lockedSubtext}>
            HRV, stress, and recovery graphs are part of Azora Pro.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    width: '100%',
  },
  heroRingWrap: {
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
    marginBottom: spacing.lg,
  },
  heroRingCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRingValue: {
    ...typography.display.display1,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 72,
    lineHeight: 78,
    color: colors.text.primary,
  },
  heroRingUnit: {
    ...typography.body.medium,
    color: colors.text.tertiary,
    fontFamily: fonts.semibold,
    marginTop: 2,
  },
  sectionHeaderWrap: {
    width: '100%',
    marginTop: margin.resultSection,
    marginBottom: spacing.sm,
  },
  proStatsColumn: {
    width: '100%',
    flexDirection: 'column',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  proBadge: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.neutral[900],
  },
  proBadgeText: {
    ...typography.caption.caption2,
    color: colors.text.inverse,
    fontFamily: fonts.semibold,
    fontWeight: '700',
  },
  hrvUnavailableCard: {
    ...card.base,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  hrvUnavailableText: {
    ...typography.body.small,
    color: colors.text.secondary,
    flex: 1,
  },
  contextCard: {
    ...card.base,
    width: '100%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    gap: 2,
  },
  contextLabel: {
    ...typography.label.medium,
    color: colors.text.secondary,
    fontFamily: fonts.medium,
  },
  contextValue: {
    ...typography.body.small,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
  },
  gaugeWrap: {
    width: '100%',
    marginTop: spacing.sm,
  },
  graphCard: {
    ...card.base,
    ...card.shadow,
    width: '100%',
    padding: spacing.md,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  lockedGraphCard: {
    position: 'relative',
  },
  graphTitle: {
    ...typography.heading.heading1,
    color: colors.text.secondary,
    fontFamily: fonts.semibold,
    marginBottom: spacing.xs,
  },
  lockedTitleText: {
    opacity: 0,
  },
  clearGraphTitle: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    zIndex: 2,
  },
  lockedWrap: {
    width: '100%',
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },
  lockedContent: {
    width: '100%',
  },
  lockedCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  lockedCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.neutral[900],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 999,
    ...card.shadow,
  },
  lockedCtaPressed: {
    opacity: 0.85,
  },
  lockedCtaText: {
    ...typography.label.medium,
    color: colors.text.inverse,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
  lockedSubtext: {
    ...typography.caption.caption1,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    textAlign: 'center',
  },
  lockedSubtextPill: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    maxWidth: '92%',
    ...card.shadow,
  },
});
