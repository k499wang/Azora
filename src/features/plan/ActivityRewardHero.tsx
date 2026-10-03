import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import {
  Canvas,
  Circle,
  Path,
  RadialGradient,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import CelebratingKoala from '../../../assets/Poses/koala_pose_celebrating.svg';
import { Pop } from '../../components/common/Reveal';
import { colors } from '../../theme/colors';
import { duration, easing } from '../../theme/motion';

const KOALA_ASPECT = 1200 / 1080;
const GLOW_SCALE = 1.7;
const GLOW_CORE_SHARE = 0.6;
const RAY_COUNT = 12;
/** rays and gaps of equal width */
const RAY_HALF_ANGLE = Math.PI / RAY_COUNT / 2;

interface Props {
  width: number;
  delay: number;
  reducedMotion: boolean;
}

function raysPath(radius: number) {
  const path = Skia.Path.Make();
  for (let ray = 0; ray < RAY_COUNT; ray += 1) {
    const angle = (ray * 2 * Math.PI) / RAY_COUNT;
    path.moveTo(radius, radius);
    path.lineTo(
      radius + Math.cos(angle - RAY_HALF_ANGLE) * radius,
      radius + Math.sin(angle - RAY_HALF_ANGLE) * radius,
    );
    path.lineTo(
      radius + Math.cos(angle + RAY_HALF_ANGLE) * radius,
      radius + Math.sin(angle + RAY_HALF_ANGLE) * radius,
    );
    path.close();
  }
  return path;
}

/** Azo celebrating, with soft light opening up behind him. */
export default function ActivityRewardHero({ width, delay, reducedMotion }: Props) {
  const height = width * KOALA_ASPECT;
  const glowSize = width * GLOW_SCALE;
  const radius = glowSize / 2;
  const center = vec(radius, radius);
  const rays = useMemo(() => raysPath(radius), [radius]);
  const glow = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      glow.value = 1;
      return;
    }
    glow.value = withDelay(
      delay,
      withTiming(1, { duration: duration.slower, easing: easing.enter }),
    );
    return () => cancelAnimation(glow);
  }, [delay, glow, reducedMotion]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.8 + 0.2 * glow.value }],
  }));

  const koala = <CelebratingKoala width={width} height={height} />;

  return (
    <View style={{ width, height }}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            width: glowSize,
            height: glowSize,
            left: (width - glowSize) / 2,
            top: (height - glowSize) / 2,
          },
          glowStyle,
        ]}
      >
        <Canvas style={styles.canvas}>
          <Path path={rays}>
            <RadialGradient
              c={center}
              r={radius}
              colors={[colors.celebrationGlow.ray, colors.celebrationGlow.edge]}
            />
          </Path>
          <Circle cx={radius} cy={radius} r={radius * GLOW_CORE_SHARE}>
            <RadialGradient
              c={center}
              r={radius * GLOW_CORE_SHARE}
              colors={[colors.celebrationGlow.core, colors.celebrationGlow.edge]}
            />
          </Circle>
        </Canvas>
      </Animated.View>
      {reducedMotion ? koala : <Pop delay={delay}>{koala}</Pop>}
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
  },
  canvas: {
    flex: 1,
  },
});
