import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  interpolate,
  interpolateColor,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../../components/common/Text';
import { colors } from '../../theme/colors';
import { duration, easing } from '../../theme/motion';
import { typography } from '../../theme/typography';
import type { AttentionPhase } from './domain/attentionScripts';

const SHAPE_SIZE = 168;
const SQUEEZED_SCALE = 0.76;
const LOOSE_RADIUS = SHAPE_SIZE / 2;
const SQUEEZED_RADIUS = SHAPE_SIZE * 0.34;
const LOOSE_OUTLINE = 2;
const SQUEEZED_OUTLINE = 5;
const PULSE_SCALE = 0.015;
const PULSE_MS = 420;
const SQUEEZE_MS = 600;
const RELEASE_MS = 1200;

const { amber, teal } = colors.playful;

interface Props {
  phase: AttentionPhase;
  remaining: number;
}

/**
 * A soft shape that tightens on a squeeze and swells loose on a let-go, so the
 * body has something to copy. Stays mounted across timed steps to carry the
 * change from one phase to the next.
 */
export default function AttentionSqueezeShape({ phase, remaining }: Props) {
  const reducedMotion = useReducedMotion();
  const form = useSharedValue(0);
  const tint = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    const squeezing = phase === 'squeeze';
    const timing = squeezing
      ? { duration: SQUEEZE_MS, easing: easing.settle }
      : { duration: RELEASE_MS, easing: easing.enter };

    // Colour is the cue that survives reduced motion; only the size stays put.
    tint.value = withTiming(squeezing ? 1 : 0, { ...timing, reduceMotion: ReduceMotion.Never });
    if (reducedMotion) {
      form.value = 0;
      pulse.value = 0;
      return;
    }
    form.value = withTiming(squeezing ? 1 : 0, timing);
    pulse.value = squeezing
      ? withDelay(
          SQUEEZE_MS,
          withRepeat(withTiming(1, { duration: PULSE_MS, easing: easing.breathe }), -1, true),
        )
      : withTiming(0, { duration: duration.fast });
    return () => cancelAnimation(pulse);
  }, [phase, reducedMotion, form, tint, pulse]);

  const shapeStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale:
          interpolate(form.value, [0, 1], [1, SQUEEZED_SCALE]) * (1 + pulse.value * PULSE_SCALE),
      },
    ],
    borderRadius: interpolate(form.value, [0, 1], [LOOSE_RADIUS, SQUEEZED_RADIUS]),
    borderWidth: interpolate(form.value, [0, 1], [LOOSE_OUTLINE, SQUEEZED_OUTLINE]),
    backgroundColor: interpolateColor(tint.value, [0, 1], [teal.soft, amber.soft]),
    borderColor: interpolateColor(tint.value, [0, 1], [teal.tint, amber.base]),
  }));

  return (
    <View style={styles.frame}>
      <Animated.View style={[StyleSheet.absoluteFill, shapeStyle]} />
      <Text
        style={[styles.seconds, { color: phase === 'squeeze' ? amber.ink : teal.ink }]}
        accessibilityLabel={`${remaining} seconds`}
      >
        {remaining}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: SHAPE_SIZE,
    height: SHAPE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seconds: {
    ...typography.display.display2,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
});
