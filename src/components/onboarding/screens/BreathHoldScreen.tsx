import { Text } from '../../common/Text';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Canvas,
  Circle,
  Path,
  Skia,
} from '@shopify/react-native-skia';
import {
  Easing as RNREasing,
  cancelAnimation,
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Icon from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import {
  azoraTierMeta,
  estimateAzoraScore,
  type AzoraTierKey,
} from '../../../lib/azoraScore';
import { benchmarkBreathHold } from '../../../lib/breathHoldPercentile';
import {
  estimateLungAge,
  lungAgeGaugeFill,
  MAX_LUNG_AGE,
  MIN_LUNG_AGE,
} from '../../../lib/lungAge';
import { calibrationDurationMs } from '../../../lib/gaugeCalibration';
import type { OnboardingBreathHoldResult } from '../types';

interface BreathHoldScreenProps {
  age: number;
  stepIndex: number;
  stepCount: number;
  onContinue: (result: OnboardingBreathHoldResult) => void;
  onBack: () => void;
  onSkip?: () => void;
}

type Phase =
  | 'intro'
  | 'inhale'
  | 'hold'
  | 'earlyStop'
  | 'calibrating'
  | 'done';

interface ScoredHold extends OnboardingBreathHoldResult {
  tier: AzoraTierKey;
  lungAgeYears: number;
  percentile: number;
  topPercent: number;
  benchmarkLabel: string;
}

const INHALE_SECONDS = 4;
const MIN_SCORABLE_HOLD_MS = 1000;
const CIRCLE_SIZE = 260;
const CIRCLE_MIN_SCALE = 0.5;

const GAUGE_SIZE = 250;
const GAUGE_STROKE = 12;
const GAUGE_CX = GAUGE_SIZE / 2;
const GAUGE_CY = GAUGE_SIZE / 2;
const GAUGE_R = GAUGE_SIZE / 2 - GAUGE_STROKE / 2 - 8;
const GAUGE_START = 135;
const GAUGE_SWEEP = 270;
const GAUGE_TICK_INNER = GAUGE_R - GAUGE_STROKE / 2 - 6;
const GAUGE_TICK_OUTER = GAUGE_R - GAUGE_STROKE / 2 - 2;
const GAUGE_INNER_R = GAUGE_R - GAUGE_STROKE / 2 - 14;

function gaugeTickPath(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const p = Skia.Path.Make();
  p.moveTo(GAUGE_CX + GAUGE_TICK_INNER * cos, GAUGE_CY + GAUGE_TICK_INNER * sin);
  p.lineTo(GAUGE_CX + GAUGE_TICK_OUTER * cos, GAUGE_CY + GAUGE_TICK_OUTER * sin);
  return p;
}

const GAUGE_RECT = Skia.XYWHRect(
  GAUGE_CX - GAUGE_R,
  GAUGE_CY - GAUGE_R,
  GAUGE_R * 2,
  GAUGE_R * 2,
);

const GAUGE_TRACK_PATH = (() => {
  const p = Skia.Path.Make();
  p.addArc(GAUGE_RECT, GAUGE_START, GAUGE_SWEEP);
  return p;
})();

const GAUGE_TICK_PATHS = [0, 25, 50, 75, 100].map((t) =>
  gaugeTickPath(GAUGE_START + (t / 100) * GAUGE_SWEEP),
);

function formatHold(seconds: number): string {
  const total = Math.floor(Math.max(0, seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function ordinal(value: number): string {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

function scoreHold(holdSeconds: number, age: number): ScoredHold {
  const estimate = estimateAzoraScore({ holdSeconds });
  const benchmark = benchmarkBreathHold(holdSeconds, age);
  return {
    holdSeconds: Math.round(holdSeconds * 10) / 10,
    score: estimate.score,
    tier: estimate.key,
    lungAgeYears: estimateLungAge(holdSeconds, age).years,
    percentile: benchmark.percentile,
    topPercent: benchmark.topPercent,
    benchmarkLabel: benchmark.label,
  };
}

export default function BreathHoldScreen({
  age,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
  onSkip,
}: BreathHoldScreenProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [inhaleRemaining, setInhaleRemaining] = useState(INHALE_SECONDS);
  const [holdSec, setHoldSec] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [result, setResult] = useState<ScoredHold | null>(null);

  const scale = useRef(new Animated.Value(CIRCLE_MIN_SCALE)).current;
  const inhaleEnter = useRef(new Animated.Value(0)).current;
  const doneEnter = useRef(new Animated.Value(0)).current;
  const holdStartRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const releaseHandledRef = useRef(false);
  const [displayedLungAge, setDisplayedLungAge] = useState(MIN_LUNG_AGE);

  const arcProgress = useSharedValue(0);
  const arcPath = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const ratio = Math.max(0, Math.min(1, arcProgress.value / 100));
    if (ratio > 0) {
      p.addArc(GAUGE_RECT, GAUGE_START, GAUGE_SWEEP * ratio);
    }
    return p;
  });

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      scale.stopAnimation();
      inhaleEnter.stopAnimation();
      doneEnter.stopAnimation();
      cancelAnimation(arcProgress);
    };
  }, [arcProgress, doneEnter, inhaleEnter, scale]);

  useEffect(() => {
    if (phase !== 'inhale') return;
    inhaleEnter.setValue(0);
    Animated.timing(inhaleEnter, {
      toValue: 1,
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [phase, inhaleEnter]);

  useEffect(() => {
    if (phase !== 'inhale') return;
    setInhaleRemaining(INHALE_SECONDS);
    scale.setValue(CIRCLE_MIN_SCALE);

    Animated.timing(scale, {
      toValue: 1,
      duration: INHALE_SECONDS * 1000,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const startedAt = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const remaining = Math.max(0, INHALE_SECONDS - elapsed);
      const next = Math.ceil(remaining);
      setInhaleRemaining((prev) => {
        if (next !== prev && next > 0 && isHapticsEnabled()) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        return next;
      });
      if (elapsed >= INHALE_SECONDS) {
        clearInterval(interval);
        if (isHapticsEnabled()) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        }
        setPhase('hold');
      }
    }, 100);

    return () => clearInterval(interval);
  }, [phase, scale]);

  useEffect(() => {
    if (phase !== 'hold') return;
    releaseHandledRef.current = false;
    setIsHolding(true);
    setHoldSec(0);
    holdStartRef.current = Date.now();
    const interval = setInterval(() => {
      const started = holdStartRef.current ?? Date.now();
      setHoldSec((Date.now() - started) / 1000);
    }, 100);
    tickRef.current = interval;
    return () => {
      clearInterval(interval);
      if (tickRef.current === interval) tickRef.current = null;
    };
  }, [phase]);

  const handleHoldRelease = () => {
    if (
      phase !== 'hold' ||
      !isHolding ||
      releaseHandledRef.current
    ) {
      return;
    }
    releaseHandledRef.current = true;
    setIsHolding(false);
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    const started = holdStartRef.current ?? Date.now();
    const elapsedMs = Date.now() - started;
    setHoldSec(elapsedMs / 1000);

    if (elapsedMs < MIN_SCORABLE_HOLD_MS) {
      setResult(null);
      setPhase('earlyStop');
      return;
    }

    const seconds = elapsedMs / 1000;
    const scored = scoreHold(seconds, age);
    setResult(scored);
    if (isHapticsEnabled()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    }
    setPhase('calibrating');
  };

  const restartHoldTest = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    releaseHandledRef.current = false;
    holdStartRef.current = null;
    setInhaleRemaining(INHALE_SECONDS);
    setHoldSec(0);
    setIsHolding(false);
    setResult(null);
    setDisplayedLungAge(MIN_LUNG_AGE);

    scale.stopAnimation();
    inhaleEnter.stopAnimation();
    doneEnter.stopAnimation();
    scale.setValue(CIRCLE_MIN_SCALE);
    inhaleEnter.setValue(0);
    doneEnter.setValue(0);
    cancelAnimation(arcProgress);
    arcProgress.value = lungAgeGaugeFill(MIN_LUNG_AGE);
    setPhase('inhale');
  }, [arcProgress, doneEnter, inhaleEnter, scale]);

  // The counter reads off the same shared value as the ring, so both stay on the
  // UI thread and React only re-renders when the whole year changes.
  useAnimatedReaction(
    () =>
      Math.round(
        MIN_LUNG_AGE + (arcProgress.value / 100) * (MAX_LUNG_AGE - MIN_LUNG_AGE),
      ),
    (years, previous) => {
      if (years !== previous) {
        runOnJS(setDisplayedLungAge)(years);
      }
    },
  );

  const finishCalibration = useCallback(() => {
    doneEnter.setValue(0);
    setPhase('done');
    Animated.timing(doneEnter, {
      toValue: 1,
      duration: 460,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    if (isHapticsEnabled()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    }
  }, [doneEnter]);

  useEffect(() => {
    if (phase !== 'calibrating' || !result) return;
    // Always reveal from the gauge's low endpoint so younger results never
    // make the arc retract from the user's chronological age.
    const fromFill = lungAgeGaugeFill(MIN_LUNG_AGE);
    const toFill = lungAgeGaugeFill(result.lungAgeYears);
    arcProgress.value = fromFill;
    arcProgress.value = withTiming(
      toFill,
      {
        duration: calibrationDurationMs(fromFill, toFill),
        easing: RNREasing.inOut(RNREasing.quad),
      },
      (finished) => {
        if (finished) runOnJS(finishCalibration)();
      },
    );

    return () => cancelAnimation(arcProgress);
  }, [phase, result, arcProgress, finishCalibration]);

  if (phase === 'inhale' || phase === 'hold') {
    const isInhale = phase === 'inhale';

    const inhaleEntryStyle = isInhale
      ? {
          opacity: inhaleEnter,
          transform: [
            {
              translateY: inhaleEnter.interpolate({
                inputRange: [0, 1],
                outputRange: [40, 0],
              }),
            },
          ],
        }
      : null;

    return (
      <View style={styles.fullScreen}>
        <Animated.View style={[styles.fullCenter, inhaleEntryStyle]}>
          <View style={styles.headingSlot}>
            <Text style={styles.phaseHeading}>
              {isInhale ? 'Breathe in' : 'Hold your breath'}
            </Text>
          </View>
          <View style={styles.phaseDetailSlot}>
            {isInhale ? (
              <Text style={styles.phaseSub}>Hold when the circle is full.</Text>
            ) : (
              <Text style={styles.bigTimer}>{formatHold(holdSec)}</Text>
            )}
          </View>

          <View style={styles.circleWrap}>
            <Animated.View
              style={[
                styles.circle,
                styles.circleInhale,
                { transform: [{ scale }] },
              ]}
            />
            <View style={styles.circleContent} pointerEvents="none">
              {isInhale ? (
                <Text style={styles.countdown}>{inhaleRemaining}</Text>
              ) : (
                <View style={styles.releaseTarget}>
                  <MaterialCommunityIcons
                    name="fingerprint"
                    size={72}
                    color={colors.primary.blue700}
                  />
                  <Text style={styles.releaseLabel}>
                    Tap when you need{'\n'}to breathe
                  </Text>
                </View>
              )}
            </View>

            {isHolding ? (
              <Pressable
                style={styles.holdTarget}
                onPress={handleHoldRelease}
                accessibilityRole="button"
                accessibilityLabel="End breath hold"
              />
            ) : null}
          </View>
        </Animated.View>
      </View>
    );
  }

  if (phase === 'earlyStop') {
    return (
      <OnboardingScreenLayout
        title=""
        progress={stepIndex / stepCount}
        onBack={onBack}
        footer={
          <View style={styles.introFooter}>
            <OnboardingPrimaryButton
              label="Try again"
              onPress={restartHoldTest}
            />
            {onSkip ? (
              <Pressable
                accessibilityRole="button"
                onPress={onSkip}
                style={({ pressed }) => [
                  styles.skip,
                  pressed && styles.skipPressed,
                ]}
              >
                <Text style={styles.skipText}>Skip for now</Text>
              </Pressable>
            ) : null}
          </View>
        }
      >
        <View style={styles.earlyStopStage}>
          <Text style={styles.earlyStopHeading}>
            That was too quick to estimate.
          </Text>
          <Text style={styles.earlyStopBody}>
            No problem. Take a normal breath, then try again when you’re ready.
          </Text>
        </View>
      </OnboardingScreenLayout>
    );
  }

  if ((phase === 'calibrating' || phase === 'done') && result) {
    const isCalibrating = phase === 'calibrating';
    const scoreColor = azoraTierMeta(result.tier).textColor;
    const percentile = result.percentile;
    const markerPercent = Math.max(2, Math.min(98, percentile));
    const peerCopy = `You are in the top ${result.topPercent}% of people your age.`;

    const revealStyle = {
      opacity: doneEnter,
      transform: [
        {
          translateY: doneEnter.interpolate({
            inputRange: [0, 1],
            outputRange: [12, 0],
          }),
        },
      ],
    };

    return (
      <OnboardingScreenLayout
        title=""
        progress={stepIndex / stepCount}
        hideProgress
        footer={
          isCalibrating ? (
            <View />
          ) : (
            <View style={styles.introFooter}>
              <OnboardingPrimaryButton
                label="Continue"
                onPress={() =>
                  onContinue({
                    holdSeconds: result.holdSeconds,
                    score: result.score,
                  })
                }
              />
              <Pressable
                accessibilityRole="button"
                onPress={restartHoldTest}
                style={({ pressed }) => [
                  styles.skip,
                  pressed && styles.skipPressed,
                ]}
              >
                <Text style={styles.skipText}>Retake</Text>
              </Pressable>
            </View>
          )
        }
      >
        <View style={styles.gaugeStage}>
          <Text accessibilityRole="header" style={styles.gaugeHeading}>
            {isCalibrating ? 'Calibrating…' : 'Your lung age'}
          </Text>
          <Text style={styles.gaugeSub}>
            {isCalibrating ? 'Analyzing your hold.' : peerCopy}
          </Text>

          <View style={styles.gaugeSurface}>
            <Canvas style={StyleSheet.absoluteFill}>
              <Path
                path={GAUGE_TRACK_PATH}
                style="stroke"
                strokeWidth={GAUGE_STROKE}
                strokeCap="round"
                color={colors.neutral[100]}
              />
              <Path
                path={arcPath}
                style="stroke"
                strokeWidth={GAUGE_STROKE}
                strokeCap="round"
                color={scoreColor}
              />
              {GAUGE_TICK_PATHS.map((p, i) => (
                <Path
                  key={i}
                  path={p}
                  style="stroke"
                  strokeWidth={1.5}
                  strokeCap="round"
                  color={colors.neutral[200]}
                />
              ))}
              <Circle
                cx={GAUGE_CX}
                cy={GAUGE_CY + 3}
                r={GAUGE_INNER_R + 3}
                color="rgba(15,23,42,0.04)"
              />
              <Circle
                cx={GAUGE_CX}
                cy={GAUGE_CY + 1.5}
                r={GAUGE_INNER_R + 1.5}
                color="rgba(15,23,42,0.02)"
              />
              <Circle
                cx={GAUGE_CX}
                cy={GAUGE_CY}
                r={GAUGE_INNER_R + 1}
                color={colors.neutral[200]}
              />
              <Circle
                cx={GAUGE_CX}
                cy={GAUGE_CY}
                r={GAUGE_INNER_R}
                color={colors.background.elevated}
              />
            </Canvas>

            <View style={styles.gaugeCenter} pointerEvents="none">
              <View style={styles.gaugeValueRow}>
                <Text style={styles.gaugeValue}>{displayedLungAge}</Text>
                <Text style={styles.gaugeValueMax}>years</Text>
              </View>
            </View>
          </View>

          {!isCalibrating ? (
            <Animated.View style={[styles.gaugeMeta, revealStyle]}>
              <View
                style={styles.percentileRailWrap}
                accessible
                accessibilityRole="image"
                accessibilityLabel={`You are in the top ${result.topPercent}% of people your age. Your result is at the estimated ${ordinal(percentile)} percentile. The median is the 50th percentile.`}
              >
                <View style={styles.percentileTrack}>
                  <View
                    style={[styles.percentileFill, { width: `${percentile}%` }]}
                  />
                  <View style={styles.medianTick} />
                  <View
                    style={[styles.youMarker, { left: `${markerPercent}%` }]}
                  >
                    <Text style={styles.youMarkerLabel}>You</Text>
                    <View style={styles.youMarkerLine} />
                  </View>
                </View>
                <View style={styles.percentileLabels}>
                  <Text style={[styles.percentileLabel, styles.percentileLabelStart]}>
                    0
                  </Text>
                  <Text style={[styles.percentileLabel, styles.percentileLabelCenter]}>
                    Median
                  </Text>
                  <Text style={[styles.percentileLabel, styles.percentileLabelEnd]}>
                    100
                  </Text>
                </View>
              </View>
              <Text style={styles.resultReassurance}>
                We’ll explain what this means—and how you can improve it—as you
                try the exercises in the app.
              </Text>
            </Animated.View>
          ) : null}
        </View>
      </OnboardingScreenLayout>
    );
  }

  return (
    <OnboardingScreenLayout
      title=""
      progress={stepIndex / stepCount}
      onBack={onBack}
      onSkip={onSkip}
      footer={
        <View style={styles.introFooter}>
          <OnboardingPrimaryButton
            label="Start"
            onPress={() => setPhase('inhale')}
          />
          {onSkip ? (
            <Pressable
              accessibilityRole="button"
              onPress={onSkip}
              style={({ pressed }) => [
                styles.skip,
                pressed && styles.skipPressed,
              ]}
            >
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
          ) : null}
        </View>
      }
    >
      <View style={styles.introStage}>
        <View style={styles.lungIcon}>
          <Icon name="lungs" size={140} color={colors.primary.blue600} />
        </View>
        <View style={styles.introCopy}>
          <Text style={styles.introHeadline}>
            Let&apos;s estimate your{'\n'}lung age.
          </Text>
          <Text style={styles.introSub}>
            Take one deep breath. Hold until you need to breathe, then tap to end.
          </Text>
        </View>

      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  introFooter: {
    gap: spacing.sm,
  },
  introStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['2xl'],
    paddingBottom: spacing['2xl'],
  },
  lungIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  introCopy: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  introHeadline: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.6,
    color: colors.text.primary,
    textAlign: 'center',
  },
  introSub: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  skip: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  skipPressed: {
    opacity: 0.6,
  },
  skipText: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  earlyStopStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  earlyStopHeading: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
    textAlign: 'center',
  },
  earlyStopBody: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  fullScreen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  fullCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  headingSlot: {
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseHeading: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
    color: colors.text.primary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  phaseDetailSlot: {
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigTimer: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 64,
    lineHeight: 72,
    color: colors.primary.blue700,
    textAlign: 'center',
  },
  phaseSub: {
    ...typography.body.large,
    fontSize: 18,
    lineHeight: 26,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  circleWrap: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing['2xl'],
  },
  circle: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
  },
  circleInhale: {
    backgroundColor: colors.primary.blue100,
    borderWidth: 2,
    borderColor: colors.primary.blue500,
  },
  circleContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  releaseTarget: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  releaseLabel: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 18,
    lineHeight: 24,
    color: colors.primary.blue700,
    textAlign: 'center',
  },
  countdown: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 56,
    lineHeight: 64,
    color: colors.primary.blue700,
  },
  holdTarget: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CIRCLE_SIZE / 2,
  },

  gaugeStage: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  gaugeHeading: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  gaugeSub: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.primary.blue600,
    textAlign: 'center',
    marginTop: -spacing.sm,
  },
  gaugeSurface: {
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    borderRadius: GAUGE_SIZE / 2,
    position: 'relative',
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    shadowColor: colors.neutral[900],
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },
  gaugeCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeValueRow: {
    alignItems: 'center',
  },
  gaugeValue: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 76,
    lineHeight: 80,
    letterSpacing: -1.5,
    color: colors.text.primary,
  },
  gaugeValueMax: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.tertiary,
    letterSpacing: -0.2,
    marginTop: -spacing.xs,
  },
  gaugeMeta: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.sm,
  },
  percentileRailWrap: {
    width: '100%',
    maxWidth: 300,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
  percentileTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neutral[200],
    position: 'relative',
  },
  percentileFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary.blue500,
  },
  medianTick: {
    position: 'absolute',
    left: '50%',
    top: -3,
    width: 2,
    height: 14,
    borderRadius: 1,
    backgroundColor: colors.neutral[500],
  },
  youMarker: {
    position: 'absolute',
    top: -21,
    width: 40,
    marginLeft: -20,
    alignItems: 'center',
  },
  youMarkerLabel: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    color: colors.primary.blue700,
    lineHeight: 14,
    textAlign: 'center',
  },
  youMarkerLine: {
    width: 3,
    height: 18,
    marginTop: 2,
    borderRadius: 1.5,
    backgroundColor: colors.primary.blue600,
  },
  percentileLabels: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  percentileLabel: {
    ...typography.caption.caption2,
    color: colors.text.tertiary,
    flex: 1,
  },
  percentileLabelStart: {
    textAlign: 'left',
  },
  percentileLabelCenter: {
    textAlign: 'center',
  },
  percentileLabelEnd: {
    textAlign: 'right',
  },
  resultReassurance: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
