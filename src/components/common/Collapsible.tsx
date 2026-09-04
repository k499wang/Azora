import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  StyleSheet,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { duration, easing } from '../../theme/motion';

/**
 * Quick, and on a curve that actually stops.
 *
 * `easing.settle` is a long flat deceleration — right for something crossing a
 * screen, wrong here: it spends its last third barely moving, so a drawer on it
 * reads as slow however short the duration is. A field opening under the finger
 * that pressed it wants to be there, not to be watched arriving.
 */
export const COLLAPSE_TIMING = {
  duration: duration.fast,
  easing: easing.enter,
} as const;

interface CollapsibleProps {
  open: boolean;
  children: ReactNode;
  /** applied to the clipping box, for padding the drawer owes its neighbours */
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Content that unfolds downward out of whatever sits above it.
 *
 * It rides down from under its own top edge rather than growing in place, so
 * the movement reads as one sheet unfolding instead of a box inflating.
 *
 * Both the measured height and the open/closed progress live in shared values,
 * so the whole animation runs on the UI thread and React is not involved once
 * it starts. Keeping the height in component state instead — the obvious way to
 * write this — costs a re-render of every child on each layout pass and rebuilds
 * both worklets each time, which is what makes hand-rolled accordions stutter.
 */
export default function Collapsible({
  open,
  children,
  contentStyle,
}: CollapsibleProps) {
  const height = useSharedValue(0);
  const progress = useSharedValue(open ? 1 : 0);
  const measured = useRef(0);
  const openRef = useRef(open);
  openRef.current = open;

  /**
   * Nothing is mounted until the drawer is opened for the first time, and it
   * stays mounted afterwards. A drawer that is never opened costs nothing —
   * which matters when the thing inside it is three dozen icons, each of which
   * parses its own SVG on mount — and reopening one is free.
   */
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  // Runs on both edges: `open` changing, and the content being measured for the
  // first time just after it mounts. Whichever happens second starts the move.
  const sync = useCallback(() => {
    if (measured.current === 0) return;
    progress.value = withTiming(openRef.current ? 1 : 0, COLLAPSE_TIMING);
  }, [progress]);

  useEffect(sync, [open, sync]);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const next = event.nativeEvent.layout.height;
      // Layout fires for reasons that are not a change. Re-running the timing
      // on each of them would restart the animation mid-flight.
      if (next === measured.current) return;
      measured.current = next;
      height.value = next;
      sync();
    },
    [height, sync],
  );

  // No dependency arrays: both worklets read shared values, so they are built
  // once for the life of the component instead of on every measurement.
  const boxStyle = useAnimatedStyle(() => ({
    height: height.value * progress.value,
  }));
  const innerStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (progress.value - 1) * height.value }],
  }));

  return (
    <Animated.View
      // A closed drawer is clipped to nothing, but saying so is what keeps its
      // contents out of the touch tree rather than relying on the clip.
      pointerEvents={open ? 'auto' : 'none'}
      style={[styles.box, boxStyle]}
    >
      {/* Taken out of flow so it is measured at its natural height whatever the
          box above it is currently clipped to — measured in flow it reads zero
          while closed, and the first open has nothing to animate towards. */}
      {mounted ? (
        <Animated.View
          style={[styles.content, contentStyle, innerStyle]}
          onLayout={onLayout}
        >
          {children}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
