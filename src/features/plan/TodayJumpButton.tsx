import { Pressable, StyleSheet } from 'react-native';
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
import { useWhileVisible } from '../../hooks/useWhileVisible';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { duration, easing } from '../../theme/motion';
import { pressable } from '../../theme/pressable';
import { padding, spacing } from '../../theme/spacing';
import { ROUTINE_ADD_BUTTON_SIZE } from '../selfCare/RoutineAddMenu';
import type { TodayDirection } from './useTodayJump';

// Matches the Routine tab's floating add button, so both tabs float the same control.
const SIZE = ROUTINE_ADD_BUTTON_SIZE;
const ARROW = 30;
const BOB = spacing.xs;

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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Scroll to today"
        onPress={() => {
          triggerTapHaptic();
          onPress();
        }}
        style={({ pressed }) => [card.base, card.shadow, styles.button, pressed && pressable.control]}
      >
        <BobbingArrow direction={direction} />
      </Pressable>
    </Animated.View>
  );
}

function BobbingArrow({ direction }: { direction: TodayDirection }) {
  const reducedMotion = useReducedMotion();
  const bob = useSharedValue(0);
  const sign = direction === 'up' ? -1 : 1;

  useWhileVisible(() => {
    if (reducedMotion) return () => {};
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
      <Icon name="arrow-up" size={ARROW} color={colors.primary.blue500} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  float: {
    position: 'absolute',
    right: padding.screen.horizontal,
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
