import { useMemo, useState } from 'react';
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
import CalmKoala from '../../../assets/Poses/koala_pose_calm.svg';
import { Pop } from '../../components/common/Reveal';
import { LoopingTwinkle } from '../../components/common/RewardSparkles';
import { colors } from '../../theme/colors';
import { duration, easing, stagger } from '../../theme/motion';
import { useWhileVisible } from '../../hooks/useWhileVisible';
import { useAnimatedImagePlayback } from '../../hooks/useAnimatedImagePlayback';
import { ANIMATED_KOALA } from './rewardAnimations';

const ANIMATED_ASPECT = 578 / 600;
const KOALA_ASPECT: Record<RewardPose, number> = {
  celebrating: 1200 / 1080,
  calm: 1200 / 1080,
  proud: ANIMATED_ASPECT,
  excited: ANIMATED_ASPECT,
};
const GLOW_SCALE = 1.7;
const GLOW_CORE_SHARE = 0.6;
const RAY_COUNT = 12;
/** rays and gaps of equal width */
const RAY_HALF_ANGLE = Math.PI / RAY_COUNT / 2;
/** one ray's turn, after which the pattern looks the same again */
const RAY_TURN_DEG = 360 / RAY_COUNT;
const RAY_TURN_MS = 3_000;
/** one slow in-or-out of the whole glow, about the length of a calm breath */
const BREATH_MS = 3_200;
const BREATH_SCALE = 0.06;

/** around him; fractions of his box */
const TWINKLES = [
  { x: -0.06, y: 0.18, size: 0.08, color: colors.reward.gold, period: 1_500 },
  { x: 0.78, y: -0.04, size: 0.055, color: colors.playful.sky.mid, period: 1_900 },
  { x: 1.05, y: 0.48, size: 0.07, color: colors.reward.gold, period: 1_700 },
  { x: -0.02, y: 0.74, size: 0.055, color: colors.playful.sky.mid, period: 2_100 },
  { x: 0.98, y: 0.86, size: 0.065, color: colors.reward.gold, period: 1_600 },
] as const;
/** the twinkles start once his pop has settled */
const TWINKLE_AFTER_MS = duration.slower;

/** he shrinks to fit a short screen, but never past this */
const MIN_HERO_HEIGHT = 96;

export type RewardPose = 'celebrating' | 'calm' | 'proud' | 'excited';

interface Props {
  /** his size when the screen has room; on a short screen he takes what is left */
  maxWidth: number;
  pose?: RewardPose;
  delay: number;
  reducedMotion: boolean;
}

function raysPath(glowRadius: number) {
  const path = Skia.Path.Make();
  for (let ray = 0; ray < RAY_COUNT; ray += 1) {
    const angle = (ray * 2 * Math.PI) / RAY_COUNT;
    path.moveTo(glowRadius, glowRadius);
    path.lineTo(
      glowRadius + Math.cos(angle - RAY_HALF_ANGLE) * glowRadius,
      glowRadius + Math.sin(angle - RAY_HALF_ANGLE) * glowRadius,
    );
    path.lineTo(
      glowRadius + Math.cos(angle + RAY_HALF_ANGLE) * glowRadius,
      glowRadius + Math.sin(angle + RAY_HALF_ANGLE) * glowRadius,
    );
    path.close();
  }
  return path;
}

/**
 * Azo at his full size, or smaller when the screen is short.
 *
 * His slot is the one thing on a result screen allowed to shrink, so the title,
 * cards and button always fit and he takes whatever height is left, up to his
 * full size. He is drawn once the slot has been measured, which is before his
 * entrance begins.
 */
export default function ActivityRewardHero({ maxWidth, pose = 'celebrating', ...rest }: Props) {
  const aspect = KOALA_ASPECT[pose];
  const [slotHeight, setSlotHeight] = useState<number | null>(null);

  return (
    <View
      style={[styles.slot, { height: maxWidth * aspect }]}
      onLayout={(event) => setSlotHeight(event.nativeEvent.layout.height)}
    >
      {slotHeight == null ? null : (
        <HeroArt width={Math.min(maxWidth, slotHeight / aspect)} pose={pose} {...rest} />
      )}
    </View>
  );
}

/** Azo, with soft light breathing behind him and stars twinkling around him. */
function HeroArt({
  width,
  pose,
  delay,
  reducedMotion,
}: Omit<Props, 'maxWidth'> & { width: number; pose: RewardPose }) {
  const height = width * KOALA_ASPECT[pose];
  const glowSize = width * GLOW_SCALE;
  const glowRadius = glowSize / 2;
  const center = vec(glowRadius, glowRadius);
  const rays = useMemo(() => raysPath(glowRadius), [glowRadius]);
  const glow = useSharedValue(reducedMotion ? 1 : 0);
  const spin = useSharedValue(0);
  const breath = useSharedValue(0);
  const source = pose === 'proud' || pose === 'excited' ? ANIMATED_KOALA[pose] : null;
  const playback = useAnimatedImagePlayback(source, !reducedMotion);

  useWhileVisible(() => {
    if (reducedMotion) {
      glow.value = 1;
      return () => {};
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
    breath.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: BREATH_MS, easing: easing.breathe }), -1, true),
    );
    return () => {
      cancelAnimation(spin);
      cancelAnimation(breath);
      spin.value = 0;
      breath.value = 0;
    };
  }, [breath, delay, reducedMotion, spin]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: (0.8 + 0.2 * glow.value) * (1 + BREATH_SCALE * breath.value) }],
  }));
  const raysStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * RAY_TURN_DEG}deg` }],
  }));

  const koala =
    pose === 'proud' || pose === 'excited' ? (
      <Image
        key={source}
        ref={playback.ref}
        source={ANIMATED_KOALA[pose]}
        style={{ width, height }}
        contentFit="contain"
        autoplay={false}
        useAppleWebpCodec={false}
        cachePolicy="memory-disk"
        onLoad={playback.onLoad}
      />
    ) : pose === 'calm' ? (
      <CalmKoala width={width} height={height} />
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
                r={glowRadius}
                colors={[colors.celebrationGlow.ray, colors.celebrationGlow.edge]}
              />
            </Path>
          </Canvas>
        </Animated.View>
        <Canvas style={StyleSheet.absoluteFill}>
          <Circle cx={glowRadius} cy={glowRadius} r={glowRadius * GLOW_CORE_SHARE}>
            <RadialGradient
              c={center}
              r={glowRadius * GLOW_CORE_SHARE}
              colors={[colors.celebrationGlow.core, colors.celebrationGlow.edge]}
            />
          </Circle>
        </Canvas>
      </Animated.View>
      {reducedMotion ? koala : <Pop delay={delay}>{koala}</Pop>}
      {TWINKLES.map((twinkle, index) => (
        <LoopingTwinkle
          key={index}
          x={twinkle.x * width}
          y={twinkle.y * height}
          size={twinkle.size * width}
          color={twinkle.color}
          delay={delay + TWINKLE_AFTER_MS + index * stagger.base}
          period={twinkle.period}
          active
          reducedMotion={reducedMotion}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
    minHeight: MIN_HERO_HEIGHT,
  },
  glow: {
    position: 'absolute',
  },
  canvas: {
    flex: 1,
  },
});
