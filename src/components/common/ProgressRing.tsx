import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import { colors } from '../../theme/colors';

/** Twelve o'clock, so the ring fills clockwise from the top. */
const START_ANGLE = -90;

interface Props {
  /** 0 to 1. Clamped, so a bad number cannot draw past the ring. */
  fill: number;
  size: number;
  stroke: number;
  /** Defaults to the brand blue. */
  color?: string;
  trackColor?: string;
  dimensional?: boolean;
  /** Sits in the middle of the ring. */
  children?: ReactNode;
}

export default function ProgressRing({
  fill,
  size,
  stroke,
  color = colors.primary.blue500,
  trackColor = colors.primary.blue100,
  dimensional = false,
  children,
}: Props) {
  const safeFill = Math.max(0, Math.min(1, Number.isFinite(fill) ? fill : 0));
  const depth = dimensional ? stroke * 0.35 : 0;
  const center = (size - depth) / 2;
  const radius = center - stroke / 2;
  const rect = Skia.XYWHRect(center - radius, center - radius, radius * 2, radius * 2);

  const track = Skia.Path.Make();
  track.addCircle(center, center, radius);

  const progress = Skia.Path.Make();
  progress.addArc(rect, START_ANGLE, 360 * safeFill);

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={StyleSheet.absoluteFill}>
        {dimensional ? (
          <Group transform={[{ translateX: depth }, { translateY: depth }]}>
            <Path path={track} style="stroke" strokeWidth={stroke} color={trackColor} />
            {safeFill > 0 ? (
              <Path path={progress} style="stroke" strokeWidth={stroke} strokeCap="round" color={color} />
            ) : null}
            <Path path={track} style="stroke" strokeWidth={stroke} color="#000" opacity={0.18} />
          </Group>
        ) : null}
        <Path path={track} style="stroke" strokeWidth={stroke} color={trackColor} />
        {safeFill > 0 ? (
          <Path
            path={progress}
            style="stroke"
            strokeWidth={stroke}
            strokeCap="round"
            color={color}
          />
        ) : null}
        {dimensional ? (
          <Group transform={[{ translateX: -stroke * 0.15 }, { translateY: -stroke * 0.15 }]}>
            <Path path={track} style="stroke" strokeWidth={stroke * 0.25} color="#FFF" opacity={0.5} />
          </Group>
        ) : null}
      </Canvas>
      <View style={styles.center} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
