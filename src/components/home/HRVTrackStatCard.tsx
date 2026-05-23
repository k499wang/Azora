import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';

const SIZE = 96;
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

const PASTEL_STOPS = ['#FCA5A5', '#FDE68A', '#86EFAC'];

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function lerpColor(t: number, stops: string[]): string {
  const n = stops.length - 1;
  const scaled = t * n;
  const i = Math.min(Math.floor(scaled), n - 1);
  const f = scaled - i;
  const [r1, g1, b1] = hexToRgb(stops[i]);
  const [r2, g2, b2] = hexToRgb(stops[i + 1]);
  return `rgb(${Math.round(r1 + (r2 - r1) * f)},${Math.round(g1 + (g2 - g1) * f)},${Math.round(b1 + (b2 - b1) * f)})`;
}

// Static outer tick paths — computed once at module load
const TICKS = Array.from({ length: NUM_TICKS }, (_, i) => {
  const t = i / (NUM_TICKS - 1);
  const angleRad = ((START_ANGLE + t * SWEEP) * Math.PI) / 180;
  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);
  const path = Skia.Path.Make();
  path.moveTo(CX + (R - TICK_HALF) * cosA, CY + (R - TICK_HALF) * sinA);
  path.lineTo(CX + (R + TICK_HALF) * cosA, CY + (R + TICK_HALF) * sinA);
  return { path, color: lerpColor(t, PASTEL_STOPS) };
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
  value: number | null;
  avgValue?: number | null;
  bestValue?: number | null;
  unit: string;
  min?: number;
  max: number;
  lowBound: number;
  highBound: number;
  info?: { title: string; message: string };
  locked?: boolean;
  onPressLocked?: () => void;
}

export default function HRVTrackStatCard({
  label,
  value,
  avgValue,
  bestValue,
  unit,
  min = 0,
  max,
  lowBound,
  highBound,
  info,
  locked = false,
  onPressLocked,
}: HRVTrackStatCardProps) {
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
    <View style={[styles.card, locked && styles.lockedCard]}>
      {info && !locked ? (
        <Pressable
          hitSlop={12}
          onPress={() => Alert.alert(info.title, info.message)}
          style={styles.infoButton}
        >
          <MaterialCommunityIcons
            name="information-outline"
            size={16}
            color={colors.text.tertiary}
          />
        </Pressable>
      ) : null}

      <View style={styles.left}>
        <View style={[styles.headerRow, locked && styles.lockedHeaderRow]}>
          <Text style={styles.label}>{label}</Text>
          {zone != null ? (
            <View
              style={[styles.zonePill, { backgroundColor: `${zone.color}18` }]}
            >
              <Text style={[styles.zonePillText, { color: zone.color }]}>
                {zone.label}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardBody}>
          <View style={[styles.statsRow, multiStat && styles.statsRowCompact]}>
            <View style={styles.statCell}>
              <Text style={[styles.statLabel, !multiStat && styles.statLabelLarge]}>Today</Text>
              <View style={styles.statValueRow}>
                <Text style={[styles.statValue, !multiStat && styles.statValueLarge]}>
                  {hasValue ? Math.round(value!) : '--'}
                </Text>
                <Text style={[styles.statUnit, !multiStat && styles.statUnitLarge]}>{unit}</Text>
              </View>
            </View>

            {hasAvg ? (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>Avg</Text>
                  <View style={styles.statValueRow}>
                    <Text style={styles.statValue}>{Math.round(avgValue!)}</Text>
                    <Text style={styles.statUnit}>{unit}</Text>
                  </View>
                </View>
              </>
            ) : null}

            {hasBest ? (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>Best</Text>
                  <View style={styles.statValueRow}>
                    <Text style={styles.statValue}>{Math.round(bestValue!)}</Text>
                    <Text style={styles.statUnit}>{unit}</Text>
                  </View>
                </View>
              </>
            ) : null}
          </View>

          <View style={styles.ringSurface}>
            <Canvas style={StyleSheet.absoluteFill}>
              {TICKS.map((tick, i) => (
                <Path
                  key={i}
                  path={tick.path}
                  style="stroke"
                  strokeWidth={TICK_WIDTH}
                  strokeCap="round"
                  color={tick.color}
                  opacity={0.85}
                />
              ))}

              <Circle cx={CX} cy={CY + 3} r={INNER_R + 3} color="rgba(15,23,42,0.04)" />
              <Circle cx={CX} cy={CY + 1.5} r={INNER_R + 1.5} color="rgba(15,23,42,0.02)" />
              <Circle cx={CX} cy={CY} r={INNER_R + 1} color={colors.neutral[200]} />
              <Circle cx={CX} cy={CY} r={INNER_R} color={colors.background.elevated} />

              {indPath != null ? (
                <Path
                  path={indPath}
                  style="fill"
                  color={colors.primary.blue500}
                />
              ) : null}
            </Canvas>
          </View>
        </View>
      </View>
      {locked ? (
        <>
          <BlurView
            intensity={24}
            tint="light"
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.clearHeaderOverlay} pointerEvents="none">
            <Text style={styles.label}>{label}</Text>
            {zone != null ? (
              <View
                style={[styles.zonePill, { backgroundColor: `${zone.color}18` }]}
              >
                <Text style={[styles.zonePillText, { color: zone.color }]}>
                  {zone.label}
                </Text>
              </View>
            ) : null}
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    ...card.shadow,
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    position: 'relative',
  },
  lockedCard: {
    overflow: 'hidden',
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
    width: '100%',
  },
  label: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
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
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderRadius: 18,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    gap: spacing.md,
    marginTop: 4,
    paddingRight: spacing.md,
  },
  statsRowCompact: {
    gap: spacing.sm + 2,
    marginTop: 8,
    paddingRight: spacing.sm,
  },
  statCell: {
    alignItems: 'flex-start',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.neutral[200],
  },
  statLabel: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.text.tertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
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
    fontFamily: fonts.semibold,
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
    fontFamily: fonts.semibold,
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
