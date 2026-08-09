import { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { duration, easing } from '../../theme/motion';

const FILL_DURATION_MS = duration.fill;
const FILL_DELAY_MS = 320;

// No spring: a bar that overshoots past its own track just looks broken.
const FILL_EASING = easing.settle;

interface ProgressBarProps {
  /** 0..1 — where the bar should end up */
  progress: number;
  /**
   * 0..1 — where the fill starts before animating. Defaults to `progress`, so a
   * bar only moves when a caller asks it to.
   */
  from?: number;
  height?: number;
  trackColor?: string;
  fillColor?: string;
  /** fires when the fill starts moving */
  onFillStart?: () => void;
  /** fires once the fill has settled on `progress` */
  onFillEnd?: () => void;
  style?: ViewStyle;
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
  height = 10,
  trackColor = colors.primary.blue100,
  fillColor = colors.primary.blue600,
  onFillStart,
  onFillEnd,
  style,
}: ProgressBarProps) {
  const fraction = useSharedValue(clamp(from ?? progress));

  useEffect(() => {
    const target = clamp(progress);

    if (fraction.value === target) {
      return;
    }

    onFillStart?.();
    fraction.value = withDelay(
      FILL_DELAY_MS,
      withTiming(
        target,
        { duration: FILL_DURATION_MS, easing: FILL_EASING },
        (finished) => {
          if (finished && onFillEnd != null) {
            runOnJS(onFillEnd)();
          }
        },
      ),
    );
    // `onFillStart` / `onFillEnd` are intentionally excluded: callers pass
    // inline closures, and re-running this on every render would restart the
    // fill mid-flight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fraction, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: fraction.value }],
  }));

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: trackColor },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          { borderRadius: height / 2, backgroundColor: fillColor },
          fillStyle,
        ]}
      />
    </View>
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
});
