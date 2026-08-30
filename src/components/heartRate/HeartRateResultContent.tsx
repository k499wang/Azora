import { Text } from '../common/Text';
import type { ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { LockedScrim } from '../common/glass';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing, margin } from '../../theme/spacing';
import { card } from '../../theme/card';
import { type DataPoint } from '../analytics/LineGraph';
import SectionHeader from '../common/SectionHeader';
import ProUpgradeButton from '../common/ProUpgradeButton';
import StressGauge from './StressGauge';
import RestingHeartRateBar from './RestingHeartRateBar';
import HRVTrackStatCard from './HRVTrackStatCard';
import BPMChart from './BPMChart';
import HRVChart from './HRVChart';
import CardSurface from '../common/CardSurface';
import { useDashboardLayout } from '../../hooks/useDashboardLayout';
import { DEFAULT_CARD_SURFACE } from '../common/cardSurfaceConfig';
import { getStressZone } from '../../lib/heartRate/stress';
import type { BpmTimePoint } from '../../lib/heartRate/bpmSeries';
import type {
  HrvAvailabilityReason,
  IbiSample,
  SignalCoverage,
} from '../../lib/heartRate/types';

interface HeartRateResultContentProps {
  bpm: number | string;
  rmssd?: number | null;
  sdnn?: number | null;
  stress?: number | null;
  hrvAvailabilityReason?: HrvAvailabilityReason;
  signalCoverage?: SignalCoverage | null;
  ibiSamples?: IbiSample[];
  bpmSamples?: BpmTimePoint[];
  rrSeries?: DataPoint[];
  context?: string;
  heartScale?: Animated.Value;
  showHero?: boolean;
  advancedStatsLocked?: boolean;
  onPressUpgrade?: () => void;
  showRmssd?: boolean;
  showStress?: boolean;
  showHrv?: boolean;
  showRestingHealthBar?: boolean;
  age?: number | null;
}

const HERO_RING_SIZE = 240;
const HERO_RING_STROKE = 16;
const HERO_RING_START = 135;
const HERO_RING_SWEEP = 270;
const HERO_BPM_MIN = 40;
const HERO_BPM_MAX = 120;

// Below this share of the measurement the finger was off the lens, moving, or
// pressed too hard for long enough that the numbers deserve a caveat.
const MIN_TRUSTED_SIGNAL_COVERAGE = 0.9;

function getSignalCoverageMessage(
  coverage: SignalCoverage | null | undefined,
): string | null {
  if (coverage == null || coverage.ratio >= MIN_TRUSTED_SIGNAL_COVERAGE) return null;

  const lost = coverage.lostSeconds;
  const duration = lost >= 60
    ? `${Math.round(lost / 60)} min`
    : `${lost}s`;

  return `Your pulse was lost for about ${duration} of this measurement, so these numbers are less reliable than usual. Keep your finger still and fully covering the camera next time.`;
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

export function HeartRateResultContent({
  bpm,
  rmssd,
  sdnn,
  stress,
  hrvAvailabilityReason,
  signalCoverage,
  ibiSamples = [],
  bpmSamples,
  rrSeries,
  context,
  heartScale,
  showHero = true,
  advancedStatsLocked = false,
  onPressUpgrade,
  showRmssd = true,
  showStress = true,
  showHrv = true,
  showRestingHealthBar = false,
  age = null,
}: HeartRateResultContentProps) {
  const dashboardLayout = useDashboardLayout();
  const rmssdValue =
    rmssd != null && Number.isFinite(rmssd)
      ? `${Math.round(rmssd)}`
      : null;
  const stressValue = stress?.toString() ?? null;
  const signalCoverageMessage = advancedStatsLocked
    ? null
    : getSignalCoverageMessage(signalCoverage);
  // A dropout is usually why HRV is missing too — leading with the cause beats
  // stacking two notices that say the same thing.
  const hrvUnavailableMessage = signalCoverageMessage != null
    ? null
    : getHrvUnavailableMessage(hrvAvailabilityReason);

  const rmssdNumeric =
    rmssd != null && Number.isFinite(rmssd)
      ? rmssd
      : advancedStatsLocked
        ? 48
        : null;
  const sdnnFromProp =
    sdnn != null && Number.isFinite(sdnn) && sdnn > 0 ? sdnn : null;
  const sdnnRaw = sdnnFromProp;
  const sdnnNumeric = sdnnRaw ?? (advancedStatsLocked ? 55 : null);
  const bpmChartSamples =
    bpmSamples != null && bpmSamples.length >= 2 ? bpmSamples : undefined;
  const chartIbiMs = ibiSamples.map((sample) => sample.ibiMs);
  const rrChartIbiMs =
    chartIbiMs.length >= 2
      ? chartIbiMs
      : (rrSeries ?? downsampleIbi(ibiSamples, (s) => Math.round(s.ibiMs))).map(
          (point) => point.value,
        );
  const showBpmGraph =
    bpmChartSamples != null || chartIbiMs.length >= 2 || advancedStatsLocked;
  // The HRV card always renders — when no intervals survived it shows its empty
  // state rather than disappearing from a section the user expects it in.
  const rrEmptyMessage = rrChartIbiMs.length >= 2
    ? undefined
    : 'HRV could not be read from this measurement. Keep your finger pressed still against the camera for the full session.';
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

      {showRestingHealthBar && Number.isFinite(heroBpmNumber) ? (
        <View style={styles.restingBarWrap}>
          <RestingHeartRateBar
            bpm={heroBpmNumber}
            age={age}
            title="Average heart rate"
            surface={DEFAULT_CARD_SURFACE}
          />
        </View>
      ) : null}

      {signalCoverageMessage != null ? (
        <CardSurface style={styles.hrvUnavailableCard}>
          <MaterialCommunityIcons
            name="alert-outline"
            size={16}
            color={colors.warning[500]}
          />
          <Text style={styles.hrvUnavailableText}>{signalCoverageMessage}</Text>
        </CardSurface>
      ) : null}

      {showHrv &&
      !advancedStatsLocked &&
      rmssdValue == null &&
      stressValue == null &&
      hrvUnavailableMessage != null ? (
        <CardSurface style={styles.hrvUnavailableCard}>
          <MaterialCommunityIcons
            name="information-outline"
            size={16}
            color={colors.text.secondary}
          />
          <Text style={styles.hrvUnavailableText}>{hrvUnavailableMessage}</Text>
        </CardSurface>
      ) : null}

      {showHrv && (showRmssd || showStress) ? (
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
            {showStress ? (
              <View style={styles.gaugeWrap}>
                <StressGauge
                  value={stressForDisplay}
                  zone={stressZoneForDisplay}
                  locked={advancedStatsLocked}
                  onPressLocked={onPressUpgrade}
                  surface={DEFAULT_CARD_SURFACE}
                />
              </View>
            ) : null}

            {showRmssd ? (
              <View
                style={[
                  styles.proStatsColumn,
                  dashboardLayout.hasColumns && styles.proStatsRow,
                ]}
              >
                <View
                  style={dashboardLayout.hasColumns ? styles.proStatWide : undefined}
                >
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
                </View>
                <View
                  style={dashboardLayout.hasColumns ? styles.proStatWide : undefined}
                >
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
              </View>
            ) : null}
        </>
      ) : null}

      {showHrv ? (
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
              <View style={styles.graphCardWrap}>
                <BPMChart
                  bpmSamples={bpmChartSamples}
                  ibiMs={chartIbiMs}
                  locked={advancedStatsLocked}
                  onPressLocked={onPressUpgrade}
                />
              </View>
            ) : null}

            <View style={styles.graphCardWrap}>
              <HRVChart
                ibiMs={rrChartIbiMs}
                insightSummary={{
                  rmssd: rmssd ?? null,
                  sdnn: sdnn ?? null,
                  avgBpm: Number.isFinite(heroBpmNumber) ? heroBpmNumber : null,
                }}
                locked={advancedStatsLocked}
                onPressLocked={onPressUpgrade}
                emptyMessage={rrEmptyMessage}
              />
            </View>
        </>
      ) : null}

      {context != null ? (
        <CardSurface style={styles.contextCard}>
          <Text style={styles.contextLabel}>Context</Text>
          <Text style={styles.contextValue}>{context}</Text>
        </CardSurface>
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
      <LockedScrim />
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
  restingBarWrap: {
    width: '100%',
    marginTop: spacing.sm,
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
    fontWeight: '500',
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
    marginBottom: spacing.md,
  },
  proStatsColumn: {
    width: '100%',
    flexDirection: 'column',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  proStatsRow: {
    flexDirection: 'row',
  },
  proStatWide: {
    flex: 1,
  },
  proBadge: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.neutral[900],
  },
  proBadgeText: {
    ...typography.caption.caption2,
    color: colors.text.inverse,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
  hrvUnavailableCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  hrvUnavailableText: {
    ...typography.body.small,
    color: colors.text.secondary,
    flex: 1,
  },
  contextCard: {
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
  graphCardWrap: {
    width: '100%',
    marginTop: spacing.sm,
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
    fontWeight: '500',
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
