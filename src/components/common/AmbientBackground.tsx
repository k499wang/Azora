import { StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  Canvas,
  Circle,
  Rect,
  LinearGradient,
  RadialGradient,
  vec,
} from '@shopify/react-native-skia';
import { colors } from '../../theme/colors';

export default function AmbientBackground() {
  const { width, height } = useWindowDimensions();

  const topOrb = {
    cx: width * 0.2,
    cy: height * 0.05,
    r: width * 1.1,
    color: colors.primary.blue200,
    opacity: 0.5,
  };

  const bottomOrb = {
    cx: width * 0.85,
    cy: height * 0.2,
    r: width * 1.0,
    color: colors.orange[200],
    opacity: 0.35,
  };

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

        <Circle cx={topOrb.cx} cy={topOrb.cy} r={topOrb.r} opacity={topOrb.opacity}>
          <RadialGradient
            c={vec(topOrb.cx, topOrb.cy)}
            r={topOrb.r}
            colors={[topOrb.color, topOrb.color + '00']}
            positions={[0, 1]}
          />
        </Circle>

        <Circle
          cx={bottomOrb.cx}
          cy={bottomOrb.cy}
          r={bottomOrb.r}
          opacity={bottomOrb.opacity}
        >
          <RadialGradient
            c={vec(bottomOrb.cx, bottomOrb.cy)}
            r={bottomOrb.r}
            colors={[bottomOrb.color, bottomOrb.color + '00']}
            positions={[0, 1]}
          />
        </Circle>
      </Canvas>
    </View>
  );
}
