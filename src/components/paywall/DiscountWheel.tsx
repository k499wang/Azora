import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';
import {
  randomLandingOffset,
  resolveTargetRotation,
  segmentSweepAngle,
  type WheelSegment,
} from '../../lib/paywall/discountWheel';
import { colors } from '../../theme/colors';
import { fonts, typography } from '../../theme/typography';

/**
 * Imperative handle so the parent owns the trigger (its own CTA button)
 * while the wheel owns the spin animation. Keeps the wheel decoupled
 * from whatever surface hosts it (exit offer, delayed paywall, etc.).
 */
export interface DiscountWheelHandle {
  spin: () => void;
}

interface DiscountWheelProps {
  segments: WheelSegment[];
  /** Rigged outcome: the segment the wheel always lands on. */
  winningSegmentId: string;
  size?: number;
  /** Whole turns before settling. Higher = longer, more dramatic spin. */
  fullTurns?: number;
  spinDurationMs?: number;
  /** Per-segment fill colors. Falls back to the alternating default. */
  segmentColors?: string[];
  onSpinStart?: () => void;
  onSpinComplete?: (segment: WheelSegment) => void;
}

const DEFAULT_SIZE = 280;
const DEFAULT_FULL_TURNS = 6;
const DEFAULT_SPIN_MS = 5200;

// Tonal ramp of a single hue — reads premium rather than carnival. Hairline
// dividers keep adjacent shades legible.
const DEFAULT_PALETTE = [
  colors.primary.blue900,
  colors.primary.blue800,
  colors.primary.blue700,
  colors.primary.blue600,
  colors.primary.blue500,
  colors.primary.blue400,
];

const DIVIDER_OPACITY = 0.12;

// Minimum gap between tick haptics. The iOS engine coalesces impacts fired
// faster than this anyway; throttling keeps the early (fast) part of the spin
// from flooding the JS thread while the slowing tail still ticks cleanly.
const MIN_TICK_INTERVAL_MS = 35;

const SKIA_TOP_OFFSET = -90; // Skia 0deg sits at 3 o'clock; shift to the top.

function DiscountWheelInner(
  {
    segments,
    winningSegmentId,
    size = DEFAULT_SIZE,
    fullTurns = DEFAULT_FULL_TURNS,
    spinDurationMs = DEFAULT_SPIN_MS,
    segmentColors,
    onSpinStart,
    onSpinComplete,
  }: DiscountWheelProps,
  ref: React.Ref<DiscountWheelHandle>,
) {
  const rotation = useSharedValue(0);
  const isSpinning = useRef(false);

  const count = segments.length;
  const sweep = count > 0 ? segmentSweepAngle(count) : 0;
  const radius = size / 2;

  const wedges = useMemo(
    () => buildWedges(segments, radius, sweep, segmentColors),
    [segments, radius, sweep, segmentColors],
  );
  const lastTickAt = useRef(0);
  const tick = useCallback(() => {
    if (!isHapticsEnabled()) return;
    const now = Date.now();
    if (now - lastTickAt.current < MIN_TICK_INTERVAL_MS) return;
    lastTickAt.current = now;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  // Fire a tick each time a segment boundary passes under the pointer. Runs on
  // the UI thread off the live rotation, so ticks stay in sync with the visual
  // spin and naturally space out as the quartic ease decelerates.
  useAnimatedReaction(
    () => (sweep > 0 ? Math.floor(rotation.value / sweep) : 0),
    (current, previous) => {
      if (previous !== null && current !== previous) {
        runOnJS(tick)();
      }
    },
  );

  const handleComplete = useCallback(() => {
    isSpinning.current = false;
    if (isHapticsEnabled()) {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
    }
    const winner = segments.find((s) => s.id === winningSegmentId);
    if (winner) onSpinComplete?.(winner);
  }, [segments, winningSegmentId, onSpinComplete]);

  const spin = useCallback(() => {
    if (isSpinning.current || count === 0) return;
    const winningIndex = segments.findIndex((s) => s.id === winningSegmentId);
    if (winningIndex < 0) return;

    isSpinning.current = true;
    if (isHapticsEnabled()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    onSpinStart?.();

    const target = resolveTargetRotation({
      winningIndex,
      segmentCount: count,
      currentRotation: rotation.value,
      fullTurns,
      landingOffset: randomLandingOffset(),
    });

    rotation.value = withTiming(
      target,
      { duration: spinDurationMs, easing: Easing.out(Easing.poly(4)) },
      (finished) => {
        if (finished) runOnJS(handleComplete)();
      },
    );
  }, [
    count,
    segments,
    winningSegmentId,
    rotation,
    fullTurns,
    spinDurationMs,
    onSpinStart,
    handleComplete,
  ]);

  useImperativeHandle(ref, () => ({ spin }), [spin]);

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={[styles.root, { width: size, height: size }]}>
      <View
        style={[styles.elevation, { borderRadius: radius }]}
        pointerEvents="none"
      />
      <Animated.View style={[StyleSheet.absoluteFill, wheelStyle]}>
        <Canvas style={StyleSheet.absoluteFill}>
          {wedges.map((wedge) => (
            <Path key={wedge.id} path={wedge.path} color={wedge.color} />
          ))}
          {wedges.map((wedge) => (
            <Path
              key={`divider-${wedge.id}`}
              path={wedge.path}
              style="stroke"
              strokeWidth={1}
              color={colors.neutral[0]}
              opacity={DIVIDER_OPACITY}
            />
          ))}
        </Canvas>
        {segments.map((segment, index) => (
          <SegmentLabel
            key={segment.id}
            label={segment.label}
            angle={SKIA_TOP_OFFSET + (index + 0.5) * sweep}
            radius={radius}
          />
        ))}
      </Animated.View>

      <View style={[styles.rim, { borderRadius: radius }]} pointerEvents="none" />

      <View style={styles.hub} pointerEvents="none">
        <View style={styles.hubDot} />
      </View>
      <Pointer color={colors.yellow[500]} />
    </View>
  );
}

export const DiscountWheel = forwardRef(DiscountWheelInner);

interface Wedge {
  id: string;
  path: ReturnType<typeof Skia.Path.Make>;
  color: string;
}

function buildWedges(
  segments: WheelSegment[],
  radius: number,
  sweep: number,
  segmentColors?: string[],
): Wedge[] {
  const oval = Skia.XYWHRect(0, 0, radius * 2, radius * 2);
  return segments.map((segment, index) => {
    const path = Skia.Path.Make();
    path.moveTo(radius, radius);
    path.arcToOval(oval, SKIA_TOP_OFFSET + index * sweep, sweep, false);
    path.close();
    return {
      id: segment.id,
      path,
      color:
        segmentColors?.[index] ??
        DEFAULT_PALETTE[index % DEFAULT_PALETTE.length],
    };
  });
}

interface SegmentLabelProps {
  label: string;
  angle: number;
  radius: number;
}

function SegmentLabel({ label, angle, radius }: SegmentLabelProps) {
  const rad = (angle * Math.PI) / 180;
  const distance = radius * 0.62;
  const x = radius + Math.cos(rad) * distance;
  const y = radius + Math.sin(rad) * distance;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.labelBox,
        {
          left: x - LABEL_WIDTH / 2,
          top: y - LABEL_HEIGHT / 2,
          transform: [{ rotate: `${angle + 90}deg` }],
        },
      ]}
    >
      <Text style={styles.labelText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function Pointer({ color }: { color: string }) {
  const path = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(POINTER_WIDTH / 2, POINTER_HEIGHT);
    p.lineTo(0, 0);
    p.lineTo(POINTER_WIDTH, 0);
    p.close();
    return p;
  }, []);

  return (
    <View style={styles.pointer} pointerEvents="none">
      <Canvas style={{ width: POINTER_WIDTH, height: POINTER_HEIGHT }}>
        <Path path={path} color={color} />
      </Canvas>
    </View>
  );
}

const LABEL_WIDTH = 84;
const LABEL_HEIGHT = 28;
const POINTER_WIDTH = 26;
const POINTER_HEIGHT = 22;
const HUB_SIZE = 44;
const HUB_DOT_SIZE = 14;

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Sits behind the wedges purely to cast a soft, circular drop shadow so the
  // wheel reads as a raised disc rather than a flat graphic.
  elevation: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.neutral[0],
    shadowColor: colors.glass.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 10,
  },
  // Crisp white bezel framing the wedges, drawn on top of the rotating layer.
  rim: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 6,
    borderColor: colors.neutral[0],
  },
  labelBox: {
    position: 'absolute',
    width: LABEL_WIDTH,
    height: LABEL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.neutral[0],
  },
  hub: {
    position: 'absolute',
    width: HUB_SIZE,
    height: HUB_SIZE,
    borderRadius: HUB_SIZE / 2,
    backgroundColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.glass.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 4,
  },
  hubDot: {
    width: HUB_DOT_SIZE,
    height: HUB_DOT_SIZE,
    borderRadius: HUB_DOT_SIZE / 2,
    backgroundColor: colors.yellow[500],
  },
  pointer: {
    position: 'absolute',
    top: -POINTER_HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.glass.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
