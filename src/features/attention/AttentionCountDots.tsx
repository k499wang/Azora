import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { triggerLightHaptic } from '../../native/tapHaptics';
import { colors } from '../../theme/colors';
import { duration, easing } from '../../theme/motion';
import { spacing } from '../../theme/spacing';

const TOUCH_TARGET = 44;
const DOT_SIZE = 24;
const DOT_BORDER = 2;
const POP_SCALE = 1.3;
const POP_MS = 90;

interface Props {
  count: number;
  counted: number;
  onCount: () => void;
}

export default function AttentionCountDots({ count, counted, onCount }: Props) {
  const full = counted >= count;

  const onPress = () => {
    triggerLightHaptic();
    onCount();
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={full}
      accessibilityRole="button"
      accessibilityLabel="Count one"
      accessibilityValue={{ text: `${counted} of ${count}` }}
      accessibilityState={{ disabled: full }}
      style={styles.row}
    >
      {Array.from({ length: count }, (_, index) => (
        <CountDot key={index} filled={index < counted} />
      ))}
    </Pressable>
  );
}

interface DotProps {
  filled: boolean;
}

function CountDot({ filled }: DotProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!filled) return;
    scale.value = withSequence(
      withTiming(POP_SCALE, { duration: POP_MS, easing: easing.burst }),
      withTiming(1, { duration: duration.base, easing: easing.settle }),
    );
  }, [filled, scale]);

  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={styles.cell}>
      <Animated.View style={[styles.dot, filled && styles.dotFilled, popStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  cell: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: DOT_BORDER,
    borderColor: colors.playful.sky.tintDeep,
    backgroundColor: colors.background.card,
  },
  dotFilled: {
    borderColor: colors.playful.sky.base,
    backgroundColor: colors.playful.sky.base,
  },
});
