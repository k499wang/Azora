import { StyleSheet, Text, View } from 'react-native';
import {
  Canvas,
  Circle,
  LinearGradient,
  Path,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';

interface StressGaugeProps {
  value: number;
  zone: { label: string; color: string };
}

const SIZE = 220;
const STROKE = 16;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = SIZE / 2 - STROKE / 2 - 4;
const CANVAS_HEIGHT = SIZE / 2 + STROKE + 8;

export default function StressGauge({ value, zone }: StressGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));

  const track = Skia.Path.Make();
  const rect = Skia.XYWHRect(CX - R, CY - R, R * 2, R * 2);
  track.addArc(rect, 180, 180);

  const angleDeg = 180 + (clamped / 100) * 180;
  const angleRad = (angleDeg * Math.PI) / 180;
  const needleX = CX + R * Math.cos(angleRad);
  const needleY = CY + R * Math.sin(angleRad);

  return (
    <View style={styles.card}>
      <View style={styles.canvasWrap}>
        <Canvas style={styles.canvas}>
          <Path
            path={track}
            style="stroke"
            strokeWidth={STROKE}
            strokeCap="round"
            color={colors.neutral[100]}
          />
          <Path path={track} style="stroke" strokeWidth={STROKE} strokeCap="round">
            <LinearGradient
              start={vec(CX - R, CY)}
              end={vec(CX + R, CY)}
              colors={[
                colors.success[500],
                colors.warning[500],
                colors.error[500],
              ]}
              positions={[0, 0.5, 1]}
            />
          </Path>
          <Circle
            cx={needleX}
            cy={needleY}
            r={STROKE / 2 + 5}
            color={colors.background.elevated}
          />
          <Circle cx={needleX} cy={needleY} r={STROKE / 2} color={zone.color} />
        </Canvas>

        <View style={styles.centerOverlay} pointerEvents="none">
          <View style={styles.valueRow}>
            <Text style={styles.value}>{clamped}</Text>
            <Text style={styles.valueMax}>/100</Text>
          </View>
          <Text style={[styles.zone, { color: zone.color }]}>
            {zone.label.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.endpointRow}>
        <Text style={styles.endpoint}>0</Text>
        <Text style={styles.caption}>Stress</Text>
        <Text style={styles.endpoint}>100</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    ...card.shadow,
    width: '100%',
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  canvasWrap: {
    width: SIZE,
    height: CANVAS_HEIGHT,
    position: 'relative',
  },
  canvas: {
    ...StyleSheet.absoluteFillObject,
  },
  centerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: SIZE / 2 - 56,
    alignItems: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  value: {
    ...typography.display.display1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 48,
    lineHeight: 52,
    color: colors.text.primary,
  },
  valueMax: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
  zone: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 2,
  },
  endpointRow: {
    width: SIZE,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  endpoint: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    fontFamily: fonts.semibold,
  },
  caption: {
    ...typography.label.medium,
    color: colors.text.secondary,
    fontFamily: fonts.semibold,
  },
});
