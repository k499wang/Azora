import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, InteractionManager, StyleSheet, Text, View } from 'react-native';
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
  Easing as RNREasing,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { computeAgeGap, ageScore, type AgeGap } from '../../lib/lungAge';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BiologicalAgeRingProps {
  lungAge: number;
  userAge: number | null;
  size?: number;
  onAnimationComplete?: () => void;
  /** Override the caption above the number. Defaults to "Lung Age". */
  caption?: string;
  /** Override the number displayed (e.g. breath count). Defaults to lungAge. */
  displayValue?: number;
  /** Override the arc fill ratio (0–1). Defaults to ageScore(lungAge). */
  score?: number;
  /** Override the sweep gradient colors. Defaults to gap.ringColors. */
  ringColors?: string[];
  /** Override the gap label text. Pass null to hide the gap row entirely. */
  gapLabel?: string | null;
  /** Override the gap label text color. */
  gapTextColor?: string;
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function BiologicalAgeRing({
  lungAge,
  userAge,
  size = DEFAULT_SIZE,
  onAnimationComplete,
  caption = 'Lung Age',
  displayValue,
  score: scoreOverride,
  ringColors: ringColorsOverride,
  gapLabel: gapLabelOverride,
  gapTextColor: gapTextColorOverride,
}: BiologicalAgeRingProps) {
  const gap = useMemo(() => computeAgeGap(lungAge, userAge), [lungAge, userAge]);
  const targetScore = useMemo(() => ageScore(lungAge), [lungAge]);
  const resolvedScore = scoreOverride ?? targetScore;
  const baseRingColors = ringColorsOverride ?? gap.ringColors;
  // Single uniform color across the whole ring (the primary tone).
  const arcColor = baseRingColors[0];
  const resolvedGapLabel = gapLabelOverride !== undefined ? gapLabelOverride : gap.label;
  const resolvedGapTextColor = gapTextColorOverride ?? gap.textColor;
  const countUpTarget = displayValue ?? lungAge;
  const [displayedAge, setDisplayedAge] = useState(COUNT_START);
  const [revealComplete, setRevealComplete] = useState(false);
  const [entranceComplete, setEntranceComplete] = useState(false);
  const didMountRef = useRef(false);

  // ── Entrance animation refs ────────────────────────────────────────────

  const entranceScale = useRef(new Animated.Value(0.92)).current;
  const entranceOpacity = useRef(new Animated.Value(0)).current;

  // ── Ring settle animation ref (gentle scale pop on reveal) ───────────

  const settleScale = useRef(new Animated.Value(1)).current;

  // ── Count-up animation ref ─────────────────────────────────────────────

  const countUpAnim = useRef(new Animated.Value(0)).current;

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

  // ── Animated arc (reanimated for 60fps) ────────────────────────────────

  const arcProgress = useSharedValue(0);

  const arcPath = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const ratio = Math.max(0, Math.min(1, arcProgress.value));
    if (ratio >= 0.999) {
      p.addCircle(cx, cy, r);
    } else if (ratio > 0) {
      p.addArc(arcRect, -90, 360 * ratio);
    }
    return p;
  });

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

  // ── Arc sweep (starts after entrance completes) ────────────────────────

  useEffect(() => {
    if (!entranceComplete) return;
    arcProgress.value = withTiming(resolvedScore, {
      duration: ARC_DURATION_MS,
      easing: RNREasing.inOut(RNREasing.cubic),
    });
  }, [entranceComplete, resolvedScore, arcProgress]);

  // ── Count-up animation (starts after entrance completes) ───────────────

  useEffect(() => {
    if (!entranceComplete) return;

    countUpAnim.setValue(0);
    setDisplayedAge(COUNT_START);
    setRevealComplete(false);

    const listenerId = countUpAnim.addListener(({ value }) => {
      const current = COUNT_START + Math.round(value * (countUpTarget - COUNT_START));
      setDisplayedAge(current);
    });

    Animated.timing(countUpAnim, {
      toValue: 1,
      duration: ARC_DURATION_MS,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished) return;
      setDisplayedAge(countUpTarget);
      setRevealComplete(true);
      onAnimationComplete?.();
    });

    return () => {
      countUpAnim.removeListener(listenerId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entranceComplete, countUpTarget]);

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
            {/* Colored arc — slightly wider to prevent AA bleed from track */}
            <Path
              path={arcPath}
              style="stroke"
              strokeWidth={STROKE + 0.5}
              strokeCap="round"
              color={arcColor}
            />
            {/* Glossy highlight skimming the top of the arc */}
            <Path
              path={arcPath}
              style="stroke"
              strokeWidth={STROKE * 0.32}
              strokeCap="round"
              color="rgba(255,255,255,0.28)"
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

          {/* Center content */}
          <View style={styles.ringCenter} pointerEvents="none">
            <Text style={styles.caption}>{caption}</Text>
            <Text style={styles.ageValue}>{displayedAge}</Text>
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
          {resolvedGapLabel !== '' && gap.direction === 'younger' && (
            <View style={[styles.gapBadge, { backgroundColor: colors.success[100] }]}>
              <View style={[styles.gapDot, { backgroundColor: colors.success[500] }]} />
            </View>
          )}
          {resolvedGapLabel !== '' && gap.direction === 'older' && (
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
  caption: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    fontFamily: fonts.semibold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  ageValue: {
    ...typography.display.display1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 84,
    lineHeight: 90,
    color: colors.text.primary,
    marginTop: 2,
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
