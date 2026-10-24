import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { BlurMask, Canvas, Group, RoundedRect, SweepGradient, vec } from '@shopify/react-native-skia';
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { duration, easing } from '../../theme/motion';

interface Props {
  /** Azo is thinking or listening */
  active: boolean;
  radius: number;
  children: ReactNode;
}

/** The halo's stroke and blur; the canvas reaches three blurs past the edge so the light fades to nothing before it ends. */
const HALO_STROKE = 4;
const HALO_BLUR = 14;
const GLOW_SPREAD = HALO_STROKE + HALO_BLUR * 3;
/** A hint of light, not a neon sign. */
const GLOW_PEAK = 0.45;
const TURN_MS = 3200;
const GLOW_COLORS = [
  colors.playful.sky.base,
  colors.playful.violet.base,
  colors.playful.sky.mid,
  colors.playful.violet.mid,
  colors.playful.sky.base,
];

/**
 * Apple Intelligence-style edge light: while Azo is thinking or listening, a
 * slowly turning blue-violet glow runs around whatever it wraps. Quiet at rest.
 */
export default function AzoGlow({ active, radius, children }: Props) {
  const reducedMotion = useReducedMotion();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const spin = useSharedValue(0);
  const shown = useSharedValue(0);

  useEffect(() => {
    if (active) {
      shown.value = withTiming(GLOW_PEAK, { duration: duration.slow, easing: easing.enter });
      if (!reducedMotion) {
        spin.value = 0;
        spin.value = withRepeat(withTiming(1, { duration: TURN_MS, easing: Easing.linear }), -1);
      }
      return;
    }
    shown.value = withTiming(0, { duration: duration.slow, easing: easing.exit }, (finished) => {
      if (finished) cancelAnimation(spin);
    });
  }, [active, reducedMotion, shown, spin]);

  const turn = useDerivedValue(() => [{ rotate: spin.value * Math.PI * 2 }]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((current) => current.width === width && current.height === height ? current : { width, height });
  };

  const center = vec(size.width / 2 + GLOW_SPREAD, size.height / 2 + GLOW_SPREAD);
  const canvasStyle = {
    width: size.width + GLOW_SPREAD * 2,
    height: size.height + GLOW_SPREAD * 2,
  };
  const ring = (strokeWidth: number, blur: number | null) => (
    <RoundedRect
      x={GLOW_SPREAD}
      y={GLOW_SPREAD}
      width={size.width}
      height={size.height}
      r={radius}
      style="stroke"
      strokeWidth={strokeWidth}
    >
      <SweepGradient c={center} colors={GLOW_COLORS} origin={center} transform={turn} />
      {blur != null ? <BlurMask blur={blur} style="normal" /> : null}
    </RoundedRect>
  );

  return (
    <View onLayout={onLayout}>
      {size.width > 0 ? (
        <Canvas pointerEvents="none" style={[styles.canvas, canvasStyle]}>
          <Group opacity={shown}>{ring(HALO_STROKE, HALO_BLUR)}</Group>
        </Canvas>
      ) : null}
      {children}
      {size.width > 0 ? (
        <Canvas pointerEvents="none" style={[styles.canvas, canvasStyle]}>
          <Group opacity={shown}>{ring(1, null)}</Group>
        </Canvas>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: { position: 'absolute', top: -GLOW_SPREAD, left: -GLOW_SPREAD },
});
