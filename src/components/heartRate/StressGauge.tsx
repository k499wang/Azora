import { Text } from '../common/Text';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  Canvas,
  Circle,
  Path,
  Skia,
} from '@shopify/react-native-skia';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import LockedScrim from '../common/LockedScrim';
import CardSurface from '../common/CardSurface';
import Icon from '../common/icons/Icon';
import type { CardSurfaceMode } from '../common/cardSurfaceConfig';

interface StressGaugeProps {
  value: number | null;
  zone: { label: string; color: string } | null;
  locked?: boolean;
  onPressLocked?: () => void;
  surface?: CardSurfaceMode;
  lastMeasuredLabel?: string;
}

const SIZE = 96;
const STROKE = 8;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = SIZE / 2 - STROKE / 2 - 5;
const START_ANGLE = 135;
const SWEEP = 270;
const TICK_INNER = R - STROKE / 2 - 4;
const TICK_OUTER = R - STROKE / 2 - 1;
const INNER_R = R - STROKE / 2 - 9;

function tickPath(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const p = Skia.Path.Make();
  p.moveTo(CX + TICK_INNER * cos, CY + TICK_INNER * sin);
  p.lineTo(CX + TICK_OUTER * cos, CY + TICK_OUTER * sin);
  return p;
}

const TICKS = [0, 25, 50, 75, 100].map((t) =>
  tickPath(START_ANGLE + (t / 100) * SWEEP),
);

function formatValue(value: number | null): string {
  return value == null || !Number.isFinite(value) ? '--' : `${Math.round(value)}`;
}

export default function StressGauge({
  value,
  zone,
  locked = false,
  onPressLocked,
  surface,
  lastMeasuredLabel,
}: StressGaugeProps) {
  const hasValue = value != null && Number.isFinite(value);
  const clamped = hasValue ? Math.max(0, Math.min(100, value!)) : null;
  const sweep = clamped != null ? (clamped / 100) * SWEEP : null;

  const rect = Skia.XYWHRect(CX - R, CY - R, R * 2, R * 2);

  const track = Skia.Path.Make();
  track.addArc(rect, START_ANGLE, SWEEP);

  const progress = Skia.Path.Make();
  if (sweep != null) {
    progress.addArc(rect, START_ANGLE, sweep);
  }

  const header = (
    <>
      <Icon name="stat-stress-battery" size={28} color={colors.success[500]} />
      <Text style={styles.label}>Stress Index</Text>
      {zone != null ? (
        <View style={[styles.zonePill, { backgroundColor: `${zone.color}18` }]}>
          <Text style={[styles.zonePillText, { color: zone.color }]}>
            {zone.label}
          </Text>
        </View>
      ) : null}
    </>
  );

  const content = (
    <>
      <View style={styles.cardContent}>
        <View style={styles.left}>
          <View style={[styles.headerRow, locked && styles.lockedHeaderRow]}>
            {header}
          </View>

          <View style={styles.statsColumn}>
            <View style={styles.statsRow}>
              <View style={styles.statCell}>
                <View style={styles.statValueRow}>
                  <Text style={[styles.statValue, styles.statValueLarge]}>
                    {formatValue(clamped)}
                  </Text>
                  <Text style={[styles.statUnit, styles.statUnitLarge]}>/100</Text>
                </View>
                <Text style={[styles.statLabel, styles.statLabelLarge, styles.currentStatLabel]}>
                  {lastMeasuredLabel ?? 'Today'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.gaugeColumn}>
          <View style={styles.ringSurface}>
            <Canvas style={StyleSheet.absoluteFill}>
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
                  color={zone.color}
                />
              ) : null}
              {TICKS.map((p, i) => (
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
          </View>
        </View>
      </View>

      {locked ? (
        <>
          <LockedScrim />
          <View style={styles.clearHeaderOverlay} pointerEvents="none">
            <Icon name="stat-stress-battery" size={28} color={colors.success[500]} />
            <Text style={styles.label}>Stress Index</Text>
          </View>
          {onPressLocked ? (
            <Pressable
              accessibilityRole="button"
              onPress={onPressLocked}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
        </>
      ) : null}
    </>
  );

  return (
    <CardSurface locked={locked} style={styles.card} surface={surface}>
      {content}
    </CardSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    position: 'relative',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: SIZE,
    borderRadius: 18,
  },
  left: {
    flex: 1,
    minHeight: SIZE,
  },
  label: {
    ...typography.heading.heading2,
    fontFamily: fonts.regular,
    fontWeight: '400',
    fontSize: 17,
    color: colors.text.primary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginBottom: spacing.sm,
  },
  lockedHeaderRow: {
    opacity: 0,
  },
  clearHeaderOverlay: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  statsColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    gap: spacing.md,
    paddingRight: spacing.md,
  },
  gaugeColumn: {
    width: SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  statCell: {
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  statLabel: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: colors.text.tertiary,
    letterSpacing: 0,
  },
  currentStatLabel: {
    fontFamily: fonts.regular,
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 16,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  statValue: {
    ...typography.title.title3,
    fontFamily: fonts.medium,
    fontWeight: '500',
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
    fontSize: 19,
  },
  statUnit: {
    ...typography.label.small,
    fontSize: 12,
    color: colors.text.tertiary,
    fontFamily: fonts.regular,
    fontWeight: '400',
  },
  statLabelLarge: {
    fontSize: 11,
  },
  statValueLarge: {
    ...typography.title.title1,
    fontFamily: fonts.medium,
    fontWeight: '500',
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  statUnitLarge: {
    fontSize: 14,
  },
  zonePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 20,
  },
  zonePillText: {
    ...typography.label.small,
    fontFamily: fonts.medium,
    fontWeight: '500',
    fontSize: 11,
  },
  ringSurface: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    flexShrink: 0,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    shadowColor: colors.neutral[900],
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },
});
