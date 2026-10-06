import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Icon from '../../components/common/icons/Icon';
import { duration, easing, spring } from '../../theme/motion';

/**
 * The twinkling stars every reward moment shares: the gift opening, a piece
 * landing, the finished room. Positions are the star's centre in pixels of the
 * parent.
 */

interface BurstStarProps {
  angle: number;
  /** 0 → 1 over the burst; owned by the caller so a whole burst shares one clock */
  burst: Readonly<SharedValue<number>>;
  color: string;
  distance: number;
  size: number;
  x: number;
  y: number;
}

/** Thrown up and out from a point, then pulled back down a little: an arc, not a ray. */
export function BurstStar({ angle, burst, color, distance, size, x, y }: BurstStarProps) {
  const radians = (angle * Math.PI) / 180;
  const dx = Math.cos(radians);
  const dy = Math.sin(radians);

  const style = useAnimatedStyle(() => {
    const travel = interpolate(burst.value, [0, 1], [0, distance]);
    const sag = burst.value * burst.value * distance * 0.35;

    return {
      opacity: interpolate(burst.value, [0, 0.1, 0.7, 1], [0, 1, 1, 0]),
      transform: [
        { translateX: dx * travel },
        { translateY: dy * travel + sag },
        { rotate: `${burst.value * 200 * Math.sign(dx || 1)}deg` },
        { scale: interpolate(burst.value, [0, 0.2, 1], [0.3, 1.15, 0.5]) },
      ],
    };
  });

  return <Star x={x} y={y} size={size} color={color} style={style} />;
}

interface TwinkleProps {
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
}

/** Pops, twinkles once, and is gone. */
export function FlashTwinkle({ x, y, size, color, delay, lifeMs = 900 }: TwinkleProps & { lifeMs?: number }) {
  const life = useSharedValue(0);

  useEffect(() => {
    life.value = withDelay(delay, withTiming(1, { duration: lifeMs, easing: easing.breathe }));
    return () => cancelAnimation(life);
  }, [delay, life, lifeMs]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(life.value, [0, 0.15, 0.75, 1], [0, 1, 1, 0]),
    transform: [
      { scale: interpolate(life.value, [0, 0.25, 0.5, 0.75, 1], [0, 1.15, 0.75, 1, 0]) },
      { rotate: `${life.value * 90}deg` },
    ],
  }));

  return <Star x={x} y={y} size={size} color={color} style={style} />;
}

/** Pops in with a spin, then twinkles for as long as it is mounted. */
export function LoopingTwinkle({
  x,
  y,
  size,
  color,
  delay,
  period,
  active,
  reducedMotion = false,
}: TwinkleProps & { period: number; active: boolean; reducedMotion?: boolean }) {
  const pop = useSharedValue(0);
  const twinkle = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(pop);
    cancelAnimation(twinkle);
    pop.value = active && reducedMotion ? 1 : 0;
    twinkle.value = 0;
    if (active && !reducedMotion) {
      pop.value = withDelay(delay, withSpring(1, spring.bounce));
      twinkle.value = withDelay(
        delay + duration.slower,
        withRepeat(withTiming(1, { duration: period, easing: easing.breathe }), -1, true),
      );
    }
    return () => {
      cancelAnimation(pop);
      cancelAnimation(twinkle);
    };
  }, [active, delay, period, pop, reducedMotion, twinkle]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(pop.value, [0, 0.4], [0, 1], 'clamp') * (1 - 0.35 * twinkle.value),
    transform: [
      { scale: pop.value * (1 - 0.3 * twinkle.value) },
      { rotate: `${(1 - pop.value) * -120 + twinkle.value * 18}deg` },
    ],
  }));

  return <Star x={x} y={y} size={size} color={color} style={style} />;
}

function Star({
  x,
  y,
  size,
  color,
  style,
}: {
  x: number;
  y: number;
  size: number;
  color: string;
  style: ReturnType<typeof useAnimatedStyle>;
}) {
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.star, { width: size, height: size, left: x - size / 2, top: y - size / 2 }, style]}
    >
      <Icon name="twinkle" size={size} color={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
  },
});
