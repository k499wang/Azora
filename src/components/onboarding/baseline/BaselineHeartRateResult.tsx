import { Text } from '../../common/Text';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { card, radius } from '../../../theme/card';
import SectionHeader from '../../common/SectionHeader';
import { fonts, typography } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import {
  calculateHeartRateBenchmarks,
  estimateSleepingHeartRateRange,
  restingHeartRateGaugeFill,
} from '../../../lib/restingHeartRate';
import type { CompletedOnboardingBaselineResult } from '../types';
import { scaleControl, scaleVisual } from '../onboardingVisualScale';

interface BaselineHeartRateResultProps {
  result: CompletedOnboardingBaselineResult;
  age: number;
  stepIndex: number;
  stepCount: number;
  onBack: () => void;
  onContinue: () => void;
}

const GAUGE_SIZE = scaleVisual(260);
const GAUGE_STROKE = scaleVisual(15);
const GAUGE_CX = GAUGE_SIZE / 2;
const GAUGE_CY = GAUGE_SIZE / 2;
const GAUGE_R = GAUGE_SIZE / 2 - GAUGE_STROKE / 2 - 8;
const GAUGE_START = 135;
const GAUGE_SWEEP = 270;
const GAUGE_TICK_INNER = GAUGE_R - GAUGE_STROKE / 2 - 6;
const GAUGE_TICK_OUTER = GAUGE_R - GAUGE_STROKE / 2 - 2;
const GAUGE_INNER_R = GAUGE_R - GAUGE_STROKE / 2 - 14;

function gaugeTickPath(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const p = Skia.Path.Make();
  p.moveTo(GAUGE_CX + GAUGE_TICK_INNER * cos, GAUGE_CY + GAUGE_TICK_INNER * sin);
  p.lineTo(GAUGE_CX + GAUGE_TICK_OUTER * cos, GAUGE_CY + GAUGE_TICK_OUTER * sin);
  return p;
}

const GAUGE_RECT = Skia.XYWHRect(
  GAUGE_CX - GAUGE_R,
  GAUGE_CY - GAUGE_R,
  GAUGE_R * 2,
  GAUGE_R * 2,
);

const GAUGE_TRACK_PATH = (() => {
  const p = Skia.Path.Make();
  p.addArc(GAUGE_RECT, GAUGE_START, GAUGE_SWEEP);
  return p;
})();

const GAUGE_TICK_PATHS = [0, 25, 50, 75, 100].map((t) =>
  gaugeTickPath(GAUGE_START + (t / 100) * GAUGE_SWEEP),
);

/** The measured rate, drawn straight onto the dial. */
function gaugeArcPath(fill: number) {
  const ratio = Math.max(0, Math.min(1, fill / 100));
  const p = Skia.Path.Make();
  if (ratio > 0) {
    p.addArc(GAUGE_RECT, GAUGE_START, GAUGE_SWEEP * ratio);
  }
  return p;
}

interface ZoneRowProps {
  label: string;
  value: string;
  unit: string;
  /** What the number means, in the reader's own terms. */
  note: string;
  color: string;
  /** How far up the shared scale the number reaches, as a 0–1 fraction. */
  fill: number;
}

function ZoneRow({ label, value, unit, note, color, fill }: ZoneRowProps) {
  const width: DimensionValue = `${Math.max(0, Math.min(1, fill)) * 100}%`;

  return (
    <View style={styles.zoneRow}>
      <View style={styles.zoneHead}>
        <Text style={styles.zoneLabel}>{label}</Text>
        <View style={styles.zoneValueRow}>
          <Text style={styles.zoneValue}>{value}</Text>
          <Text style={styles.zoneUnit}>{unit}</Text>
        </View>
      </View>
      <View style={styles.zoneTrack}>
        <View style={[styles.zoneFill, { width, backgroundColor: color }]} />
      </View>
      <Text style={styles.note}>{note}</Text>
    </View>
  );
}

export default function BaselineHeartRateResult({
  result,
  age,
  stepIndex,
  stepCount,
  onBack,
  onContinue,
}: BaselineHeartRateResultProps) {
  const avgBpm = result.avgBpm;
  const sleepingRange = estimateSleepingHeartRateRange(avgBpm);
  const benchmarks = calculateHeartRateBenchmarks({ bpm: avgBpm, age });
  // The reading was just taken on the previous screen, so the result lands
  // whole: no sweep up the dial and no counting number, which would restate
  // information the user is already waiting on.
  const arcPath = gaugeArcPath(restingHeartRateGaugeFill(avgBpm));

  // Every bar fills from zero against one scale that tops out at the estimated
  // maximum, so a row's length means the same thing in every row and the
  // maximum is the only one that fills the track.
  const at = (bpm: number) => bpm / benchmarks.estimatedMaximum;

  return (
    <OnboardingScreenLayout
      title="Heart Rate Measurement"
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={
        <OnboardingPrimaryButton label="Continue" onPress={onContinue} />
      }
    >
      <View style={styles.gaugeStage}>
        <View style={styles.gaugeSurface}>
          <Canvas style={StyleSheet.absoluteFill}>
            <Path
              path={GAUGE_TRACK_PATH}
              style="stroke"
              strokeWidth={GAUGE_STROKE}
              strokeCap="round"
              color={colors.neutral[100]}
            />
            <Path
              path={arcPath}
              style="stroke"
              strokeWidth={GAUGE_STROKE}
              strokeCap="round"
              color={colors.primary.blue500}
            />
            {GAUGE_TICK_PATHS.map((p, i) => (
              <Path
                key={i}
                path={p}
                style="stroke"
                strokeWidth={1.5}
                strokeCap="round"
                color={colors.neutral[200]}
              />
            ))}
            <Circle
              cx={GAUGE_CX}
              cy={GAUGE_CY + 3}
              r={GAUGE_INNER_R + 3}
              color="rgba(15,23,42,0.04)"
            />
            <Circle
              cx={GAUGE_CX}
              cy={GAUGE_CY + 1.5}
              r={GAUGE_INNER_R + 1.5}
              color="rgba(15,23,42,0.02)"
            />
            <Circle
              cx={GAUGE_CX}
              cy={GAUGE_CY}
              r={GAUGE_INNER_R + 1}
              color={colors.neutral[200]}
            />
            <Circle
              cx={GAUGE_CX}
              cy={GAUGE_CY}
              r={GAUGE_INNER_R}
              color={colors.background.elevated}
            />
          </Canvas>

          <View style={styles.gaugeCenter} pointerEvents="none">
            <View style={styles.gaugeValueRow}>
              <Text style={styles.gaugeValue}>{avgBpm}</Text>
              <Text style={styles.gaugeValueMax}>bpm</Text>
            </View>
          </View>
        </View>

        <View style={styles.report}>
          <View style={styles.section}>
            <SectionHeader title="At rest" />
            <View style={styles.card}>
              <ZoneRow
                label="Asleep"
                value={`~${sleepingRange.low}–${sleepingRange.high}`}
                unit="BPM"
                note={`Where your heart settles once you are deeply asleep. Reaching ${sleepingRange.high} BPM before bed is the calm you are aiming for.`}
                color={colors.playful.violet.tintDeep}
                fill={at(sleepingRange.high)}
              />
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader title="When you move" />
            <View style={styles.card}>
              <ZoneRow
                label="Moderate effort"
                value={`${benchmarks.moderateActivity.low}–${benchmarks.moderateActivity.high}`}
                unit="BPM"
                note="A brisk walk or an easy ride. You are working, but you can still hold a full sentence."
                color={colors.playful.teal.tintDeep}
                fill={at(benchmarks.moderateActivity.high)}
              />
              <View style={styles.rowDivider} />
              <ZoneRow
                label="Vigorous effort"
                value={`${benchmarks.vigorousActivity.low}–${benchmarks.vigorousActivity.high}`}
                unit="BPM"
                note="Running or hard intervals. Talking comes out in short phrases."
                color={colors.playful.amber.tintDeep}
                fill={at(benchmarks.vigorousActivity.high)}
              />
              <View style={styles.rowDivider} />
              <ZoneRow
                label="Estimated maximum"
                value={`${benchmarks.estimatedMaximum}`}
                unit="BPM"
                note="The fastest your heart is built to beat. Nothing you do here needs to come close to it."
                color={colors.playful.coral.tintDeep}
                fill={at(benchmarks.estimatedMaximum)}
              />
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader title="At this pace" />
            <View style={styles.paceRow}>
              <View style={[styles.card, styles.paceStat]}>
                <Text style={styles.paceValue}>
                  {benchmarks.beatsPerHour.toLocaleString()}
                </Text>
                <Text style={styles.paceLabel}>beats per hour</Text>
              </View>
              <View style={[styles.card, styles.paceStat]}>
                <Text style={styles.paceValue}>
                  {benchmarks.beatsPerDay.toLocaleString()}
                </Text>
                <Text style={styles.paceLabel}>beats per day</Text>
              </View>
            </View>
          </View>

          <Text style={styles.estimateNote}>
            Sleep and activity ranges are estimates, not personal limits.
            Overnight tracking is needed to learn your sleeping range.
          </Text>
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  gaugeStage: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xl,
  },
  gaugeSurface: {
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    borderRadius: GAUGE_SIZE / 2,
    position: 'relative',
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    shadowColor: colors.neutral[900],
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },
  gaugeCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeValueRow: {
    alignItems: 'center',
  },
  gaugeValue: {
    fontFamily: fonts.semibold,
    fontSize: 92,
    lineHeight: 96,
    letterSpacing: -2,
    color: colors.text.primary,
  },
  gaugeValueMax: {
    ...typography.body.large,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
    letterSpacing: -0.2,
    marginTop: -spacing.xs,
  },
  report: {
    width: '100%',
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  card: {
    padding: spacing.md,
    ...card.base,
    ...card.shadow,
  },
  zoneRow: {
    gap: spacing.sm,
  },
  zoneHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  zoneLabel: {
    ...typography.body.medium,
    color: colors.text.secondary,
    flexShrink: 1,
  },
  zoneValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  zoneValue: {
    ...typography.stat.value,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  zoneUnit: {
    ...typography.stat.unit,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
  },
  zoneTrack: {
    height: scaleControl(10),
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
    overflow: 'hidden',
  },
  zoneFill: {
    height: '100%',
    borderRadius: radius.full,
    minWidth: scaleControl(10),
  },
  note: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.neutral[200],
    marginVertical: spacing.md,
  },
  paceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  paceStat: {
    flex: 1,
    gap: spacing.xs,
  },
  paceValue: {
    ...typography.stat.valueMedium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  paceLabel: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  estimateNote: {
    ...typography.body.small,
    color: colors.text.tertiary,
  },
});
