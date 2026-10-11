import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useWhileVisible } from '../../hooks/useWhileVisible';
import { spacing } from '../../theme/spacing';
import { azoChatColors } from './AzoChatChrome';

interface AzoTypingDotsProps {
  reducedMotion: boolean;
}

/** One lap of the wave: each dot hops in turn, then all three rest together. */
const WAVE_PERIOD = 1100;

/** How far along the lap each dot starts its hop. */
const DOT_OFFSET = 0.16;

/** The share of the lap one hop takes, up and back down. */
const HOP_SHARE = 0.36;

const HOP_HEIGHT = 5;
const DOTS = [0, 1, 2];

function TypingDot({ clock, index }: { clock: SharedValue<number>; index: number }) {
  const style = useAnimatedStyle(() => {
    const start = index * DOT_OFFSET;
    const along = interpolate(clock.value, [start, start + HOP_SHARE], [0, 1], 'clamp');
    const hop = Math.sin(along * Math.PI);
    return {
      opacity: 0.45 + hop * 0.55,
      transform: [{ translateY: -hop * HOP_HEIGHT }],
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

/** Azo's typing indicator: three dots that hop in a wave on one shared clock. */
export default function AzoTypingDots({ reducedMotion }: AzoTypingDotsProps) {
  const clock = useSharedValue(0);

  useWhileVisible(() => {
    if (reducedMotion) return () => {};
    clock.value = 0;
    clock.value = withRepeat(
      withTiming(1, { duration: WAVE_PERIOD, easing: Easing.linear }),
      -1,
    );
    return () => cancelAnimation(clock);
  }, [clock, reducedMotion]);

  return (
    <View style={styles.row}>
      {DOTS.map((index) => <TypingDot key={index} clock={clock} index={index} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingTop: HOP_HEIGHT },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: azoChatColors.muted },
});
