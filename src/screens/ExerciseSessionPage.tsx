import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing } from '../theme/spacing';
import BreathingCircle, {
  BreathingCircleRef,
} from '../components/exercise/BreathingCircle';
import ExerciseScaffold from '../components/exercise/ExerciseScaffold';
import TechniqueIntro from '../components/exercise/TechniqueIntro';
import TECHNIQUES from '../data/techniques';
import type { BreathingTechnique } from '../data/techniques';
import { useCancellableFlow } from '../hooks/useCancellableFlow';
import { useLivePulse } from '../hooks/useLivePulse';
import { useBreathPhaseAudio } from '../hooks/useBreathPhaseAudio';
import { HeartRateCameraPreview } from '../components/heartRate/HeartRateCameraPreview';
import type { FingerPlacementState } from '../lib/heartRate/types';
import { startInhaleVibration, stopInhaleVibration } from '../native/inhaleVibration';
import { usePostHog } from 'posthog-react-native';
import type { ExerciseSessionScreenProps } from '../app/navigation';
import { captureException } from '../services/analytics/errorTracking';
import { AnalyticsEvent } from '../services/analytics/events';

const MIN_ROUNDS = 1;
const MAX_ROUNDS = 20;
const PLACEMENT_GOOD_DURATION_MS = 1500;

function placementHint(p: FingerPlacementState): string {
  switch (p) {
    case 'good':
      return 'Hold still';
    case 'partial':
      return 'Cover the lens fully';
    case 'too_much_pressure':
      return 'Ease up slightly';
    case 'no_finger':
    case 'lost':
    default:
      return 'Rest your fingertip on the camera';
  }
}

type Phase =
  | 'idle'
  | 'placement'
  | 'inhale'
  | 'holdIn'
  | 'exhale'
  | 'holdOut'
  | 'done';

const PHASE_LABELS: Record<Phase, string> = {
  idle: '',
  placement: '',
  inhale: 'Inhale',
  holdIn: 'Hold',
  exhale: 'Exhale',
  holdOut: 'Hold',
  done: 'Well done',
};

export default function ExerciseSessionPage({
  navigation,
  route,
}: ExerciseSessionScreenProps) {
  const techniqueId = route.params?.techniqueId;
  const initialTechnique = TECHNIQUES.find((t) => t.id === techniqueId) ?? TECHNIQUES[0];

  const circleRef = useRef<BreathingCircleRef>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remainingRef = useRef(0);
  const onDoneRef = useRef<(() => void) | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [round, setRound] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [technique] = useState<BreathingTechnique>(initialTechnique);
  const [totalRounds, setTotalRounds] = useState(initialTechnique.defaultRounds);
  const [hrEnabled, setHrEnabled] = useState(true);
  const isFocused = useIsFocused();

  const hudOpacity = useRef(new Animated.Value(1)).current;
  const [hudVisible, setHudVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bpmOpacity = useRef(new Animated.Value(0.6)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  const transition = useRef(new Animated.Value(phase === 'idle' ? 0 : 1)).current;

  useEffect(() => {
    const toValue = phase === 'idle' ? 0 : 1;
    Animated.timing(transition, {
      toValue,
      duration: 450,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [phase === 'idle']);

  const introOpacity = transition.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [1, 0.4, 0],
  });
  const introScale = transition.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.96],
  });
  const introTranslateY = transition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const circleOpacity = transition.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0, 0.3, 1],
  });
  const circleScale = transition.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1],
  });

  const showHud = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setHudVisible(true);
    Animated.timing(hudOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    hideTimerRef.current = setTimeout(() => {
      Animated.timing(hudOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setHudVisible(false);
      });
    }, 3000);
  }, [hudOpacity]);

  const posthog = usePostHog();
  useBreathPhaseAudio(
    !paused && (phase === 'inhale' || phase === 'exhale') ? phase : null,
    { active: isFocused },
  );

  const pulse = useLivePulse();
  const { start: startPulse, stop: stopPulse, hasPermission, requestPermission } = pulse;

  useEffect(() => {
    if (pulse.beatTick <= 0) return;
    bpmOpacity.setValue(0.95);
    Animated.timing(bpmOpacity, {
      toValue: 0.6,
      duration: 420,
      useNativeDriver: true,
    }).start();
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 1.28,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(heartScale, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start();
  }, [pulse.beatTick, bpmOpacity, heartScale]);

  const isSessionActive = phase !== 'idle' && phase !== 'done' && !paused;

  useEffect(() => {
    if (hrEnabled && isSessionActive) {
      startPulse();
    } else {
      stopPulse();
    }
  }, [hrEnabled, isSessionActive, startPulse, stopPulse]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const flow = useCancellableFlow(
    useCallback(() => {
      clearTimer();
      stopInhaleVibration();
      stopPulse();
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    }, [stopPulse]),
  );

  useEffect(() => {
    if (isFocused || phase === 'done') return;

    setPaused(false);
    setPhase('idle');
  }, [isFocused, phase]);

  const runPhase = useCallback(
    (p: Phase, secs: number, onDone: () => void) => {
      if (!flow.isActive()) return;

      if (secs === 0) {
        if (!flow.isActive()) return;
        onDone();
        return;
      }

      onDoneRef.current = onDone;
      setPhase(p);
      setPaused(false);
      if (p === 'inhale') {
        startInhaleVibration(secs * 1000);
      } else {
        stopInhaleVibration();
      }

      if (p === 'inhale' || p === 'exhale') {
        requestAnimationFrame(() => {
          if (p === 'inhale') circleRef.current?.expand(secs);
          else circleRef.current?.contract(secs);
        });
      }

      let remaining = secs;
      remainingRef.current = remaining;
      clearTimer();
      timerRef.current = setInterval(() => {
        remaining -= 1;
        remainingRef.current = remaining;
        setElapsed((current) => current + 1);

        if (remaining <= 0) {
          clearTimer();
          if (!flow.isActive()) return;
          onDone();
        }
      }, 1000);
    },
    [flow],
  );

  const startCycle = useCallback(
    (currentRound: number, pattern: BreathingTechnique['pattern'], rounds: number) => {
      if (!flow.isActive()) return;

      if (currentRound > rounds) {
        flow.cancel();
        setPhase('done');
        posthog.capture(AnalyticsEvent.ExerciseSessionCompleted, {
          technique_id: technique.id,
          technique_name: technique.name,
          technique_category: technique.category,
          total_rounds: rounds,
          elapsed_seconds: elapsed,
          hr_monitoring_enabled: hrEnabled,
        });
        return;
      }

      setRound(currentRound);

      runPhase('inhale', pattern.inhale, () => {
        runPhase('holdIn', pattern.holdIn, () => {
          runPhase('exhale', pattern.exhale, () => {
            runPhase('holdOut', pattern.holdOut, () => {
              startCycle(currentRound + 1, pattern, rounds);
            });
          });
        });
      });
    },
    [flow, runPhase, posthog, technique, elapsed, hrEnabled],
  );

  const handlePause = () => {
    clearTimer();
    circleRef.current?.pause();
    stopInhaleVibration();
    setPaused(true);
    posthog.capture(AnalyticsEvent.ExerciseSessionPaused, {
      technique_id: technique.id,
      technique_name: technique.name,
      round,
      total_rounds: totalRounds,
      elapsed_seconds: elapsed,
    });
  };

  const handleResume = (currentPhase: Phase) => {
    if (!onDoneRef.current) return;
    const remaining = remainingRef.current;
    const onDone = onDoneRef.current;
    setPaused(false);

    if (currentPhase === 'inhale') {
      circleRef.current?.resumeExpand(remaining);
      startInhaleVibration(remaining * 1000);
    } else if (currentPhase === 'exhale') {
      circleRef.current?.resumeContract(remaining);
    }

    let rem = remaining;
    clearTimer();
    timerRef.current = setInterval(() => {
      rem -= 1;
      remainingRef.current = rem;
      setElapsed((current) => current + 1);
      if (rem <= 0) {
        clearTimer();
        if (!flow.isActive()) return;
        onDone();
      }
    }, 1000);
  };

  const beginExercise = useCallback(
    (withHr: boolean) => {
      if (!flow.start()) return;
      setElapsed(0);
      setRound(0);
      requestAnimationFrame(() => circleRef.current?.reset());
      posthog.capture(AnalyticsEvent.ExerciseSessionStarted, {
        technique_id: technique.id,
        technique_name: technique.name,
        technique_category: technique.category,
        total_rounds: totalRounds,
        hr_monitoring_enabled: withHr,
      });
      startCycle(1, technique.pattern, totalRounds);
    },
    [flow, posthog, technique, totalRounds, startCycle],
  );

  const startPlacement = useCallback(async () => {
    if (!flow.start()) return;
    try {
      const granted = hasPermission ? true : await requestPermission();
      if (!flow.isActive()) return;
      if (!granted) {
        setHrEnabled(false);
        beginExercise(false);
        return;
      }
      setHrEnabled(true);
      setPhase('placement');
      startPulse();
    } catch (error) {
      if (!flow.isActive()) return;
      captureException(error, {
        flow: 'exercise_session',
        action: 'start_placement',
        screen_name: 'ExerciseSession',
        technique_id: technique.id,
        technique_name: technique.name,
      });
      setHrEnabled(false);
      beginExercise(false);
    }
  }, [flow, hasPermission, requestPermission, startPulse, beginExercise, technique]);

  const handleStart = () => {
    if (phase === 'idle' || phase === 'done') {
      void startPlacement();
    }
  };

  useEffect(() => {
    if (phase !== 'placement') return;
    if (pulse.fingerPlacement !== 'good') return;
    const t = setTimeout(() => {
      if (!flow.isActive()) return;
      beginExercise(true);
    }, PLACEMENT_GOOD_DURATION_MS);
    return () => clearTimeout(t);
  }, [flow, phase, pulse.fingerPlacement, beginExercise]);

  const handleClose = () => {
    flow.cancel();
    if (phase !== 'idle' && phase !== 'done') {
      const cycleSeconds =
        technique.pattern.inhale +
        technique.pattern.holdIn +
        technique.pattern.exhale +
        technique.pattern.holdOut;
      const targetSeconds = cycleSeconds * totalRounds;
      posthog.capture(AnalyticsEvent.ExerciseSessionAbandoned, {
        technique_id: technique.id,
        technique_name: technique.name,
        abandoned_at_phase: phase,
        abandoned_at_round: round,
        total_rounds: totalRounds,
        elapsed_seconds: elapsed,
        target_seconds: targetSeconds,
        completion_rate: targetSeconds > 0 ? elapsed / targetSeconds : 0,
      });
    }
    navigation.goBack();
  };

  const isActive =
    phase !== 'idle' && phase !== 'done' && phase !== 'placement';
  const isPlacement = phase === 'placement';

  useEffect(() => {
    if (isActive) {
      showHud();
    } else {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      setHudVisible(true);
      hudOpacity.setValue(1);
    }
  }, [isActive, showHud, hudOpacity]);

  const cycleSeconds =
    technique.pattern.inhale +
    technique.pattern.holdIn +
    technique.pattern.exhale +
    technique.pattern.holdOut;
  const totalSeconds = Math.max(1, cycleSeconds * totalRounds);
  const progress = Math.min(
    1,
    phase === 'done' ? 1 : elapsed / totalSeconds,
  );

  const cameraProps = useMemo(() => (
    pulse.device != null
      ? {
          device: pulse.device,
          format: pulse.format,
          frameProcessor: pulse.frameProcessor,
          torchMode: pulse.torchMode,
          fingerPlacement: pulse.fingerPlacement,
          isActive: pulse.active,
        }
      : undefined
  ), [pulse.active, pulse.device, pulse.fingerPlacement, pulse.format, pulse.frameProcessor, pulse.torchMode]);

  const showCamera = (isPlacement || isActive) && pulse.active && cameraProps != null;
  const cameraSlot = showCamera ? <HeartRateCameraPreview {...cameraProps} /> : null;

  const bpmDisplay =
    isActive && pulse.active && pulse.currentBpm != null && pulse.currentBpm > 0
      ? Math.round(pulse.currentBpm)
      : null;
  const signalGood = pulse.fingerPlacement === 'good';
  const showSignalWarning = isActive && pulse.active && !signalGood;

  const handleScreenTap = () => {
    if (isActive) showHud();
  };

  return (
    <View style={styles.fill}>
      {isActive && !hudVisible ? (
        <Pressable
          style={styles.tapToRevealLayer}
          onPress={handleScreenTap}
          accessibilityLabel="Show controls"
        />
      ) : null}
      <ExerciseScaffold
        centerSlot={
          <View style={styles.centerStack}>
            <View style={styles.phaseSlot}>
              {PHASE_LABELS[phase] ? (
                <Text style={styles.phaseLabel}>{PHASE_LABELS[phase]}</Text>
              ) : null}
            </View>

            <View style={styles.contentArea}>
              <Animated.View
                style={[
                  styles.contentLayer,
                  {
                    opacity: introOpacity,
                    transform: [
                      { scale: introScale },
                      { translateY: introTranslateY },
                    ],
                  },
                ]}
              >
                <TechniqueIntro technique={technique} />
              </Animated.View>

              <Animated.View
                style={[
                  styles.contentLayer,
                  {
                    opacity: circleOpacity,
                    transform: [{ scale: circleScale }],
                  },
                ]}
              >
                <BreathingCircle
                  ref={circleRef}
                  cameraSlot={cameraSlot}
                  beatTick={pulse.beatTick}
                >
                  {phase === 'done' ? (
                    <MaterialCommunityIcons
                      name="check-circle-outline"
                      size={32}
                      color={colors.neutral[50]}
                    />
                  ) : null}
                </BreathingCircle>
              </Animated.View>
            </View>

            <View style={styles.belowSlot}>
              {isPlacement ? (
                <Text style={styles.hintText}>
                  {placementHint(pulse.fingerPlacement)}
                </Text>
              ) : isActive && pulse.active ? (
                <View style={styles.metricStack}>
                  {bpmDisplay != null ? (
                    <View style={[styles.bpmRow, showSignalWarning && styles.bpmRowDim]}>
                      <Animated.Text
                        style={[
                          styles.bpmNumber,
                          showSignalWarning ? null : { opacity: bpmOpacity },
                        ]}
                      >
                        {bpmDisplay}
                      </Animated.Text>
                      <Animated.View
                        style={
                          showSignalWarning
                            ? null
                            : { transform: [{ scale: heartScale }] }
                        }
                      >
                        <MaterialCommunityIcons
                          name="heart"
                          size={18}
                          color={
                            showSignalWarning
                              ? colors.text.tertiary
                              : colors.error[500]
                          }
                        />
                      </Animated.View>
                    </View>
                  ) : null}
                  {showSignalWarning ? (
                    <View style={styles.warningRow}>
                      <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={12}
                        color={colors.warning[500]}
                      />
                      <Text style={styles.warningText}>
                        {placementHint(pulse.fingerPlacement)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
        }
        bottomSlot={
          <Animated.View
            style={[styles.bottomContainer, isActive ? { opacity: hudOpacity } : null]}
          >
            {isActive || paused ? (
              <View style={styles.progressWrap}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                </View>
                <Text style={styles.progressLabel}>
                  Round {Math.min(round, totalRounds)} of {totalRounds}
                </Text>
              </View>
            ) : isPlacement ? null : (
              <View style={styles.stepper}>
                <Pressable
                  style={[styles.stepBtn, totalRounds <= MIN_ROUNDS && styles.stepBtnDisabled]}
                  onPress={() => totalRounds > MIN_ROUNDS && setTotalRounds(totalRounds - 1)}
                >
                  <MaterialCommunityIcons name="minus" size={14} color={totalRounds <= MIN_ROUNDS ? colors.text.tertiary : colors.text.primary} />
                </Pressable>
                <View style={styles.stepValueWrap}>
                  <Text style={styles.stepValue}>{totalRounds}</Text>
                  <Text style={styles.stepLabel}>rounds</Text>
                </View>
                <Pressable
                  style={[styles.stepBtn, totalRounds >= MAX_ROUNDS && styles.stepBtnDisabled]}
                  onPress={() => totalRounds < MAX_ROUNDS && setTotalRounds(totalRounds + 1)}
                >
                  <MaterialCommunityIcons name="plus" size={14} color={totalRounds >= MAX_ROUNDS ? colors.text.tertiary : colors.text.primary} />
                </Pressable>
              </View>
            )}
            <View style={styles.btnRow}>
              <Pressable
                style={({ pressed }) => [styles.squareBtn, pressed && styles.circleBtnPressed]}
                onPress={() => {
                  if (isActive) showHud();
                  handleClose();
                }}
              >
                <MaterialCommunityIcons name="stop" size={26} color={colors.neutral[900]} />
              </Pressable>
              {isPlacement ? (
                <Pressable
                  onPress={() => beginExercise(false)}
                  style={({ pressed }) => [
                    styles.inlineLink,
                    pressed && styles.textLinkPressed,
                  ]}
                >
                  <Text style={styles.textLinkLabel}>Skip heart rate</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={({ pressed }) => [styles.circleBtn, pressed && styles.circleBtnPressed]}
                  onPress={() => {
                    if (isActive) showHud();
                    if (phase === 'idle' || phase === 'done') {
                      handleStart();
                    } else if (paused) {
                      handleResume(phase);
                    } else {
                      handlePause();
                    }
                  }}
                >
                  <MaterialCommunityIcons
                    name={isActive && !paused ? 'pause' : 'play'}
                    size={28}
                    color={colors.neutral[900]}
                  />
                </Pressable>
              )}
            </View>
          </Animated.View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  tapToRevealLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  centerStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseSlot: {
    height: 40,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: spacing.sm,
  },
  contentArea: {
    width: 340,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },

  phaseLabel: {
    ...typography.display.display2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 1.5,
    color: colors.text.primary,
    opacity: 0.7,
    textAlign: 'center',
  },
  belowSlot: {
    height: 44,
    marginTop: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 14,
    color: colors.text.secondary,
    opacity: 0.6,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  metricStack: {
    alignItems: 'center',
    gap: 4,
  },
  bpmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bpmRowDim: {
    opacity: 0.25,
  },
  bpmNumber: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: 0.5,
    color: colors.text.primary,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  warningText: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.warning[500],
    opacity: 0.85,
  },
  bottomContainer: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  progressWrap: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  progressTrack: {
    width: '100%',
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.border.subtle,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.blue400,
    opacity: 0.6,
    borderRadius: 1,
  },
  progressLabel: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.tertiary,
    opacity: 0.6,
    letterSpacing: 1,
  },
  inlineLink: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textLinkPressed: {
    opacity: 0.5,
  },
  textLinkLabel: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 0.5,
    color: colors.text.tertiary,
    opacity: 0.7,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  squareBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  circleBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  circleBtnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background.elevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  stepBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    opacity: 0.4,
  },
  stepValueWrap: {
    alignItems: 'center',
    minWidth: 26,
  },
  stepValue: {
    ...typography.heading.heading2,
    color: colors.text.primary,
  },
  stepLabel: {
    ...typography.caption.caption2,
    color: colors.text.tertiary,
  },
});
