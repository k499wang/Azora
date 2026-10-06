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
  withSpring,
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
import AzoSpeechBubble from '../room/AzoSpeechBubble';
import { LoopingTwinkle } from '../room/RewardSparkles';
import { radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { duration, easing, spring, stagger } from '../../theme/motion';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { useWhileVisible } from '../../hooks/useWhileVisible';

const EXHALING_KOALA = require('../../../assets/Poses/koala_pose_exhaling.webp');
const KOALA_ASPECT: Record<RewardPose, number> = {
  celebrating: 1200 / 1080,
  calm: 1200 / 1080,
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
/** one slow in-or-out of the whole glow, about the length of a calm breath */
const BREATH_MS = 3_200;
const BREATH_SCALE = 0.06;

/** around him, clear of the bubble at his top right; fractions of his box */
const TWINKLES = [
  { x: -0.06, y: 0.18, size: 0.08, color: colors.reward.gold, period: 1_500 },
  { x: 0.22, y: -0.04, size: 0.055, color: colors.playful.sky.mid, period: 1_900 },
  { x: 1.05, y: 0.48, size: 0.07, color: colors.reward.gold, period: 1_700 },
  { x: -0.02, y: 0.74, size: 0.055, color: colors.playful.sky.mid, period: 2_100 },
  { x: 0.98, y: 0.86, size: 0.065, color: colors.reward.gold, period: 1_600 },
] as const;
/** the twinkles start once his pop has settled */
const TWINKLE_AFTER_MS = duration.slower;

const BUBBLE_WIDTH = 160;
const BUBBLE_HEIGHT = 80;
const BUBBLE_TAIL = 14;
/** how far right of his left edge the bubble starts, as a share of his width */
const BUBBLE_LEFT_SHARE = 0.56;
/** how much of the bubble sits above his box */
const BUBBLE_RISE_SHARE = 0.62;

export type RewardPose = 'celebrating' | 'exhaling' | 'calm';

interface Props {
  width: number;
  pose?: RewardPose;
  delay: number;
  reducedMotion: boolean;
  /** a line he says once he has settled */
  speech?: string;
  speechDelay?: number;
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

/** Azo, with soft light breathing behind him, stars twinkling around him, and something to say. */
export default function ActivityRewardHero({
  width,
  pose = 'celebrating',
  delay,
  reducedMotion,
  speech,
  speechDelay = delay,
}: Props) {
  const height = width * KOALA_ASPECT[pose];
  const glowSize = width * GLOW_SCALE;
  const glowRadius = glowSize / 2;
  const center = vec(glowRadius, glowRadius);
  const rays = useMemo(() => raysPath(glowRadius), [glowRadius]);
  const glow = useSharedValue(reducedMotion ? 1 : 0);
  const spin = useSharedValue(0);
  const breath = useSharedValue(0);

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
    pose === 'exhaling' ? (
      <Image source={EXHALING_KOALA} style={{ width, height }} contentFit="contain" />
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
      {speech == null ? null : (
        <SpeechBubble
          text={speech}
          delay={speechDelay}
          reducedMotion={reducedMotion}
          style={{ left: width * BUBBLE_LEFT_SHARE, top: -BUBBLE_HEIGHT * BUBBLE_RISE_SHARE }}
        />
      )}
    </View>
  );
}

function SpeechBubble({
  text,
  delay,
  reducedMotion,
  style,
}: {
  text: string;
  delay: number;
  reducedMotion: boolean;
  style: { left: number; top: number };
}) {
  const open = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      open.value = 1;
      return;
    }
    open.value = withDelay(delay, withSpring(1, spring.pop));
    return () => cancelAnimation(open);
  }, [delay, open, reducedMotion]);

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, open.value * 2),
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.bubble, style, bubbleStyle]}>
      <AzoSpeechBubble
        text={text}
        progress={open}
        tail="bottom"
        unit="word"
        fillStyle={styles.bubbleFill}
        tailStyle={styles.bubbleTail}
        textStyle={styles.bubbleText}
        contentStyle={styles.bubbleContent}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
  },
  canvas: {
    flex: 1,
  },
  bubble: {
    position: 'absolute',
    width: BUBBLE_WIDTH,
    height: BUBBLE_HEIGHT,
  },
  bubbleFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.card,
  },
  // a square on its corner under the bubble's lower left, pointing back at him
  bubbleTail: {
    position: 'absolute',
    left: radius.xl - BUBBLE_TAIL / 2,
    bottom: -BUBBLE_TAIL * 0.35,
    width: BUBBLE_TAIL,
    height: BUBBLE_TAIL,
    borderRadius: 2,
    backgroundColor: colors.background.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.subtle,
    transform: [{ rotate: '45deg' }],
  },
  bubbleText: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text.primary,
  },
  bubbleContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
