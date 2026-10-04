import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
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
import { useWhileVisible } from '../../hooks/useWhileVisible';

const EXHALING_KOALA = require('../../../assets/Poses/koala_pose_exhaling.webp');
const KOALA_ASPECT: Record<RewardPose, number> = {
  celebrating: 1200 / 1080,
  exhaling: 1,
};
const GLOW_SCALE = 1.7;
const GLOW_CORE_SHARE = 0.6;
const RAY_COUNT = 12;
/** rays and gaps of equal width */
const RAY_HALF_ANGLE = Math.PI / RAY_COUNT / 2;
/** one ray's turn, after which the pattern looks the same again */
const RAY_TURN_DEG = 360 / RAY_COUNT;
const RAY_TURN_MS = 3_000;
const CORE_PULSE_MS = 1_600;
const CORE_PULSE_SCALE = 0.08;

export type RewardPose = 'celebrating' | 'exhaling';

interface Props {
  width: number;
  pose?: RewardPose;
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

/** Azo, with soft light opening up behind him and turning slowly. */
export default function ActivityRewardHero({
  width,
  pose = 'celebrating',
  delay,
  reducedMotion,
}: Props) {
  const height = width * KOALA_ASPECT[pose];
  const glowSize = width * GLOW_SCALE;
  const radius = glowSize / 2;
  const center = vec(radius, radius);
  const rays = useMemo(() => raysPath(radius), [radius]);
  const glow = useSharedValue(reducedMotion ? 1 : 0);
  const spin = useSharedValue(0);
  const pulse = useSharedValue(0);

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

  useWhileVisible(() => {
    if (reducedMotion) return () => {};
    spin.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: RAY_TURN_MS, easing: Easing.linear }), -1),
    );
    pulse.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: CORE_PULSE_MS, easing: easing.breathe }), -1, true),
    );
    return () => {
      cancelAnimation(spin);
      cancelAnimation(pulse);
      spin.value = 0;
      pulse.value = 0;
    };
  }, [delay, pulse, reducedMotion, spin]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.8 + 0.2 * glow.value }],
  }));
  const raysStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * RAY_TURN_DEG}deg` }],
  }));
  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + CORE_PULSE_SCALE * pulse.value }],
  }));

  const koala =
    pose === 'exhaling' ? (
      <Image source={EXHALING_KOALA} style={{ width, height }} contentFit="contain" />
    ) : (
      <CelebratingKoala width={width} height={height} />
    );

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
        <Animated.View style={[StyleSheet.absoluteFill, raysStyle]}>
          <Canvas style={styles.canvas}>
            <Path path={rays}>
              <RadialGradient
                c={center}
                r={radius}
                colors={[colors.celebrationGlow.ray, colors.celebrationGlow.edge]}
              />
            </Path>
          </Canvas>
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, coreStyle]}>
          <Canvas style={styles.canvas}>
            <Circle cx={radius} cy={radius} r={radius * GLOW_CORE_SHARE}>
              <RadialGradient
                c={center}
                r={radius * GLOW_CORE_SHARE}
                colors={[colors.celebrationGlow.core, colors.celebrationGlow.edge]}
              />
            </Circle>
          </Canvas>
        </Animated.View>
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
