import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, type DimensionValue, Easing, InteractionManager, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Canvas,
  Circle,
  LinearGradient,
  Path,
  RadialGradient,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import {
  cancelAnimation,
  Easing as RNREasing,
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import Icon from '../common/icons/Icon';
// ─── Types ────────────────────────────────────────────────────────────────────

interface ScoreRingProps {
  /** Number shown in the center (count-up target). */
  value: number;
  /** Arc fill ratio, 0–1. */
  fill: number;
  size?: number;
  onAnimationComplete?: () => void;
  /** Caption above the number. Defaults to "Azora Score". Pass null to hide it. */
  caption?: string | null;
  /** Override the ring color. Defaults to the brand blue. */
  ringColors?: string[];
  /** Label below the ring. Pass null to hide the row entirely. */
  gapLabel?: string | null;
  /** Color for the gap label text. */
  gapTextColor?: string;
  /** When provided, renders an info icon next to the caption. */
  onInfoPress?: () => void;
  /** Controls the colored dot beside the gap label. */
  gapDirection?: 'positive' | 'negative' | 'neutral';
  /** Render an empty/placeholder ring: no arc fill, a "–" in place of the value. */
  placeholder?: boolean;
  /** Optional colored pill rendered below the value (e.g. tier label). */
  pill?: { label: string; textColor: string; backgroundColor: string } | null;
  /** Override the center number font size. Defaults to 84. */
  valueFontSize?: number;
  /** Distance of the pill from the bottom of the ring. Defaults to '28%'. */
  pillBottom?: DimensionValue;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_SIZE = 260;
const STROKE = 16;
// Breathing room so the widest stroke + drop-shadow circles never clip the canvas edge.
const RING_PAD = 8;
const COUNT_START = 5;
const ENTRANCE_DURATION_MS = 420;
const ARC_DURATION_MS = 1100;
const SETTLE_DURATION_MS = 400;
const GAP_FADE_DURATION_MS = 500;

// ─── Count-up number ────────────────────────────────────────────────────────
// Isolated so the per-frame setState during the count-up only re-renders this
// <Text>, never the parent's Skia Canvas (which would stutter the arc sweep).

interface CountUpAgeProps {
  progress: SharedValue<number>;
  target: number;
  active: boolean;
  fontStyle?: { fontSize: number; lineHeight: number };
}

const CountUpAge = memo(function CountUpAge({ progress, target, active, fontStyle }: CountUpAgeProps) {
  const [value, setValue] = useState(COUNT_START);

  useAnimatedReaction(
    () => active
      ? COUNT_START + Math.round(progress.value * (target - COUNT_START))
      : COUNT_START,
    (next, previous) => {
      if (next !== previous) runOnJS(setValue)(next);
    },
    [active, target],
  );

  return <Text style={[styles.ageValue, fontStyle]}>{value}</Text>;
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScoreRing({
  value,
  fill,
  size = DEFAULT_SIZE,
  onAnimationComplete,
  caption = 'Azora Score',
  ringColors,
  gapLabel,
  gapTextColor,
  gapDirection = 'neutral',
  onInfoPress,
  placeholder = false,
  pill,
  valueFontSize,
  pillBottom,
}: ScoreRingProps) {
  const valueFontStyle = valueFontSize
    ? { fontSize: valueFontSize, lineHeight: Math.round(valueFontSize * 1.07) }
    : undefined;
  const resolvedScore = placeholder ? 0 : fill;
  const arcColor = ringColors?.[0] ?? colors.primary.blue500;
  const resolvedGapLabel = gapLabel ?? null;
  const resolvedGapTextColor = gapTextColor ?? colors.text.secondary;
  const countUpTarget = value;
  const [revealComplete, setRevealComplete] = useState(false);
  const [entranceComplete, setEntranceComplete] = useState(false);
  const didMountRef = useRef(false);
  const onAnimationCompleteRef = useRef(onAnimationComplete);

  useEffect(() => {
    onAnimationCompleteRef.current = onAnimationComplete;
  }, [onAnimationComplete]);

  // ── Entrance animation refs ────────────────────────────────────────────

  const entranceScale = useRef(new Animated.Value(0.92)).current;
  const entranceOpacity = useRef(new Animated.Value(0)).current;

  // ── Ring settle animation ref (gentle scale pop on reveal) ───────────

  const settleScale = useRef(new Animated.Value(1)).current;

  // ── Gap text animation refs ────────────────────────────────────────────

  const gapOpacity = useRef(new Animated.Value(0)).current;
  const gapTranslateY = useRef(new Animated.Value(8)).current;

  // ── Ring geometry ──────────────────────────────────────────────────────

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - STROKE / 2 - RING_PAD;
  const arcRect = useMemo(
    () => Skia.XYWHRect(cx - r, cy - r, r * 2, r * 2),
    [cx, cy, r],
  );

  // ── Inner disc radius (nested white circles, same pattern as StressGauge)

  const innerR = r - STROKE / 2 - 4;

  // ── Full-circle track path ─────────────────────────────────────────────

  const trackPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.addCircle(cx, cy, r);
    return p;
  }, [cx, cy, r]);

  // ── Animated arc (one static path, trimmed by a shared UI-thread clock) ─

  const revealProgress = useSharedValue(0);

  const arcPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.addArc(arcRect, -90, 360);
    return p;
  }, [arcRect]);

  const arcEnd = useDerivedValue(
    () => revealProgress.value * Math.max(0, Math.min(1, resolvedScore)),
  );

  const handleRevealComplete = useCallback(() => {
    setRevealComplete(true);
    onAnimationCompleteRef.current?.();
  }, []);

  // ── Entrance animation (runs once, after the screen transition settles) ──
  // Gated behind runAfterInteractions so the native screen slide-in completes
  // on a quiet JS/UI thread before the Skia arc + count-up start. Kicking these
  // off during the transition is what made exercise→result feel laggy.

  useEffect(() => {
    if (didMountRef.current) return;
    didMountRef.current = true;

    const handle = InteractionManager.runAfterInteractions(() => {
      Animated.parallel([
        Animated.timing(entranceScale, {
          toValue: 1,
          duration: ENTRANCE_DURATION_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(entranceOpacity, {
          toValue: 1,
          duration: ENTRANCE_DURATION_MS * 0.85,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setEntranceComplete(true);
      });
    });

    return () => handle.cancel();
    // Only run once — no deps needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Arc sweep and count-up (start together after entrance completes) ───

  useEffect(() => {
    if (!entranceComplete) return;

    revealProgress.value = 0;
    setRevealComplete(false);
    revealProgress.value = withTiming(1, {
      duration: ARC_DURATION_MS,
      easing: RNREasing.inOut(RNREasing.cubic),
    }, (finished) => {
      if (finished) runOnJS(handleRevealComplete)();
    });

    return () => cancelAnimation(revealProgress);
  }, [
    countUpTarget,
    entranceComplete,
    handleRevealComplete,
    resolvedScore,
    revealProgress,
  ]);

  // ── Ring settle animation (triggers on reveal complete) ───────────────

  useEffect(() => {
    if (!revealComplete) return;

    settleScale.setValue(1);

    Animated.sequence([
      Animated.timing(settleScale, {
        toValue: 1.03,
        duration: SETTLE_DURATION_MS * 0.4,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(settleScale, {
        toValue: 1,
        duration: SETTLE_DURATION_MS * 0.6,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [revealComplete, settleScale]);

  // ── Gap text fade-in ───────────────────────────────────────────────────

  useEffect(() => {
    if (!revealComplete) return;

    gapOpacity.setValue(0);
    gapTranslateY.setValue(8);

    Animated.parallel([
      Animated.timing(gapOpacity, {
        toValue: 1,
        duration: GAP_FADE_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(gapTranslateY, {
        toValue: 0,
        duration: GAP_FADE_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [revealComplete, gapOpacity, gapTranslateY]);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: entranceOpacity, transform: [{ scale: entranceScale }] },
      ]}
    >
      <Animated.View style={{ transform: [{ scale: settleScale }] }}>
        <View style={[styles.ringWrap, { width: size, height: size, borderRadius: size / 2 }]}>
          {/* Static layers — track, recesses, inner disc + gradients. These never
              animate, so they live in their own Canvas that paints once instead of
              being re-rasterized on every arc frame. */}
          <Canvas style={StyleSheet.absoluteFill}>
            {/* Outer recess — soft drop shadow around the whole channel */}
            <Path
              path={trackPath}
              style="stroke"
              strokeWidth={STROKE + 6}
              strokeCap="round"
              color="rgba(15,23,42,0.05)"
            />
            {/* Track — grey channel with a subtle vertical shade for depth */}
            <Path path={trackPath} style="stroke" strokeWidth={STROKE} strokeCap="round">
              <LinearGradient
                start={vec(cx, cy - r)}
                end={vec(cx, cy + r)}
                colors={[colors.neutral[200], colors.neutral[100]]}
              />
            </Path>
            {/* Inner recess shadow (carves the channel into the disc) */}
            <Path
              path={trackPath}
              style="stroke"
              strokeWidth={STROKE - 3}
              strokeCap="round"
              color="rgba(15,23,42,0.05)"
            />
            {/* Nested inner disc — layered drop shadow then a lit dome */}
            <Circle cx={cx} cy={cy + 5} r={innerR + 3} color="rgba(15,23,42,0.07)" />
            <Circle cx={cx} cy={cy + 2.5} r={innerR + 1.5} color="rgba(15,23,42,0.04)" />
            <Circle cx={cx} cy={cy} r={innerR + 1} color={colors.neutral[200]} />
            <Circle cx={cx} cy={cy} r={innerR}>
              <RadialGradient
                c={vec(cx, cy - innerR * 0.45)}
                r={innerR * 1.45}
                colors={[colors.background.elevated, colors.background.elevated, colors.neutral[50]]}
                positions={[0, 0.55, 1]}
              />
            </Circle>
          </Canvas>

          {/* Animated layer — only the colored arc + gloss repaint each frame. The
              arc sits at radius r (outside the inner disc), so stacking it above the
              static Canvas is visually identical to the original single-layer order. */}
          <Canvas style={StyleSheet.absoluteFill}>
            {/* Colored arc — slightly wider to prevent AA bleed from track */}
            <Path
              path={arcPath}
              end={arcEnd}
              style="stroke"
              strokeWidth={STROKE + 0.5}
              strokeCap="round"
              color={arcColor}
            />
            {/* Glossy highlight skimming the top of the arc */}
            <Path
              path={arcPath}
              end={arcEnd}
              style="stroke"
              strokeWidth={STROKE * 0.32}
              strokeCap="round"
              color="rgba(255,255,255,0.28)"
            />
          </Canvas>

          {/* Center content */}
          <View
            style={styles.ringCenter}
            pointerEvents={onInfoPress ? 'box-none' : 'none'}
          >
            {(caption || onInfoPress) && (
              <View style={styles.captionRow} pointerEvents="box-none">
                {caption && <Text style={styles.caption}>{caption}</Text>}
                {onInfoPress && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`About ${caption ?? 'score'}`}
                    hitSlop={10}
                    onPress={onInfoPress}
                  >
                    <Icon name="info" size={14} color={colors.text.tertiary} />
                  </Pressable>
                )}
              </View>
            )}
            {placeholder ? (
              <Text style={[styles.ageValue, valueFontStyle]}>–</Text>
            ) : (
              <CountUpAge
                progress={revealProgress}
                target={countUpTarget}
                active={entranceComplete}
                fontStyle={valueFontStyle}
              />
            )}
            {!placeholder && pill && (
              <Text
                style={[
                  styles.pillLabel,
                  { color: pill.textColor },
                  pillBottom != null && { bottom: pillBottom },
                ]}
              >
                {pill.label}
              </Text>
            )}
          </View>
        </View>
      </Animated.View>

      {/* Age gap line — fades in after reveal (hidden if gapLabel is null or empty) */}
      {resolvedGapLabel != null && resolvedGapLabel !== '' && (
        <Animated.View
          style={[
            styles.gapRow,
            {
              opacity: gapOpacity,
              transform: [{ translateY: gapTranslateY }],
            },
          ]}
        >
          {!placeholder && resolvedGapLabel !== '' && gapDirection === 'positive' && (
            <View style={[styles.gapBadge, { backgroundColor: colors.success[100] }]}>
              <View style={[styles.gapDot, { backgroundColor: colors.success[500] }]} />
            </View>
          )}
          {!placeholder && resolvedGapLabel !== '' && gapDirection === 'negative' && (
            <View style={[styles.gapBadge, { backgroundColor: colors.orange[100] }]}>
              <View style={[styles.gapDot, { backgroundColor: colors.orange[500] }]} />
            </View>
          )}
          {resolvedGapLabel !== '' && (
            <Text style={[styles.gapLabel, { color: resolvedGapTextColor }]}>
              {resolvedGapLabel}
            </Text>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  ringWrap: {
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    shadowColor: colors.neutral[900],
    shadowOpacity: 0.16,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  caption: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    fontFamily: fonts.semibold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  ageValue: {
    ...typography.display.display1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 84,
    lineHeight: 90,
    color: colors.text.secondary,
    marginTop: 2,
  },
  pillLabel: {
    position: 'absolute',
    bottom: '28%',
    alignSelf: 'center',
    ...typography.body.small,
    fontFamily: fonts.semibold,
    letterSpacing: 0.5,
  },
  gapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  gapBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gapDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  gapLabel: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
  },
});
