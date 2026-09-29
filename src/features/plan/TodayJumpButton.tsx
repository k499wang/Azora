import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import Icon from '../../components/common/icons/Icon';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { colors } from '../../theme/colors';
import { duration, easing } from '../../theme/motion';
import { padding, spacing } from '../../theme/spacing';
import LipCircle, { type LipTone } from './LipCircle';
import type { TodayDirection } from './useTodayJump';

const SIZE = spacing['4xl'];
const ARROW = 28;
const BOB = spacing.xs;

const TONE: LipTone = {
  face: colors.background.card,
  lip: colors.neutral[300],
  icon: colors.playful.sky.base,
};

interface Props {
  direction: TodayDirection | null;
  bottom: number;
  onPress: () => void;
}

/** Floats over the path while today is off screen, pointing back to it. */
export default function TodayJumpButton({ direction, bottom, onPress }: Props) {
  if (direction == null) return null;

  return (
    <Animated.View
      entering={ZoomIn.duration(duration.fast)}
      exiting={ZoomOut.duration(duration.fast)}
      style={[styles.float, { bottom }]}
    >
      <LipCircle
        size={SIZE}
        tone={TONE}
        accessibilityLabel="Scroll to today"
        onPress={() => {
          triggerTapHaptic();
          onPress();
        }}
      >
        <BobbingArrow direction={direction} />
      </LipCircle>
    </Animated.View>
  );
}

function BobbingArrow({ direction }: { direction: TodayDirection }) {
  const reducedMotion = useReducedMotion();
  const bob = useSharedValue(0);
  const sign = direction === 'up' ? -1 : 1;

  useEffect(() => {
    if (reducedMotion) return;
    bob.value = withRepeat(
      withSequence(
        withTiming(1, { duration: duration.slow, easing: easing.breathe }),
        withTiming(0, { duration: duration.slow, easing: easing.breathe }),
      ),
      -1,
    );
    return () => {
      cancelAnimation(bob);
      bob.value = 0;
    };
  }, [bob, reducedMotion]);

  const bobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: sign * BOB * bob.value },
      { rotate: direction === 'up' ? '0deg' : '180deg' },
    ],
  }));

  return (
    <Animated.View style={bobStyle}>
      <Icon name="arrow-up" size={ARROW} color={TONE.icon} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  float: {
    position: 'absolute',
    right: padding.screen.horizontal,
  },
});
