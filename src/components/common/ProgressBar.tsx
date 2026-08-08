import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';

const FILL_DURATION_MS = 900;
const FILL_DELAY_MS = 320;

// Long, flat deceleration — the fill covers most of its distance early and
// eases into the target without the abrupt stop a plain ease-out gives. No
// spring: a bar that overshoots past its own track just looks broken.
const FILL_EASING = Easing.bezier(0.16, 1, 0.3, 1);

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
 * The fill is a full-width bar slid in from the left, not a view whose `width`
 * animates. Width is a layout prop, so animating it re-runs layout every frame
 * and the bar visibly steps; `translateX` stays on the compositor. Sliding also
 * keeps the rounded right cap its true shape, which `scaleX` would squash.
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
  const [trackWidth, setTrackWidth] = useState(0);
  const fraction = useSharedValue(clamp(from ?? progress));

  // Gated on layout: before the track is measured the fill has no distance to
  // travel, so an animation started here would complete against a zero width
  // and the bar would snap into place the moment the real width arrived.
  useEffect(() => {
    if (trackWidth === 0) {
      return;
    }

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
  }, [fraction, progress, trackWidth]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -(1 - fraction.value) * trackWidth }],
  }));

  const onLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      onLayout={onLayout}
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
  },
});
