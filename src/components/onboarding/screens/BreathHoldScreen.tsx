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
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import BreathingCircle, {
  type BreathingCircleRef,
} from '../../../features/exercise/shared/components/BreathingCircle';
import {
  startInhaleVibration,
  stopInhaleVibration,
} from '../../../native/inhaleVibration';
import {
  DAILY_BREATH_HOLD_PROTOCOL,
  buildDailyBreathHoldPreparationPlan,
  type DailyBreathHoldPreparationPhase,
} from '../../../features/exercise/dailyBreathHold/domain/dailyBreathHoldProtocol';
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
  lungAgeFromGaugeFill,
  lungAgeGaugeFill,
  MIN_LUNG_AGE,
} from '../../../lib/lungAge';
import { calibrationDurationMs } from '../../../lib/gaugeCalibration';
import type { OnboardingBreathHoldResult } from '../types';
import { scaleVisual } from '../onboardingVisualScale';

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
  | 'leadIn'
  | 'prepare'
  | 'hold'
  | 'earlyStop'
  | 'calibrating'
  | 'done';

interface ScoredHold extends OnboardingBreathHoldResult {
  tier: AzoraTierKey;
  percentile: number;
  topPercent: number;
  benchmarkLabel: string;
}

/**
 * The measurement runs the same Protocol the daily session runs — three slow
 * rounds, then the deep breath, then the hold — rather than a bare deep breath.
 * The sequence is imported rather than restated: a baseline taken under a
 * different protocol is not comparable with the sessions it is the baseline for.
 */
const PREPARATION = buildDailyBreathHoldPreparationPlan(
  DAILY_BREATH_HOLD_PROTOCOL,
);
const FINAL_STEP_INDEX = PREPARATION.length - 1;

/**
 * The room the cue has inside the circle, once the circle's own content padding
 * is taken off it. A word that would overrun it shrinks rather than wrapping.
 */
const CUE_SLOT_WIDTH = 84;

/** seconds of "ready?" before the first cue, so it never starts under him */
const LEAD_IN_SECONDS = 3;

/** how the cue hands the circle over to the count, in milliseconds */
const CUE_FADE_MS = 220;
/** exhale hands off to 4 → 3 → 2 → 1 two seconds into its six-second step */
const EXHALE_CUE_MS = 2000;
/**
 * A count is only worth swapping to if it has seconds to spend. Below this the
 * word carries the rest of the round, which is what stops a number appearing
 * for a blink before the next cue takes it away.
 */
const COUNT_MIN_SECONDS = 1.6;

/**
 * Nothing inside the circle ever cuts: the cue and the count cross over each
 * other, and both stay mounted at zero opacity between their turns. A
 * `setValue(0)` or an unmount anywhere in here reads as a flicker.
 */
function fadeTo(value: Animated.Value, toValue: number) {
  return Animated.timing(value, {
    toValue,
    duration: CUE_FADE_MS,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  });
}

// One word each: the inner circle is 108pt across, and anything longer either
// shrinks past reading or wraps.
const STEP_CUE: Record<DailyBreathHoldPreparationPhase, string> = {
  preInhale: 'Inhale',
  preExhale: 'Exhale',
  inhale: 'Inhale',
};

const MIN_SCORABLE_HOLD_MS = 1000;

const GAUGE_SIZE = scaleVisual(250);
const GAUGE_STROKE = scaleVisual(12);
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
  const [protocolStep, setProtocolStep] = useState(0);
  /**
   * The one number in the circle, shared by the lead-in and exhale countdowns.
   *
   * Two states meant the handover between them swapped the digit under a
   * full-opacity fade — the flicker. It is written only while the count is
   * faded out, which `countLive` guards.
   */
  const [count, setCount] = useState(LEAD_IN_SECONDS);
  const countLive = useRef(true);
  /**
   * The word, as state rather than read off the current step: it has to change
   * while it is invisible, in the same gap the digit changes in.
   */
  const [cueText, setCueText] = useState(STEP_CUE.preInhale);
  const cueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holdSec, setHoldSec] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [result, setResult] = useState<ScoredHold | null>(null);

  const circleRef = useRef<BreathingCircleRef | null>(null);
  const cueEnter = useRef(new Animated.Value(0)).current;
  const countEnter = useRef(new Animated.Value(0)).current;
  const countPulse = useRef(new Animated.Value(1)).current;
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
      circleRef.current?.reset();
      stopInhaleVibration();
      inhaleEnter.stopAnimation();
      cueEnter.stopAnimation();
      countEnter.stopAnimation();
      countPulse.stopAnimation();
      doneEnter.stopAnimation();
      cancelAnimation(arcProgress);
    };
  }, [arcProgress, countEnter, countPulse, cueEnter, doneEnter, inhaleEnter]);

  useEffect(() => {
    if (phase !== 'leadIn') return;
    setCount(LEAD_IN_SECONDS);
    countLive.current = true;
    circleRef.current?.reset();
    fadeTo(countEnter, 1).start();

    // The number stays put and beats, rather than re-fading every second: three
    // fades in three seconds is a flicker, not a countdown.
    const beat = () => {
      countPulse.setValue(0.82);
      Animated.spring(countPulse, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }).start();
      if (isHapticsEnabled()) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    };

    beat();
    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          countLive.current = false;
          setPhase('prepare');
          // held at 1 rather than zeroed: the count crossfades out under the
          // first cue, and a 0 flashing on the way there is the clip itself
          return prev;
        }
        beat();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [countEnter, countPulse, cueEnter, phase]);

  useEffect(() => {
    if (phase !== 'leadIn') return;
    inhaleEnter.setValue(0);
    Animated.timing(inhaleEnter, {
      toValue: 1,
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [phase, inhaleEnter]);

  useEffect(() => {
    if (phase !== 'prepare') return;
    const step = PREPARATION[protocolStep];
    const isExhale = step.phase === 'preExhale';
    countLive.current = false;

    // Haptics reinforce each change of direction; exhale's visible countdown
    // supplies the lighter second-by-second ticks.
    if (isHapticsEnabled()) {
      Haptics.impactAsync(
        isExhale
          ? Haptics.ImpactFeedbackStyle.Soft
          : Haptics.ImpactFeedbackStyle.Medium,
      ).catch(() => {});
    }

    // The same circle the sessions breathe with, driven by the same protocol:
    // it fills on a breath in and empties on a breath out, so a round is
    // legible without reading anything.
    if (isExhale) {
      stopInhaleVibration();
      circleRef.current?.contract(step.durationSeconds);
    } else {
      // the same continuous buzz the breathing sessions rise on
      if (isHapticsEnabled()) {
        startInhaleVibration(step.durationSeconds * 1000);
      }
      circleRef.current?.expand(step.durationSeconds);
    }

    const startedAt = Date.now();
    const secondsLeft = () =>
      Math.max(
        1,
        Math.ceil(step.durationSeconds - (Date.now() - startedAt) / 1000),
      );

    // Fade out whatever the circle is showing, swap it in the dark, then fade
    // the word in. Inhale keeps its cue for the whole step; exhale hands over
    // to a count. Every value changes at zero opacity to prevent flashing.
    if (cueTimerRef.current) clearTimeout(cueTimerRef.current);
    Animated.parallel([fadeTo(cueEnter, 0), fadeTo(countEnter, 0)]).start(
      ({ finished }) => {
        if (!finished) return;
        setCueText(STEP_CUE[step.phase]);
        fadeTo(cueEnter, 1).start(({ finished: shown }) => {
          if (!shown || !isExhale) return;
          cueTimerRef.current = setTimeout(() => {
            const left =
              step.durationSeconds - (Date.now() - startedAt) / 1000;
            // too little of the round left to be worth a number: the word stays
            if (left < COUNT_MIN_SECONDS) return;
            setCount(Math.max(1, Math.ceil(left)));
            countLive.current = true;
            Animated.parallel([
              fadeTo(cueEnter, 0),
              fadeTo(countEnter, 1),
            ]).start();
          }, Math.max(0, startedAt + EXHALE_CUE_MS - Date.now()));
        });
      },
    );

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      // clamped to 1: the last second belongs to the next cue, not to a zero
      const next = secondsLeft();
      if (countLive.current) {
        setCount((prev) => {
          if (next !== prev && isHapticsEnabled()) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
              () => {},
            );
          }
          return next;
        });
      }
      if (elapsed >= step.durationSeconds) {
        clearInterval(interval);
        if (protocolStep < FINAL_STEP_INDEX) {
          countLive.current = false;
          setProtocolStep(protocolStep + 1);
          return;
        }
        countLive.current = false;
        // the hold is the moment the whole sequence was for, so it lands
        // harder than any of the breaths before it
        if (isHapticsEnabled()) {
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          ).catch(() => {});
        }
        setPhase('hold');
      }
    }, 100);

    return () => {
      clearInterval(interval);
      if (cueTimerRef.current) clearTimeout(cueTimerRef.current);
    };
  }, [countEnter, cueEnter, phase, protocolStep]);

  useEffect(() => {
    if (phase !== 'hold') return;
    stopInhaleVibration();
    countLive.current = false;
    if (cueTimerRef.current) clearTimeout(cueTimerRef.current);
    Animated.parallel([fadeTo(cueEnter, 0), fadeTo(countEnter, 0)]).start(
      ({ finished }) => {
        if (!finished) return;
        setCueText('Hold');
        fadeTo(cueEnter, 1).start();
      },
    );
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
    setProtocolStep(0);
    setCount(LEAD_IN_SECONDS);
    setHoldSec(0);
    setIsHolding(false);
    setResult(null);
    setDisplayedLungAge(MIN_LUNG_AGE);

    circleRef.current?.reset();
    inhaleEnter.stopAnimation();
    cueEnter.stopAnimation();
    countEnter.stopAnimation();
    countPulse.stopAnimation();
    doneEnter.stopAnimation();
    inhaleEnter.setValue(0);
    cueEnter.setValue(0);
    countEnter.setValue(0);
    countPulse.setValue(1);
    doneEnter.setValue(0);
    if (cueTimerRef.current) {
      clearTimeout(cueTimerRef.current);
      cueTimerRef.current = null;
    }
    cancelAnimation(arcProgress);
    arcProgress.value = 0;
    setPhase('leadIn');
  }, [
    arcProgress,
    countEnter,
    countPulse,
    cueEnter,
    doneEnter,
    inhaleEnter,
  ]);

  // The counter reads off the same shared value as the ring, so both stay on the
  // UI thread and React only re-renders when the whole year changes.
  useAnimatedReaction(
    () => lungAgeFromGaugeFill(arcProgress.value),
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
    // Always reveal from an empty arc so younger results never make the arc
    // retract from the user's chronological age.
    const fromFill = 0;
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

  if (phase === 'leadIn' || phase === 'prepare' || phase === 'hold') {
    // One entrance, on the lead-in. The lead-in, the rounds and the hold are one
    // continuous screen, so nothing re-enters when the first cue arrives.
    const enterStyle = {
      opacity: inhaleEnter,
      transform: [
        {
          translateY: inhaleEnter.interpolate({
            inputRange: [0, 1],
            outputRange: [40, 0],
          }),
        },
      ],
    };

    return (
      <Pressable
        style={styles.fullScreen}
        onPress={isHolding ? handleHoldRelease : undefined}
        disabled={!isHolding}
        accessibilityRole={isHolding ? 'button' : undefined}
        accessibilityLabel={isHolding ? 'End breath hold' : undefined}
      >
        <Animated.View style={[styles.fullCenter, enterStyle]}>
          <BreathingCircle ref={circleRef}>
            <View style={styles.cueSlot}>
              <Animated.Text
                style={[styles.cue, { opacity: cueEnter }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {cueText}
              </Animated.Text>
              <Animated.Text
                style={[
                  styles.countdown,
                  { opacity: countEnter, transform: [{ scale: countPulse }] },
                ]}
                numberOfLines={1}
              >
                {count}
              </Animated.Text>
            </View>
          </BreathingCircle>

          {/*
            Below the circle rather than inside it: the inner circle holds one
            word, and a running timer and a line of instruction do not fit
            beside it without shrinking both past reading.
          */}
          <View style={styles.belowCircle}>
            {isHolding ? (
              <>
                <Text style={styles.holdTimer}>{formatHold(holdSec)}</Text>
                <Text style={styles.releaseHint}>
                  Tap anywhere when you{'\n'}need to breathe
                </Text>
              </>
            ) : null}
          </View>
        </Animated.View>
      </Pressable>
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
                    lungAgeYears: result.lungAgeYears,
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
                try the resets in the app.
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
            onPress={() => {
              setProtocolStep(0);
              setPhase('leadIn');
            }}
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
          <MaterialCommunityIcons
            name="lungs"
            size={170}
            color={colors.primary.blue600}
          />
        </View>
        <View style={styles.introCopy}>
          <Text
            style={styles.introHeadline}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            The Azora Protocol.
          </Text>
          <Text style={styles.introSub}>
            Three slow rounds, one deep breath in, then hold. Tap at the first
            strong urge to breathe.
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
    backgroundColor: colors.background.canvas,
  },
  fullCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    // sits the circle above the middle, so the timer and the instruction under
    // it have room without pushing it off centre as they appear
    paddingBottom: spacing['6xl'],
  },
  // The cue and the count share one centred slot, so the handover crossfades in
  // place instead of the count stepping in from wherever the word left off.
  cueSlot: {
    minWidth: CUE_SLOT_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cue: {
    position: 'absolute',
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 20,
    lineHeight: 26,
    color: colors.primary.blue700,
    textAlign: 'center',
  },
  // Keeps its room whether or not it is showing, so nothing above it moves when
  // the hold starts.
  belowCircle: {
    height: 148,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  holdTimer: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 56,
    lineHeight: 64,
    color: colors.primary.blue700,
  },
  releaseHint: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
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
    fontSize: 44,
    lineHeight: 52,
    color: colors.primary.blue700,
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
