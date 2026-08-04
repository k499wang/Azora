import { Text } from '../common/Text';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LockedScrim } from '../common/glass';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';
import CardSurface from '../common/CardSurface';
import FeatureInfoDialog from '../common/FeatureInfoDialog';
import Icon from '../common/icons/Icon';
import type { IconName } from '../common/icons/paths';
import type { PlayfulHue } from '../../features/exercise/guidedBreathing/categoryPalette';

const SIZE = 96;
const STAT_ICON_SIZE = 24;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 39;           // outer tick ring radius
const INNER_R = 22;     // inner white circle radius
const START_ANGLE = 135;
const SWEEP = 270;

const NUM_TICKS = 40;
const TICK_HALF = 5;
const TICK_WIDTH = 3;

// Curved triangle indicator — points outward from inner circle edge
const TRI_TIP_OFFSET = 8;  // how far beyond INNER_R the tip extends
const TRI_HALF_DEG = 7;    // half-width of the base in degrees

const TICK_REACHED_OPACITY = 1;
const TICK_REMAINING_OPACITY = 0.3;

// Static outer tick paths — computed once at module load
const TICKS = Array.from({ length: NUM_TICKS }, (_, i) => {
  const t = i / (NUM_TICKS - 1);
  const angleRad = ((START_ANGLE + t * SWEEP) * Math.PI) / 180;
  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);
  const path = Skia.Path.Make();
  path.moveTo(CX + (R - TICK_HALF) * cosA, CY + (R - TICK_HALF) * sinA);
  path.lineTo(CX + (R + TICK_HALF) * cosA, CY + (R + TICK_HALF) * sinA);
  return { path, t };
});

function getZone(
  value: number,
  lowBound: number,
  highBound: number,
): { label: string; color: string } {
  const color = colors.primary.blue500;
  if (value < lowBound) return { label: 'Low', color };
  if (value < highBound) return { label: 'Moderate', color };
  return { label: 'High', color };
}

interface HRVTrackStatCardProps {
  label: string;
  icon?: IconName;
  iconColor?: string;
  value: number | null;
  avgValue?: number | null;
  bestValue?: number | null;
  avgLabel?: string;
  bestLabel?: string;
  unit: string;
  min?: number;
  max: number;
  lowBound: number;
  highBound: number;
  info?: { title: string; message: string };
  hue?: PlayfulHue;
  locked?: boolean;
  onPressLocked?: () => void;
  lastMeasuredLabel?: string;
}

export default function HRVTrackStatCard({
  label,
  icon,
  iconColor = colors.text.inverse,
  hue = colors.playful.violet,
  value,
  avgValue,
  bestValue,
  avgLabel = 'Avg',
  bestLabel = 'Best',
  unit,
  min = 0,
  max,
  lowBound,
  highBound,
  info,
  locked = false,
  onPressLocked,
  lastMeasuredLabel,
}: HRVTrackStatCardProps) {
  const [infoVisible, setInfoVisible] = useState(false);
  const hasAvg = avgValue != null && Number.isFinite(avgValue);
  const hasBest = bestValue != null && Number.isFinite(bestValue);
  const hasValue = value != null && Number.isFinite(value);
  const multiStat = hasAvg || hasBest;
  const clamped = hasValue ? Math.max(min, Math.min(max, value!)) : null;
  const progress = clamped != null ? (clamped - min) / (max - min) : null;
  const zone = clamped != null ? getZone(clamped, lowBound, highBound) : null;

  // Curved triangle: tip points outward, curved base follows inner circle arc
  const indPath = (() => {
    if (progress == null) return null;
    const angleDeg = START_ANGLE + progress * SWEEP;
    const angleRad = (angleDeg * Math.PI) / 180;

    // Tip: beyond the inner circle
    const tipX = CX + (INNER_R + TRI_TIP_OFFSET) * Math.cos(angleRad);
    const tipY = CY + (INNER_R + TRI_TIP_OFFSET) * Math.sin(angleRad);

    // Base right corner on inner circle circumference
    const rightRad = ((angleDeg + TRI_HALF_DEG) * Math.PI) / 180;
    const rightX = CX + INNER_R * Math.cos(rightRad);
    const rightY = CY + INNER_R * Math.sin(rightRad);

    const innerOval = Skia.XYWHRect(CX - INNER_R, CY - INNER_R, INNER_R * 2, INNER_R * 2);

    const path = Skia.Path.Make();
    path.moveTo(tipX, tipY);
    path.lineTo(rightX, rightY);
    // Arc counterclockwise along inner circle from right to left base corner
    path.arcToOval(innerOval, angleDeg + TRI_HALF_DEG, -2 * TRI_HALF_DEG, false);
    path.close();
    return path;
  })();

  return (
    <CardSurface locked={locked} style={styles.card} hue={hue}>
      {info && !locked ? (
        <>
          <Pressable
            hitSlop={12}
            onPress={() => setInfoVisible(true)}
            style={styles.infoButton}
          >
            <MaterialCommunityIcons
              name="information-outline"
              size={16}
              color={colors.onBlock.textMuted}
            />
          </Pressable>
          <FeatureInfoDialog
            visible={infoVisible}
            onClose={() => setInfoVisible(false)}
            title={info.title}
            intro={info.message}
          />
        </>
      ) : null}

      <View style={styles.cardContent}>
        <View style={styles.left}>
          <View style={[styles.headerRow, locked && styles.lockedHeaderRow]}>
            {icon ? (
              <Icon name={icon} size={STAT_ICON_SIZE} color={iconColor} />
            ) : null}
            <Text style={styles.label}>{label}</Text>
            {zone != null ? (
              <View style={styles.zonePill}>
                <Text style={styles.zonePillText}>{zone.label}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.statsColumn}>
            <View style={[styles.statsRow, multiStat && styles.statsRowCompact]}>
              <View style={styles.statCell}>
                <View style={styles.statValueRow}>
                  <Text style={[styles.statValue, !multiStat && styles.statValueLarge]}>
                    {hasValue ? Math.round(value!) : '--'}
                  </Text>
                  <Text style={[styles.statUnit, !multiStat && styles.statUnitLarge]}>{unit}</Text>
                </View>
                <Text style={[styles.statLabel, !multiStat && styles.statLabelLarge, styles.currentStatLabel]}>
                  {lastMeasuredLabel ?? 'Today'}
                </Text>
              </View>

              {hasAvg ? (
                <>
                  <View style={styles.statDivider} />
                  <View style={styles.statCell}>
                    <View style={styles.statValueRow}>
                      <Text style={styles.statValue}>{Math.round(avgValue!)}</Text>
                      <Text style={styles.statUnit}>{unit}</Text>
                    </View>
                    <Text style={styles.statLabel}>{avgLabel}</Text>
                  </View>
                </>
              ) : null}

              {hasBest ? (
                <>
                  <View style={styles.statDivider} />
                  <View style={styles.statCell}>
                    <View style={styles.statValueRow}>
                      <Text style={styles.statValue}>{Math.round(bestValue!)}</Text>
                      <Text style={styles.statUnit}>{unit}</Text>
                    </View>
                    <Text style={styles.statLabel}>{bestLabel}</Text>
                  </View>
                </>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.gaugeColumn}>
          <View style={styles.ringSurface}>
            <Canvas style={StyleSheet.absoluteFill}>
              {TICKS.map((tick, i) => (
                <Path
                  key={i}
                  path={tick.path}
                  style="stroke"
                  strokeWidth={TICK_WIDTH}
                  strokeCap="round"
                  color={colors.text.inverse}
                  opacity={
                    progress != null && tick.t <= progress
                      ? TICK_REACHED_OPACITY
                      : TICK_REMAINING_OPACITY
                  }
                />
              ))}

              <Circle cx={CX} cy={CY} r={INNER_R} color={hue.base} />

              {indPath != null ? (
                <Path
                  path={indPath}
                  style="fill"
                  color={colors.text.inverse}
                />
              ) : null}
            </Canvas>
          </View>
        </View>
      </View>
      {locked ? (
        <>
          <LockedScrim />
          <View style={styles.clearHeaderOverlay} pointerEvents="none">
            {icon ? (
              <Icon name={icon} size={STAT_ICON_SIZE} color={iconColor} />
            ) : null}
            <Text style={styles.label}>{label}</Text>
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
    </CardSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    position: 'relative',
  },
  infoButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  left: {
    flex: 1,
    minHeight: SIZE,
  },
  label: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.text.inverse,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginLeft: -spacing.xs,
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
    marginLeft: -spacing.xs,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: SIZE,
    borderRadius: 18,
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
  statsRowCompact: {
    gap: spacing.sm + 2,
    marginTop: 2,
    paddingRight: spacing.sm,
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
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.onBlock.divider,
  },
  statLabel: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: colors.onBlock.textMuted,
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
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
    fontSize: 19,
  },
  statUnit: {
    ...typography.label.small,
    fontSize: 12,
    color: colors.onBlock.textMuted,
    fontFamily: fonts.semibold,
  },
  statLabelLarge: {
    fontSize: 11,
  },
  statValueLarge: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  statUnitLarge: {
    fontSize: 14,
  },
  zonePill: {
    backgroundColor: colors.onBlock.fill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 20,
  },
  zonePillText: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.text.inverse,
  },
  ringSurface: {
    ...card.well,
    backgroundColor: colors.onBlock.fill,
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    flexShrink: 0,
  },
});
