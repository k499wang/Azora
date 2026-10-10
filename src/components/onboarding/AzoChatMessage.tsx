import { useEffect, useRef, type ReactNode } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { duration, easing, travel } from '../../theme/motion';

interface AzoChatMessageProps {
  children: ReactNode;
  animate: boolean;
  active: boolean;
  reducedMotion: boolean;
  style: StyleProp<ViewStyle>;
  onLayout: (event: LayoutChangeEvent) => void;
}

/** Each new bubble enters once; returning to the chat leaves history still. */
export default function AzoChatMessage({
  children,
  animate,
  active,
  reducedMotion,
  style,
  onLayout,
}: AzoChatMessageProps) {
  const entered = useRef(!animate || reducedMotion);
  const arrival = useSharedValue(entered.current ? 1 : 0);

  useEffect(() => {
    if (!active) {
      cancelAnimation(arrival);
      if (entered.current) arrival.value = 1;
      return;
    }
    if (!entered.current && !reducedMotion) {
      entered.current = true;
      arrival.value = withTiming(1, { duration: duration.base, easing: easing.enter });
    } else {
      entered.current = true;
      arrival.value = 1;
    }
    return () => {
      cancelAnimation(arrival);
      if (entered.current) arrival.value = 1;
    };
  }, [active, arrival, reducedMotion]);

  const animationStyle = useAnimatedStyle(() => ({
    opacity: arrival.value,
    transform: [
      { translateY: (1 - arrival.value) * travel.rise },
      { scale: 0.96 + arrival.value * 0.04 },
    ],
  }));

  return <Animated.View style={[style, animationStyle]} onLayout={onLayout}>{children}</Animated.View>;
}
