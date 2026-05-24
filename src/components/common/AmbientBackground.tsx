import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  Canvas,
  Circle,
  Rect,
  LinearGradient,
  RadialGradient,
  vec,
} from '@shopify/react-native-skia';
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { useDeviceTilt } from '../../hooks/useDeviceTilt';

const TILT_PARALLAX_TOP = 80;
const TILT_PARALLAX_BOTTOM = 140;
const BREATH_DURATION_MS = 7000;
const BREATH_AMPLITUDE = 0.03;

export default function AmbientBackground() {
  const { width, height } = useWindowDimensions();

  const tilt = useDeviceTilt();
  const breath = useSharedValue(0);

  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1, { duration: BREATH_DURATION_MS, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => cancelAnimation(breath);
  }, [breath]);

  const topBaseR = width * 1.1;
  const bottomBaseR = width * 1.0;
  const topBaseCx = width * 0.2;
  const topBaseCy = height * 0.05;
  const bottomBaseCx = width * 0.85;
  const bottomBaseCy = height * 0.2;

  const topCx = useDerivedValue(() => topBaseCx - tilt.x.value * TILT_PARALLAX_TOP);
  const topCy = useDerivedValue(() => topBaseCy - tilt.y.value * TILT_PARALLAX_TOP);
  const bottomCx = useDerivedValue(
    () => bottomBaseCx + tilt.x.value * TILT_PARALLAX_BOTTOM,
  );
  const bottomCy = useDerivedValue(
    () => bottomBaseCy + tilt.y.value * TILT_PARALLAX_BOTTOM,
  );

  const topR = useDerivedValue(() => topBaseR * (1 + breath.value * BREATH_AMPLITUDE));
  const bottomR = useDerivedValue(
    () => bottomBaseR * (1 + (1 - breath.value) * BREATH_AMPLITUDE),
  );

  const topCenter = useDerivedValue(() => vec(topCx.value, topCy.value));
  const bottomCenter = useDerivedValue(() => vec(bottomCx.value, bottomCy.value));

  const topColor = colors.primary.blue200;
  const bottomColor = colors.orange[200];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        <Rect x={0} y={0} width={width} height={height}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, height)}
            colors={[
              colors.background.primary,
              colors.primary.blue100,
              colors.background.primary,
            ]}
            positions={[0, 0.5, 1]}
          />
        </Rect>

        <Circle cx={topCx} cy={topCy} r={topR} opacity={0.5}>
          <RadialGradient
            c={topCenter}
            r={topR}
            colors={[topColor, topColor + '00']}
            positions={[0, 1]}
          />
        </Circle>

        <Circle cx={bottomCx} cy={bottomCy} r={bottomR} opacity={0.35}>
          <RadialGradient
            c={bottomCenter}
            r={bottomR}
            colors={[bottomColor, bottomColor + '00']}
            positions={[0, 1]}
          />
        </Circle>
      </Canvas>
    </View>
  );
}
