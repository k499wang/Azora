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
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type WithTimingConfig,
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

// The drawer itself is paced by how far it travels, so a short field and a
// tall grid read as the same gesture: the field still snaps, and the grid is no
// longer flung its whole height in the time the field takes.
const OPEN_MIN_MS = duration.fast;
const OPEN_MAX_MS = 340;
const OPEN_BASE_MS = 140;
const OPEN_MS_PER_POINT = 0.55;
/** closing is quicker than opening, never abrupt */
const CLOSE_SCALE = 0.8;
/** the standard ease: a gentle start, so what is closing is seen to go */
const CLOSE_EASING = Easing.bezier(0.4, 0, 0.2, 1);
/** how far the content drops in from as the edge reveals it */
const CONTENT_DROP = 8;

interface CollapsibleProps {
  open: boolean;
  children: ReactNode;
  /** applied to the clipping box, for padding the drawer owes its neighbours */
  contentStyle?: StyleProp<ViewStyle>;
  /** Called once an open has finished, so the owner can bring it into view. */
  onOpened?: () => void;
  /** Override the distance-based pacing for both opening and closing. */
  timing?: WithTimingConfig;
  /** Disable to pre-mount and measure small, bounded content before first open. */
  mountOnOpen?: boolean;
}

/**
 * Content that unfolds downward out of whatever sits above it.
 *
 * The box's lower edge unrolls over content that is already standing in place,
 * which fades and settles the last few points as it is uncovered — rather than
 * the whole content sliding its own height, which on a tall grid is a lot of
 * fast movement for the eye to follow.
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
  onOpened,
  timing,
  mountOnOpen = true,
}: CollapsibleProps) {
  const reducedMotion = useReducedMotion();
  const opened = useRef(onOpened);
  opened.current = onOpened;
  const announceOpened = useCallback(() => opened.current?.(), []);
  const height = useSharedValue(0);
  const progress = useSharedValue(open ? 1 : 0);
  const measured = useRef(0);
  const openRef = useRef(open);
  openRef.current = open;

  /**
   * By default nothing mounts until the drawer first opens, then stays mounted.
   * Small drawers can mount immediately to measure before the first tap.
   * A lazy drawer that is never opened costs nothing —
   * which matters when the thing inside it is three dozen icons, each of which
   * parses its own SVG on mount — and reopening one is free.
   */
  const [mounted, setMounted] = useState(open || !mountOnOpen);
  useEffect(() => {
    if (open || !mountOnOpen) setMounted(true);
  }, [open, mountOnOpen]);

  // Runs on both edges: `open` changing, and the content being measured for the
  // first time just after it mounts. Whichever happens second starts the move.
  const sync = useCallback(() => {
    if (measured.current === 0) return;
    const next = openRef.current;
    // Already standing open — the content was only re-measured.
    if (next && progress.value === 1) return;
    if (reducedMotion) {
      progress.value = next ? 1 : 0;
      if (next) announceOpened();
      return;
    }
    const openMs = Math.min(
      OPEN_MAX_MS,
      Math.max(OPEN_MIN_MS, OPEN_BASE_MS + measured.current * OPEN_MS_PER_POINT),
    );
    progress.value = withTiming(
      next ? 1 : 0,
      timing ?? (next
        ? { duration: openMs, easing: COLLAPSE_TIMING.easing }
        : { duration: openMs * CLOSE_SCALE, easing: CLOSE_EASING }),
      (finished) => {
        if (finished && next) runOnJS(announceOpened)();
      },
    );
  }, [progress, reducedMotion, announceOpened, timing]);

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
    transform: [{ translateY: (progress.value - 1) * CONTENT_DROP }],
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
