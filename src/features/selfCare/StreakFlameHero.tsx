import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { streakCelebrationColors as palette } from './streakCelebrationMotion';

interface Props {
  igniteAt: number;
  idle: boolean;
  reducedMotion: boolean;
}
const FLAME_PATH = 'M46 8Q51 2 57 9L81 40Q91 54 89 66C88 87 72 99 50 99C24 99 10 86 10 64L11 26Q11 15 21 19L32 24Z';
const INNER_PATH = 'M47 47Q50 44 54 48L64 60Q68 66 67 72C66 82 60 87 50 87C40 87 34 80 34 72Q33 64 39 57Z';

/** A flat flame silhouette: anticipation, upward ignition, then a quiet settled reward. */
export default function StreakFlameHero({ igniteAt, idle: active, reducedMotion }: Props) {
  const lit = useSharedValue(reducedMotion ? 1 : 0);
  const pose = useSharedValue(0);
  const ring = useSharedValue(0);
  const swirl = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    if (!active) return;
    if (reducedMotion) {
      lit.value = 1;
      pose.value = 0;
      ring.value = 1;
      swirl.value = 1;
      return;
    }
    lit.value = 0; pose.value = 0; ring.value = 0;
    swirl.value = 0;
    swirl.value = withDelay(igniteAt - 400, withTiming(1, { duration: 900 }));
    lit.value = withDelay(igniteAt, withTiming(1, { duration: 120 }));
    pose.value = withDelay(
      igniteAt - 220,
      withSequence(
        withTiming(-1, { duration: 220 }),
        withTiming(1, { duration: 200 }),
        withSpring(0, { damping: 10, stiffness: 180 }),
      ),
    );
    ring.value = withDelay(igniteAt, withTiming(1, { duration: 600 }));
    return () => { [lit, pose, ring, swirl].forEach(cancelAnimation);
    };
  }, [active, igniteAt, lit, pose, reducedMotion, ring, swirl]);
  const flameStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(pose.value, [-1, 0, 1], [12, 0, -30]) },
      { scaleX: interpolate(pose.value, [-1, 0, 1], [1.2, 1, .82]) },
      { scaleY: interpolate(pose.value, [-1, 0, 1], [.7, 1, 1.22]) },
      { rotate: `${interpolate(swirl.value, [0, .4, .75, 1], [0, -170, -350, -360])}deg` },
      { scale: interpolate(swirl.value, [0, .35, .55, 1], [1, .5, .12, 1]) },
    ],
  }));
  const discStyle = useAnimatedStyle(() => ({
    opacity: interpolate(swirl.value, [0, .2, .4, .75, 1], [0, 0, 1, 0, 0]),
    transform: [
      { scale: interpolate(swirl.value, [0, .4, 1], [.3, 1, .3]) },
      { rotate: `${swirl.value * 360}deg` },
    ],
  }));
  const dormantStyle = useAnimatedStyle(() => ({ opacity: 1 - lit.value }));
  const litStyle = useAnimatedStyle(() => ({ opacity: lit.value }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ring.value > 0 ? (1 - ring.value) * .85 : 0,
    transform: [{ scale: .4 + ring.value * 1.5 }],
  }));

  return (
    <View style={styles.hero} pointerEvents="none">
      <Animated.View style={[styles.ring, ringStyle]} />
      <Animated.View style={[styles.disc, discStyle]}>
        <View style={styles.discCenter} />
      </Animated.View>
      <Animated.View style={[styles.flame, flameStyle]}>
        <Animated.View style={[StyleSheet.absoluteFill, dormantStyle]}>
          <Flame lit={false} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, litStyle]}>
          <Flame lit />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function Flame({ lit }: { lit: boolean }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 112">
      <Defs>
        <LinearGradient id="flameGold" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffed78" />
          <Stop offset="1" stopColor="#ffd024" />
        </LinearGradient>
      </Defs>
      {lit && <Ellipse cx="50" cy="101" rx="30" ry="10" fill="#ffb627" />}
      <Path d={FLAME_PATH} fill={lit ? 'url(#flameGold)' : palette.dormant} />
      <Path d={INNER_PATH} fill={lit ? '#fff6b3' : '#35464e'} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  hero: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center' },
  flame: { width: 124, height: 144, transformOrigin: ['50%', '90%', 0] },
  disc: {
    position: 'absolute',
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: palette.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discCenter: { width: 36, height: 36, borderRadius: 18, backgroundColor: palette.cream },
  ring: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    borderColor: palette.yellow,
  },
});
