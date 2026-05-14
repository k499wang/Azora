import type { ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';
import LineGraph, { type DataPoint } from '../analytics/LineGraph';
import SectionHeader from '../common/SectionHeader';
import StressGauge from './StressGauge';
import HRVTrackStatCard from '../home/HRVTrackStatCard';
import { getStressZone } from '../../lib/heartRate/stress';
import {
  buildGraphBpmValuePointsFromIbis,
  smoothBpmValuePoints,
} from '../../lib/heartRate/bpmSmoothing';
import type { HrvAvailabilityReason, IbiSample } from '../../lib/heartRate/types';

export interface HeartRateResultStat {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  unit?: string;
  iconColor?: string;
  caption?: string;
  captionColor?: string;
  unavailable?: boolean;
}

interface HeartRateResultContentProps {
  bpm: number | string;
  confidence?: number;
  sampleCount?: number | null;
  rmssd?: number | null;
  sdnn?: number | null;
  hrDrop?: number | null;
  stress?: number | null;
  hrvAvailabilityReason?: HrvAvailabilityReason;
  ibiSamples?: IbiSample[];
  bpmSeries?: DataPoint[];
  rrSeries?: DataPoint[];
  context?: string;
  metaText?: string;
  extraStats?: HeartRateResultStat[];
  heartScale?: Animated.Value;
  showConfidence?: boolean;
  showHero?: boolean;
  advancedStatsLocked?: boolean;
  onPressUpgrade?: () => void;
}

function getConfidenceLabel(confidence: number): { label: string; color: string } {
  if (confidence > 0.7) return { label: 'High Confidence', color: colors.success[500] };
  if (confidence > 0.4) return { label: 'Moderate Confidence', color: colors.warning[500] };
  return { label: 'Low Confidence', color: colors.error[500] };
}

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

function StatCard({
  icon,
  label,
  value,
  unit,
  iconColor,
  caption,
  captionColor,
  unavailable,
}: HeartRateResultStat) {
  return (
    <View style={[styles.statCard, unavailable && styles.statCardUnavailable]}>
      <View style={styles.statCardTop}>
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={
            unavailable
              ? colors.text.tertiary
              : iconColor ?? colors.primary.blue600
          }
        />
        <Text style={[styles.statLabel, unavailable && styles.statLabelMuted]}>
          {label}
        </Text>
      </View>
      <View style={styles.statValueRow}>
        <Text
          style={[
            styles.statValue,
            unavailable && styles.statValueUnavailable,
          ]}
        >
          {value}
        </Text>
        {unit ? (
          <Text style={[styles.statUnit, unavailable && styles.statUnitMuted]}>
            {unit}
          </Text>
        ) : null}
        {caption ? (
          <Text style={[styles.statCaption, captionColor ? { color: captionColor } : null]}>
            {caption}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function HeartRateResultContent({
  bpm,
  confidence,
  sampleCount,
  rmssd,
  hrDrop,
  stress,
  hrvAvailabilityReason,
  ibiSamples = [],
  bpmSeries,
  rrSeries,
  context,
  metaText,
  extraStats = [],
  heartScale,
  showConfidence = true,
  showHero = true,
  advancedStatsLocked = false,
  onPressUpgrade,
}: HeartRateResultContentProps) {
  const rmssdValue =
    rmssd != null && Number.isFinite(rmssd)
      ? `${Math.round(rmssd)}`
      : null;
  const stressValue = stress?.toString() ?? null;
  const hrvUnavailableMessage = getHrvUnavailableMessage(hrvAvailabilityReason);
  const confidenceInfo =
    confidence != null ? getConfidenceLabel(confidence) : null;

  const rmssdNumeric =
    rmssd != null && Number.isFinite(rmssd)
      ? rmssd
      : advancedStatsLocked
        ? 48
        : null;
  const basicStatRows: HeartRateResultStat[][] = [];
  for (let i = 0; i < extraStats.length; i += 2) {
    basicStatRows.push(extraStats.slice(i, i + 2));
  }

  const resolvedBpmSeries = bpmSeries != null
    ? smoothBpmValuePoints(bpmSeries)
    : buildGraphBpmValuePointsFromIbis(
        ibiSamples,
        (sample) => `${Math.round(sample.offsetMs / 1000)}s`,
      );
  const resolvedRrSeries = rrSeries ?? downsampleIbi(ibiSamples, (s) => Math.round(s.ibiMs));
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

  const heart = (
    <View style={styles.heartIconContainer}>
      <MaterialCommunityIcons
        name="heart"
        size={56}
        color={colors.error[500]}
      />
    </View>
  );

  return (
    <View style={styles.content}>
      {showHero ? (
        <>
          {heartScale != null ? (
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              {heart}
            </Animated.View>
          ) : heart}

          <Text style={styles.resultTitle}>Heart Rate</Text>
          {metaText != null ? <Text style={styles.metaText}>{metaText}</Text> : null}

          <View style={styles.bpmContainer}>
            <Text style={styles.bpmNumber}>{bpm}</Text>
            <Text style={styles.bpmUnit}>bpm</Text>
          </View>

          {showConfidence && confidenceInfo != null ? (
            <View style={[styles.confidenceBadge, { backgroundColor: `${confidenceInfo.color}15` }]}>
              <View style={[styles.confidenceDot, { backgroundColor: confidenceInfo.color }]} />
              <Text style={[styles.confidenceText, { color: confidenceInfo.color }]}>
                {confidenceInfo.label}
              </Text>
            </View>
          ) : null}
        </>
      ) : null}

      {extraStats.length > 0 ? (
        <>
          <View style={styles.sectionHeaderWrap}>
            <SectionHeader title="Heart statistics" />
          </View>
          <View style={styles.statsGrid}>
            {basicStatRows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.statsRow}>
                {row.map((stat) => (
                  <StatCard key={stat.label} {...stat} />
                ))}
                {row.length === 1 ? <View style={styles.statCardSpacer} /> : null}
              </View>
            ))}
          </View>
        </>
      ) : null}

      <View style={styles.sectionHeaderWrap}>
        <SectionHeader title="Advanced stats" />
      </View>

      <LockedOverlay locked={advancedStatsLocked} onPressUpgrade={onPressUpgrade}>
        <View style={styles.proStatsColumn}>
          <HRVTrackStatCard
            label="RMSSD"
            value={rmssdNumeric}
            unit="ms"
            icon="stat-rmssd-wave"
            max={80}
            lowBound={20}
            highBound={50}
          />
        </View>

        {stressZoneForDisplay != null && stressForDisplay != null ? (
          <View style={styles.gaugeWrap}>
            <StressGauge value={stressForDisplay} zone={stressZoneForDisplay} />
          </View>
        ) : null}

        {showBpmGraph ? (
          <View style={styles.graphCard}>
            <Text style={styles.graphTitle}>Heart rate</Text>
            <LineGraph
              data={displayBpmSeries}
              unit=""
              height={180}
              lineColor={colors.primary.blue500}
              fillColor={colors.primary.blue100}
              dotColor={colors.primary.blue600}
            />
          </View>
        ) : null}

        {showRrGraph ? (
          <View style={styles.graphCard}>
            <Text style={styles.graphTitle}>Heart rate variability</Text>
            <LineGraph
              data={displayRrSeries}
              unit=""
              height={180}
              lineColor={colors.error[500]}
              fillColor={`${colors.error[500]}1A`}
              dotColor={colors.error[500]}
            />
          </View>
        ) : null}
      </LockedOverlay>

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

function LockedOverlay({ locked, onPressUpgrade, children }: LockedOverlayProps) {
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
  heartIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  resultTitle: {
    ...typography.title.title1,
    fontFamily: fonts.medium,
    fontWeight: '500',
    fontSize: 32,
    lineHeight: 40,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  metaText: {
    ...typography.body.small,
    color: colors.text.tertiary,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  bpmContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  bpmNumber: {
    ...typography.display.display1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 72,
    lineHeight: 80,
    color: colors.text.primary,
  },
  bpmUnit: {
    ...typography.heading.heading1,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: 20,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confidenceText: {
    ...typography.caption.caption1,
    fontWeight: '600',
  },
  sectionHeaderWrap: {
    width: '100%',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  statsGrid: {
    width: '100%',
    gap: spacing.sm,
  },
  proStatsColumn: {
    width: '100%',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    ...card.base,
    ...card.shadow,
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  statCardSpacer: {
    flex: 1,
  },
  proStatsCard: {
    ...card.base,
    ...card.shadow,
    width: '100%',
    gap: spacing.xs,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  proStatsCardPressed: {
    opacity: 0.85,
  },
  proStatsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  proStatsLabel: {
    ...typography.label.medium,
    flex: 1,
    color: colors.text.secondary,
    fontFamily: fonts.medium,
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
  proStatsTitle: {
    ...typography.heading.heading2,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
  },
  proStatsText: {
    ...typography.body.small,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  statCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statLabel: {
    ...typography.label.medium,
    color: colors.text.secondary,
    fontFamily: fonts.medium,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  statValue: {
    ...typography.display.display3,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '500',
  },
  statValueUnavailable: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.tertiary,
    fontSize: 14,
    lineHeight: 18,
  },
  statCardUnavailable: {
    opacity: 0.65,
  },
  statLabelMuted: {
    color: colors.text.tertiary,
  },
  statUnitMuted: {
    color: colors.text.tertiary,
  },
  statUnit: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
  },
  statCaption: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    fontWeight: '600',
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
  graphTitle: {
    ...typography.heading.heading1,
    color: colors.text.secondary,
    fontFamily: fonts.semibold,
    marginBottom: spacing.xs,
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
