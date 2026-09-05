import { Text } from '../common/Text';
import { useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';

interface OnboardingHapticSliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  unit?: string;
  accent?: string;
  formatValue?: (value: number) => string;
  /** what each end of the scale means, in the user's own voice */
  minLabel?: string;
  maxLabel?: string;
  onChange: (value: number) => void;
}

/**
 * A dragged knob under a field of bars that dip toward wherever it sits, so the
 * answer reads as a position on a scale rather than a number that happened to be
 * scrolled into place.
 *
 * The bars are a picture of the scale, not its steps: a range like an age spans
 * far more values than there are legible bars, so the field is sampled to a
 * fixed count and the knob still lands on every step. Their heights are fixed —
 * a valley, tall at the extremes and shallow in the middle — so the field is a
 * stable backdrop the knob moves across. Only the colour of the bar nearest the
 * knob changes; heights that reshaped on every step made the scale look like it
 * was being redrawn under the finger.
 */
const BAR_COUNT = 9;
const BAR_WIDTH = 8;
const BAR_MIN_HEIGHT = 26;
const BAR_MAX_HEIGHT = 96;
/** the fixed valley: shallow in the middle, tall at both ends */
const BAR_HEIGHTS = Array.from({ length: BAR_COUNT }, (_, index) => {
  const distance =
    Math.abs(index - (BAR_COUNT - 1) / 2) / ((BAR_COUNT - 1) / 2);
  return BAR_MIN_HEIGHT + (BAR_MAX_HEIGHT - BAR_MIN_HEIGHT) * distance;
});
const KNOB_SIZE = 34;
const KNOB_RING = 4;
const TRACK_HEIGHT = 8;

export default function OnboardingHapticSlider({
  min,
  max,
  step = 1,
  value,
  unit,
  accent = colors.primary.blue600,
  formatValue,
  minLabel,
  maxLabel,
  onChange,
}: OnboardingHapticSliderProps) {
  const [width, setWidth] = useState(0);
  // Read inside the pan responder, which is created once and would otherwise
  // close over the first render's width and value.
  const widthRef = useRef(0);
  const valueRef = useRef(value);
  valueRef.current = value;
  const grantXRef = useRef(0);

  const stepCount = Math.max(1, Math.round((max - min) / step));
  const ratio = Math.min(1, Math.max(0, (value - min) / (max - min)));

  const inner = Math.max(0, width - KNOB_SIZE);

  const commit = (x: number) => {
    const usable = Math.max(1, widthRef.current - KNOB_SIZE);
    const nextRatio = Math.min(1, Math.max(0, (x - KNOB_SIZE / 2) / usable));
    const next = min + Math.round(nextRatio * stepCount) * step;
    if (next === valueRef.current) return;
    valueRef.current = next;
    if (isHapticsEnabled()) Haptics.selectionAsync().catch(() => {});
    onChange(next);
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          grantXRef.current = event.nativeEvent.locationX;
          commit(grantXRef.current);
        },
        // From the grant point plus the gesture's own delta: `locationX` on a
        // move is relative to whatever view the touch is over, which drifts as
        // the finger crosses the bars.
        onPanResponderMove: (_event, gesture) =>
          commit(grantXRef.current + gesture.dx),
      }),
    // `commit` reads live values through refs, so the responder never needs
    // rebuilding — and rebuilding it mid-drag would drop the gesture.
    [],
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    widthRef.current = event.nativeEvent.layout.width;
    setWidth(event.nativeEvent.layout.width);
  };

  const activeBar = Math.round(ratio * (BAR_COUNT - 1));

  return (
    <View style={styles.wrap}>
      <View style={styles.readout}>
        <Text style={[styles.value, { color: accent }]}>
          {formatValue ? formatValue(value) : value}
        </Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>

      <View style={styles.slider} onLayout={handleLayout} {...pan.panHandlers}>
        <View style={styles.bars} pointerEvents="none">
          {BAR_HEIGHTS.map((height, index) => {
            const active = index === activeBar;
            return (
              <View
                key={index}
                style={[
                  styles.bar,
                  {
                    height,
                    left:
                      KNOB_SIZE / 2 +
                      (inner * index) / (BAR_COUNT - 1) -
                      BAR_WIDTH / 2,
                    backgroundColor: active ? accent : colors.neutral[200],
                  },
                ]}
              />
            );
          })}
        </View>

        <View style={styles.trackRow} pointerEvents="none">
          <View style={styles.track} />
          <View
            style={[
              styles.knob,
              { left: ratio * inner, borderColor: colors.background.canvas },
            ]}
          >
            <View style={[styles.knobFace, { backgroundColor: accent }]} />
          </View>
        </View>
      </View>

      {minLabel || maxLabel ? (
        <View style={styles.endLabels}>
          <Text style={styles.endLabel}>{minLabel}</Text>
          <Text style={[styles.endLabel, styles.endLabelRight]}>{maxLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    // Spaced by their own margins rather than one shared gap: the readout sits
    // right on top of the scale it belongs to, and the end labels hang a little
    // further below the track so they read as a caption for it.
    gap: 0,
    alignItems: 'stretch',
    // clears the question above it — Mochi's bubble runs to three lines on the
    // longer ones, and the readout used to crowd it
    marginTop: spacing.xl,
  },
  readout: {
    marginBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  value: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 64,
    lineHeight: 70,
    letterSpacing: -1,
  },
  unit: {
    ...typography.body.large,
    color: colors.text.secondary,
  },
  slider: {
    // the bar field, then the track the knob rides on
    height: BAR_MAX_HEIGHT + spacing.sm + KNOB_SIZE,
    justifyContent: 'flex-end',
  },
  bars: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: BAR_MAX_HEIGHT,
  },
  // Grown from the bottom edge, so the field's baseline stays put while the
  // valley moves.
  bar: {
    position: 'absolute',
    bottom: 0,
    width: BAR_WIDTH,
    borderRadius: BAR_WIDTH / 2,
  },
  trackRow: {
    height: KNOB_SIZE,
    justifyContent: 'center',
  },
  track: {
    marginHorizontal: KNOB_SIZE / 2,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.neutral[200],
  },
  knob: {
    position: 'absolute',
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    borderWidth: KNOB_RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endLabels: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  endLabel: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 15,
    lineHeight: 20,
    color: colors.text.primary,
    flex: 1,
  },
  endLabelRight: {
    textAlign: 'right',
  },
  knobFace: {
    flex: 1,
    alignSelf: 'stretch',
    borderRadius: KNOB_SIZE / 2,
  },
});
