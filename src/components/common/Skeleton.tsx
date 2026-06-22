import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type {
  DimensionValue,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export type SkeletonVariant = 'shimmer' | 'pulse';

export interface SkeletonProps {
  /** Width of the placeholder block. Defaults to filling its parent. */
  width?: DimensionValue;
  /** Height of the placeholder block. */
  height?: DimensionValue;
  /** Corner radius. Use a large value for pill/circle shapes. */
  radius?: number;
  /** Animation style. `shimmer` sweeps a highlight; `pulse` fades opacity. */
  variant?: SkeletonVariant;
  /** Full animation cycle duration in ms. */
  duration?: number;
  /** Extra style overrides (margins, alignment, etc.). */
  style?: StyleProp<ViewStyle>;
}

const DEFAULT_RADIUS = 8;
const DEFAULT_HEIGHT = 12;
const DEFAULT_DURATION = 1200;

/**
 * Animated loading placeholder. Compose multiple `Skeleton`s to mirror the
 * shape of incoming content (a "skeleton screen") so layout doesn't shift when
 * data arrives.
 */
export default function Skeleton({
  width = '100%',
  height = DEFAULT_HEIGHT,
  radius = DEFAULT_RADIUS,
  variant = 'shimmer',
  duration = DEFAULT_DURATION,
  style,
}: SkeletonProps) {
  const blockStyle: ViewStyle = {
    width,
    height,
    borderRadius: radius,
    backgroundColor: colors.skeleton.base,
  };

  if (variant === 'pulse') {
    return <PulseBlock blockStyle={blockStyle} duration={duration} style={style} />;
  }
  return <ShimmerBlock blockStyle={blockStyle} duration={duration} style={style} />;
}

interface BlockProps {
  blockStyle: ViewStyle;
  duration: number;
  style?: StyleProp<ViewStyle>;
}

function PulseBlock({ blockStyle, duration, style }: BlockProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(opacity);
  }, [opacity, duration]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[blockStyle, animatedStyle, style]} />;
}

function ShimmerBlock({ blockStyle, duration, style }: BlockProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(progress);
  }, [progress, duration]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-trackWidth, trackWidth]) },
    ],
  }));

  const onLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  return (
    <View onLayout={onLayout} style={[blockStyle, styles.clip, style]}>
      {trackWidth > 0 ? (
        <AnimatedLinearGradient
          colors={[
            colors.skeleton.highlight + '00',
            colors.skeleton.highlight,
            colors.skeleton.highlight + '00',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[StyleSheet.absoluteFill, sweepStyle]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
});
