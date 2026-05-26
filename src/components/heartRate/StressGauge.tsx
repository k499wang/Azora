import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  Canvas,
  Circle,
  Path,
  Skia,
  SweepGradient,
  vec,
} from '@shopify/react-native-skia';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';
import StressStatsRow from './StressStatsRow';
import {
  getStressStats,
  type StressHistoryEntry,
} from '../../lib/heartRate/stress';

interface StressGaugeProps {
  value: number | null;
  zone: { label: string; color: string } | null;
  history?: StressHistoryEntry[];
  locked?: boolean;
  onPressLocked?: () => void;
}

const SIZE = 220;
const MIN_STRESS_STATS_POINTS = 4;
const STROKE = 10;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = SIZE / 2 - STROKE / 2 - 6;
const START_ANGLE = 135;
const SWEEP = 270;
const TICK_INNER = R - STROKE / 2 - 6;
const TICK_OUTER = R - STROKE / 2 - 2;
const INNER_R = R - STROKE / 2 - 14;

function tickPath(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const p = Skia.Path.Make();
  p.moveTo(CX + TICK_INNER * cos, CY + TICK_INNER * sin);
  p.lineTo(CX + TICK_OUTER * cos, CY + TICK_OUTER * sin);
  return p;
}

export default function StressGauge({
  value,
  zone,
  history,
  locked = false,
  onPressLocked,
}: StressGaugeProps) {
  const stats = history != null ? getStressStats(history) : null;
  const hasValue = value != null && Number.isFinite(value);
  const clamped = hasValue ? Math.max(0, Math.min(100, value)) : null;
  const sweep = clamped != null ? (clamped / 100) * SWEEP : null;

  const rect = Skia.XYWHRect(CX - R, CY - R, R * 2, R * 2);

  const track = Skia.Path.Make();
  track.addArc(rect, START_ANGLE, SWEEP);

  const progress = Skia.Path.Make();
  if (sweep != null) {
    progress.addArc(rect, START_ANGLE, sweep);
  }

  const ticks = [0, 25, 50, 75, 100].map((t) =>
    tickPath(START_ANGLE + (t / 100) * SWEEP),
  );

  return (
    <View style={[styles.card, locked && styles.lockedCard]}>
      <Text style={[styles.title, locked && styles.lockedTitleText]}>
        Stress Index
      </Text>

      <View style={styles.ringSurface}>
        <Canvas style={styles.canvas}>
          <Path
            path={track}
            style="stroke"
            strokeWidth={STROKE}
            strokeCap="round"
            color={colors.neutral[100]}
          />
          {zone != null ? (
            <Path
              path={progress}
              style="stroke"
              strokeWidth={STROKE}
              strokeCap="round"
            >
              <SweepGradient
                c={vec(CX, CY)}
                start={START_ANGLE}
                end={START_ANGLE + SWEEP}
                colors={[zone.color + '55', zone.color]}
              />
            </Path>
          ) : null}
          {ticks.map((p, i) => (
            <Path
              key={i}
              path={p}
              style="stroke"
              strokeWidth={1.5}
              strokeCap="round"
              color={colors.neutral[200]}
            />
          ))}

          <Circle cx={CX} cy={CY + 3} r={INNER_R + 3} color="rgba(15,23,42,0.04)" />
          <Circle cx={CX} cy={CY + 1.5} r={INNER_R + 1.5} color="rgba(15,23,42,0.02)" />
          <Circle cx={CX} cy={CY} r={INNER_R + 1} color={colors.neutral[200]} />
          <Circle cx={CX} cy={CY} r={INNER_R} color={colors.background.elevated} />
        </Canvas>

        <View style={styles.centerOverlay} pointerEvents="none">
          <View style={styles.valueRow}>
            <Text style={styles.value}>{clamped ?? '--'}</Text>
            <Text style={styles.valueMax}>/100</Text>
          </View>
          {zone != null ? (
            <View style={[styles.zonePill, { borderColor: zone.color + '33' }]}>
              <View style={[styles.zoneDot, { backgroundColor: zone.color }]} />
              <Text style={[styles.zoneLabel, { color: zone.color }]}>
                {zone.label}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {stats != null && stats.count >= MIN_STRESS_STATS_POINTS ? (
        <StressStatsRow stats={stats} />
      ) : null}
      {locked ? (
        <>
          <BlurView
            intensity={24}
            tint="light"
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />
          <Text style={[styles.title, styles.clearTitle]}>Stress Index</Text>
          {onPressLocked ? (
            <Pressable
              accessibilityRole="button"
              onPress={onPressLocked}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    ...card.shadow,
    width: '100%',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  lockedCard: {
    overflow: 'hidden',
  },
  title: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  lockedTitleText: {
    opacity: 0,
  },
  ringSurface: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    position: 'relative',
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    shadowColor: colors.neutral[900],
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },
  canvas: {
    ...StyleSheet.absoluteFillObject,
  },
  clearTitle: {
    position: 'absolute',
    top: spacing.md,
    alignSelf: 'center',
    zIndex: 2,
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  value: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -1.5,
    color: colors.text.primary,
  },
  valueMax: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.tertiary,
    letterSpacing: -0.2,
  },
  zonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.xs,
  },
  zoneDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  zoneLabel: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
