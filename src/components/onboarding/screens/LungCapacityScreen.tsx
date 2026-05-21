import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Canvas,
  Circle,
  Path,
  Skia,
  SweepGradient,
  vec,
} from '@shopify/react-native-skia';
import {
  Easing as RNREasing,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Icon from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import {
  startInhaleVibration,
  stopInhaleVibration,
} from '../../../native/inhaleVibration';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import {
  colorForLabel,
  scoreExhale,
  type LungCapacityResult,
} from '../../../lib/lungCapacity';

interface LungCapacityScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: (result: LungCapacityResult) => void;
  onBack: () => void;
  onSkip?: () => void;
}

type Phase = 'intro' | 'inhale' | 'exhale' | 'calibrating' | 'done';

const INHALE_SECONDS = 4;
const CIRCLE_SIZE = 260;
const CIRCLE_MIN_SCALE = 0.5;
const CALIBRATION_MS = 2200;

const GAUGE_SIZE = 240;
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

export default function LungCapacityScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
  onSkip,
}: LungCapacityScreenProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [inhaleRemaining, setInhaleRemaining] = useState(INHALE_SECONDS);
  const [exhaleSec, setExhaleSec] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [result, setResult] = useState<LungCapacityResult | null>(null);

  const scale = useRef(new Animated.Value(CIRCLE_MIN_SCALE)).current;
  const inhaleEnter = useRef(new Animated.Value(0)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const doneEnter = useRef(new Animated.Value(0)).current;
  const exhaleStartRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [displayedScore, setDisplayedScore] = useState(0);

  const arcProgress = useSharedValue(0);
  const arcRect = useMemo(
    () =>
      Skia.XYWHRect(
        GAUGE_CX - GAUGE_R,
        GAUGE_CY - GAUGE_R,
        GAUGE_R * 2,
        GAUGE_R * 2,
      ),
    [],
  );
  const arcPath = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const ratio = Math.max(0, Math.min(1, arcProgress.value / 100));
    if (ratio > 0) {
      p.addArc(arcRect, GAUGE_START, GAUGE_SWEEP * ratio);
    }
    return p;
  });

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      stopInhaleVibration();
    };
  }, []);

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
        setPhase('exhale');
      }
    }, 100);

    return () => clearInterval(interval);
  }, [phase, scale]);

  const handleHoldStart = () => {
    if (phase !== 'exhale' || isHolding) return;
    setIsHolding(true);
    setExhaleSec(0);
    exhaleStartRef.current = Date.now();
    if (isHapticsEnabled()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    Animated.timing(scale, {
      toValue: CIRCLE_MIN_SCALE,
      duration: 15000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
    tickRef.current = setInterval(() => {
      const started = exhaleStartRef.current ?? Date.now();
      setExhaleSec((Date.now() - started) / 1000);
    }, 100);
    startInhaleVibration(60_000);
  };

  const handleHoldEnd = () => {
    if (phase !== 'exhale' || !isHolding) return;
    setIsHolding(false);
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    stopInhaleVibration();
    scale.stopAnimation();
    const started = exhaleStartRef.current ?? Date.now();
    const seconds = (Date.now() - started) / 1000;
    const scored = scoreExhale(seconds);
    setResult(scored);
    if (isHapticsEnabled()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    }
    setPhase('calibrating');
  };

  useEffect(() => {
    if (phase !== 'calibrating' || !result) return;
    scoreAnim.setValue(0);
    setDisplayedScore(0);
    arcProgress.value = 0;
    arcProgress.value = withTiming(result.score, {
      duration: CALIBRATION_MS,
      easing: RNREasing.out(RNREasing.cubic),
    });
    const id = scoreAnim.addListener(({ value }) => {
      setDisplayedScore(Math.round(value * result.score));
    });
    Animated.timing(scoreAnim, {
      toValue: 1,
      duration: CALIBRATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished) return;
      setDisplayedScore(result.score);
      doneEnter.setValue(0);
      setPhase('done');
      Animated.timing(doneEnter, {
        toValue: 1,
        duration: 460,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      if (isHapticsEnabled()) {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => {});
      }
    });
    return () => {
      scoreAnim.removeListener(id);
    };
  }, [phase, result, scoreAnim, doneEnter, arcProgress]);

  if (phase === 'inhale' || phase === 'exhale') {
    const isInhale = phase === 'inhale';
    const subhead = isInhale
      ? 'Fill your lungs completely.'
      : isHolding
        ? 'Exhale for as long as you can.'
        : 'Then exhale for as long as you can.';

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
            {isInhale ? (
              <Text style={styles.phaseHeading}>Breathe in deeply</Text>
            ) : isHolding ? (
              <Text style={styles.bigTimer}>
                {exhaleSec.toFixed(1)}
                <Text style={styles.bigTimerUnit}>s</Text>
              </Text>
            ) : (
              <Text style={styles.phaseHeading}>Hold the button to start</Text>
            )}
          </View>
          <Text style={styles.phaseSub}>{subhead}</Text>

          <View style={styles.circleWrap}>
            <Animated.View
              style={[
                styles.circle,
                isInhale ? styles.circleInhale : styles.circleExhale,
                { transform: [{ scale }] },
              ]}
            />
            <View style={styles.circleContent} pointerEvents="none">
              {isInhale ? (
                <Text style={styles.countdown}>{inhaleRemaining}</Text>
              ) : isHolding ? null : (
                <MaterialCommunityIcons
                  name="fingerprint"
                  size={72}
                  color={colors.primary.blue700}
                />
              )}
            </View>

            {!isInhale ? (
              <Pressable
                style={styles.holdTarget}
                onPressIn={handleHoldStart}
                onPressOut={handleHoldEnd}
                accessibilityRole="button"
                accessibilityLabel="Hold to time your exhale"
              />
            ) : null}
          </View>
        </Animated.View>
      </View>
    );
  }

  if ((phase === 'calibrating' || phase === 'done') && result) {
    const isCalibrating = phase === 'calibrating';
    const scoreColor = colorForLabel(result.label, {
      warning500: colors.warning[500],
      blue400: colors.primary.blue400,
      blue600: colors.primary.blue600,
      success500: colors.success[500],
    });
    const track = Skia.Path.Make();
    track.addArc(arcRect, GAUGE_START, GAUGE_SWEEP);
    const ticks = [0, 25, 50, 75, 100].map((t) =>
      gaugeTickPath(GAUGE_START + (t / 100) * GAUGE_SWEEP),
    );

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
            <OnboardingPrimaryButton
              label="Continue"
              onPress={() => onContinue(result)}
            />
          )
        }
      >
        <View style={styles.gaugeStage}>
          <Text style={styles.gaugeHeading}>
            {isCalibrating ? 'Calibrating…' : 'Your lung health score'}
          </Text>
          <Text style={styles.gaugeSub}>
            {isCalibrating
              ? 'Analyzing your exhale.'
              : 'A snapshot of how your lung strength.'}
          </Text>

          <View style={styles.gaugeSurface}>
            <Canvas style={StyleSheet.absoluteFill}>
              <Path
                path={track}
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
              >
                <SweepGradient
                  c={vec(GAUGE_CX, GAUGE_CY)}
                  start={GAUGE_START}
                  end={GAUGE_START + GAUGE_SWEEP}
                  colors={[scoreColor + '55', scoreColor]}
                />
              </Path>
              {ticks.map((p, i) => (
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
                <Text style={styles.gaugeValue}>{displayedScore}</Text>
                <Text style={styles.gaugeValueMax}>/100</Text>
              </View>
            </View>
          </View>

          {!isCalibrating ? (
            <Animated.View style={[styles.gaugeMeta, revealStyle]}>
              <Text style={styles.followup}>
                We&apos;ll show you what this means and how to improve it after
                signing up.
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
          <Pressable
            accessibilityRole="button"
            onPress={() => onContinue(scoreExhale(0))}
            style={({ pressed }) => [styles.skip, pressed && styles.skipPressed]}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </View>
      }
    >
      <View style={styles.introStage}>
        <View style={styles.lungIcon}>
          <Icon name="lungs" size={140} color={colors.primary.blue600} />
        </View>
        <View style={styles.introCopy}>
          <Text style={styles.introHeadline}>Lets measure your{'\n'}lung capacity.</Text>
          <Text style={styles.introSub}>
            A quick two-step test. First a deep inhale, then we&apos;ll time
            your exhale.
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
    fontWeight: '600',
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
    fontWeight: '600',
    color: colors.text.secondary,
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
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseHeading: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
    color: colors.text.primary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  bigTimer: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 64,
    lineHeight: 72,
    color: colors.primary.blue700,
    textAlign: 'center',
  },
  bigTimerUnit: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 28,
    color: colors.primary.blue600,
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
  circleExhale: {
    backgroundColor: colors.primary.blue200,
    borderWidth: 2,
    borderColor: colors.primary.blue600,
  },
  circleContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdown: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
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
    gap: spacing['2xl'],
    paddingTop: spacing['2xl'],
  },
  gaugeHeading: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  gaugeSub: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: -spacing.xl,
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
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  gaugeValue: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 60,
    lineHeight: 64,
    letterSpacing: -1.5,
    color: colors.text.primary,
  },
  gaugeValueMax: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.tertiary,
    letterSpacing: -0.2,
  },
  gaugeMeta: {
    width: '100%',
    gap: spacing.md,
    marginTop: spacing['4xl'],
  },
  followup: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
});
