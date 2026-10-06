import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { popAnimation } from '../../hooks/usePopOnChange';
import { duration, easing, emphasis } from '../../theme/motion';

const FILL_DURATION_MS = duration.fill;
const DEFAULT_FILL_DELAY_MS = 320;
/** Half a button's lip: a bar is a reading, not something to press. */
export const PROGRESS_LIP_DEPTH = 2;

// No spring on the fill: a bar that overshoots past its own track just looks
// broken. The landing bump is a separate beat on the whole track, after the
// fill has settled.
const FILL_EASING = easing.settle;

interface ProgressBarProps {
  /** 0..1 — where the bar should end up */
  progress: number;
  /**
   * 0..1 — where the fill starts before animating. Defaults to `progress`, so a
   * bar only moves when a caller asks it to.
   */
  from?: number;
  /**
   * ms before the fill starts moving. Raise it when the bar is revealed by an
   * entrance animation: a fill that begins while the bar is still fading in is
   * most of the way home by the time anyone can see it, so the bar reads as
   * having been full all along.
   */
  delay?: number;
  height?: number;
  trackColor?: string;
  fillColor?: string;
  /** fires when the fill starts moving */
  onFillStart?: () => void;
  /** fires once the fill has settled on `progress` */
  onFillEnd?: () => void;
  style?: ViewStyle;
  /**
   * Rests the bar on a lip, like a `ChunkyButton` face: each part gets a deeper
   * shade of itself underneath, so the lip under the fill grows with the fill.
   */
  lip?: { track: string; fill: string };
  /**
   * Sits centred over the track, above the fill — for a bar that carries its
   * own count rather than putting one beside it. Give it a colour that reads on
   * the fill and on the track, since the fill passes under it as the bar grows.
   */
  children?: ReactNode;
}

/**
 * The fill is scaled from its left edge, never measured and never sized in
 * points. An earlier version animated a `translateX` off an `onLayout` width,
 * which paints one wrong frame before layout arrives — at width 0 the offset is
 * 0, and the fill spans the whole track, so the bar flashes complete before it
 * fills. There is no measurement here, so the first frame is already correct.
 *
 * `width` itself stays untouched: it is a layout prop, so animating it re-runs
 * layout every frame and the bar visibly steps.
 */
export default function ProgressBar({
  progress,
  from,
  delay = DEFAULT_FILL_DELAY_MS,
  height = 10,
  trackColor = colors.primary.blue100,
  fillColor = colors.primary.blue500,
  onFillStart,
  onFillEnd,
  style,
  lip,
  children,
}: ProgressBarProps) {
  const fraction = useSharedValue(clamp(from ?? progress));
  const bump = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const target = clamp(progress);

    if (fraction.value === target) {
      return;
    }

    const lands = !reducedMotion && target > fraction.value;

    onFillStart?.();
    fraction.value = withDelay(
      delay,
      withTiming(
        target,
        { duration: FILL_DURATION_MS, easing: FILL_EASING },
        (finished) => {
          if (!finished) return;
          if (lands) bump.value = popAnimation(emphasis.land);
          if (onFillEnd != null) runOnJS(onFillEnd)();
        },
      ),
    );
    // `onFillStart` / `onFillEnd` are intentionally excluded: callers pass
    // inline closures, and re-running this on every render would restart the
    // fill mid-flight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bump, delay, fraction, progress, reducedMotion]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: fraction.value }],
  }));
  const bumpStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: bump.value }],
  }));

  const radius = height / 2;
  const lipDepth = lip == null ? 0 : PROGRESS_LIP_DEPTH;
  const face = { height, borderRadius: radius };

  return (
    <Animated.View
      style={[
        styles.track,
        {
          height: height + lipDepth,
          borderRadius: radius,
          backgroundColor: lip?.track ?? trackColor,
        },
        style,
        bumpStyle,
      ]}
    >
      {lip == null ? null : (
        <View style={[styles.face, face, { backgroundColor: trackColor }]} />
      )}
      <Animated.View
        style={[
          styles.fill,
          { borderRadius: radius, backgroundColor: lip?.fill ?? fillColor },
          fillStyle,
        ]}
      >
        {lip == null ? null : (
          <View style={[styles.face, face, { backgroundColor: fillColor }]} />
        )}
      </Animated.View>
      {children == null ? null : (
        <View style={[styles.label, { height }]} pointerEvents="none">
          {children}
        </View>
      )}
    </Animated.View>
  );
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    transformOrigin: 'left center',
  },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  label: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
