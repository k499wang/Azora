import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { colors } from '../../theme/colors';

/**
 * An open-bottomed arc, a little past halfway round, with a knob at the end of
 * what has been filled.
 *
 * Open at the bottom rather than a closed ring. A ring has no beginning, so it
 * reads as a proportion of a whole — right for "how much of the plan" and
 * wrong for a score that runs along a scale. The gap gives the arc a start and
 * an end, and the knob says where on it you are.
 *
 * 220 degrees from 160, which stops both ends level with the bottom of the
 * number instead of curving under it. A deeper arc comes close enough to
 * closing that the eye reads a ring with a notch missing, and a single value on
 * a dial should not read as a proportion of anything.
 *
 * `StressGauge` keeps the deeper 270 from 135 it has always drawn. That is a
 * choice rather than drift: it is a 96pt ring sitting beside its own scale,
 * where this one is the only graphic on the screen at 240pt.
 */

const START_ANGLE = 160;
const SWEEP = 220;
/** Room for the knob, which is wider than the stroke it sits on. */
const KNOB_OVERHANG = 3;

interface Props {
  /** 0 to 1. Clamped, so a bad number cannot draw outside the arc. */
  fill: number;
  size: number;
  stroke: number;
  /** Defaults to the brand blue. */
  color?: string;
  trackColor?: string;
  /** Sits in the middle of the arc. */
  children?: ReactNode;
}

export default function ArcGauge({
  fill,
  size,
  stroke,
  color = colors.primary.blue500,
  trackColor = colors.primary.blue100,
  children,
}: Props) {
  const safeFill = Math.max(0, Math.min(1, Number.isFinite(fill) ? fill : 0));
  const center = size / 2;
  const radius = center - stroke / 2 - KNOB_OVERHANG;
  const rect = Skia.XYWHRect(
    center - radius,
    center - radius,
    radius * 2,
    radius * 2,
  );

  const track = Skia.Path.Make();
  track.addArc(rect, START_ANGLE, SWEEP);

  const progress = Skia.Path.Make();
  progress.addArc(rect, START_ANGLE, SWEEP * safeFill);

  // Where the filled arc ends, which is where the knob goes.
  const knobAngle = ((START_ANGLE + SWEEP * safeFill) * Math.PI) / 180;
  const knobRadius = stroke / 2 + KNOB_OVERHANG;

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Path
          path={track}
          style="stroke"
          strokeWidth={stroke}
          strokeCap="round"
          color={trackColor}
        />
        {safeFill > 0 ? (
          <Path
            path={progress}
            style="stroke"
            strokeWidth={stroke}
            strokeCap="round"
            color={color}
          />
        ) : null}
        {/* Sits on the track at zero, so an empty gauge still shows where the
            scale begins rather than looking unfinished. */}
        <Circle
          cx={center + radius * Math.cos(knobAngle)}
          cy={center + radius * Math.sin(knobAngle)}
          r={knobRadius}
          color={safeFill > 0 ? color : trackColor}
        />
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
