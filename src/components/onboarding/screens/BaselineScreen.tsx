import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BaselineHero from '../BaselineHero';
import * as Haptics from 'expo-haptics';
import BreathingCircle, {
  type BreathingCircleRef,
} from '../../exercise/BreathingCircle';
import { HeartRateCameraPreview } from '../../heartRate/HeartRateCameraPreview';
import { useHeartRateStream } from '../../../hooks/useHeartRateStream';
import { useBreathPhaseAudio } from '../../../hooks/useBreathPhaseAudio';
import {
  startInhaleVibration,
  stopInhaleVibration,
} from '../../../native/inhaleVibration';
import type { FingerPlacementState } from '../../../lib/heartRate/types';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

export interface BaselineResult {
  completed: boolean;
  avgBpm: number | null;
  earlyBpm: number | null;
  lateBpm: number | null;
  bpmDrop: number | null;
  durationSec: number;
  bpmHistory: number[];
}

interface BaselineScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: (result: BaselineResult) => void;
  onBack: () => void;
}

type Phase = 'intro' | 'placement' | 'running' | 'done';

const SESSION_MS = 60_000;
const HALF_BREATH_SEC = 5.5;
const PLACEMENT_GOOD_DURATION_MS = 2500;

const STEPS: { num: string; label: string }[] = [
  { num: '1', label: 'Get relaxed in a comfortable place.' },
  { num: '2', label: 'Cover the back camera and flash with your fingertip.' },
  { num: '3', label: 'Breathe with the circle while staying still.' },
];

const READING_TIPS = [
  'Warm, dry hands work best.',
  'Use gentle pressure - enough to cover the lens, not enough to block blood flow.',
  'Keep your phone and finger steady, and avoid talking during the reading.',
  'If the signal drops, adjust until your fingertip fully covers the camera and flash.',
];

function placementConfig(p: FingerPlacementState): { ringColor: string; status: string } {
  switch (p) {
    case 'good':
      return { ringColor: colors.success[500], status: 'Hold still…' };
    case 'partial':
      return { ringColor: colors.warning[500], status: 'Cover the lens fully' };
    case 'too_much_pressure':
      return { ringColor: colors.warning[500], status: 'Ease up slightly' };
    case 'no_finger':
    case 'lost':
    default:
      return {
        ringColor: colors.error[500],
        status: 'Place your fingertip over the back camera',
      };
  }
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((s, v) => s + v, 0) / values.length);
}

export default function BaselineScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: BaselineScreenProps) {
  const insets = useSafeAreaInsets();
  const stream = useHeartRateStream();
  const [phase, setPhase] = useState<Phase>('intro');
  const [breathLabel, setBreathLabel] = useState<'Inhale' | 'Exhale'>('Inhale');
  const [progress, setProgress] = useState(0);

  const circleRef = useRef<BreathingCircleRef>(null);
  const startedAtRef = useRef<number | null>(null);
  const earlyBpmsRef = useRef<number[]>([]);
  const lateBpmsRef = useRef<number[]>([]);
  const allBpmsRef = useRef<number[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breathTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hudOpacity = useRef(new Animated.Value(1)).current;
  const [hudVisible, setHudVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bpmOpacity = useRef(new Animated.Value(0.6)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  const placementCfg = placementConfig(stream.fingerPlacement);
  const hasConfirmedSignal =
    stream.streamState === 'streaming' &&
    (stream.fingerPlacement === 'good' || stream.fingerPlacement === 'partial');
  const hasUsableFingerSignal =
    stream.fingerPlacement === 'good' || stream.fingerPlacement === 'partial';
  const visibleBeatTick = hasUsableFingerSignal ? stream.beatTick : 0;
  const bpmDisplay =
    phase === 'running' && stream.currentBpm != null && stream.currentBpm > 0
      ? Math.round(stream.currentBpm)
      : null;
  const signalGood = stream.fingerPlacement === 'good';
  const showSignalWarning = phase === 'running' && !signalGood;

  useEffect(() => {
    if (visibleBeatTick <= 0) return;
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
  }, [visibleBeatTick, bpmOpacity, heartScale]);

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
        duration: 250,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setHudVisible(false);
      });
    }, 3000);
  }, [hudOpacity]);

  useBreathPhaseAudio(
    phase === 'running' ? (breathLabel === 'Inhale' ? 'inhale' : 'exhale') : null,
  );

  const cameraProps = useMemo(() => {
    if (stream.device == null) return null;
    return {
      device: stream.device,
      format: stream.format,
      frameProcessor: stream.frameProcessor,
      torchMode: stream.torchMode,
      fingerPlacement: stream.fingerPlacement,
      isActive: phase === 'placement' || phase === 'running',
    };
  }, [
    stream.device,
    stream.format,
    stream.frameProcessor,
    stream.torchMode,
    stream.fingerPlacement,
    phase,
  ]);

  const cameraSlot =
    (phase === 'placement' || phase === 'running') && cameraProps != null ? (
      <HeartRateCameraPreview {...cameraProps} />
    ) : null;

  const finishCapture = (completed: boolean) => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    stopInhaleVibration();
    circleRef.current?.reset();
    stream.stopStream();
    setPhase('done');

    const earlyBpm = average(earlyBpmsRef.current);
    const lateBpm = average(lateBpmsRef.current);
    const avgBpm = average(allBpmsRef.current);
    const bpmDrop =
      earlyBpm != null && lateBpm != null ? earlyBpm - lateBpm : null;
    const durationSec = startedAtRef.current
      ? Math.round((Date.now() - startedAtRef.current) / 1000)
      : 0;

    if (completed && isHapticsEnabled()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {}
      );
    }

    onContinue({
      completed,
      avgBpm,
      earlyBpm,
      lateBpm,
      bpmDrop,
      durationSec,
      bpmHistory: allBpmsRef.current.slice(),
    });
  };

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      stopInhaleVibration();
      stream.stopStream();
    };
  }, []);

  useEffect(() => {
    if (phase !== 'running' || !hasConfirmedSignal || stream.currentBpm == null) return;
    const elapsed = startedAtRef.current
      ? Date.now() - startedAtRef.current
      : 0;
    allBpmsRef.current.push(stream.currentBpm);
    if (elapsed < SESSION_MS / 2) {
      earlyBpmsRef.current.push(stream.currentBpm);
    } else {
      lateBpmsRef.current.push(stream.currentBpm);
    }
  }, [stream.currentBpm, phase, hasConfirmedSignal]);

  useEffect(() => {
    if (phase !== 'placement') return;
    if (stream.fingerPlacement !== 'good') return;
    const t = setTimeout(() => {
      startedAtRef.current = Date.now();
      earlyBpmsRef.current = [];
      lateBpmsRef.current = [];
      allBpmsRef.current = [];
      setProgress(0);
      setBreathLabel('Inhale');
      setPhase('running');
    }, PLACEMENT_GOOD_DURATION_MS);
    return () => clearTimeout(t);
  }, [phase, stream.fingerPlacement]);

  useEffect(() => {
    if (phase === 'running') {
      showHud();
    } else {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      setHudVisible(true);
      hudOpacity.setValue(1);
    }
  }, [phase, showHud, hudOpacity]);

  useEffect(() => {
    if (phase !== 'running') return;

    if (isHapticsEnabled()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    let inhale = false;
    const startBreath = () => {
      circleRef.current?.expand(HALF_BREATH_SEC);
      setBreathLabel('Inhale');
      startInhaleVibration(HALF_BREATH_SEC * 1000);
    };
    const raf = requestAnimationFrame(startBreath);

    breathTimerRef.current = setInterval(() => {
      if (inhale) {
        circleRef.current?.expand(HALF_BREATH_SEC);
        setBreathLabel('Inhale');
        startInhaleVibration(HALF_BREATH_SEC * 1000);
      } else {
        circleRef.current?.contract(HALF_BREATH_SEC);
        setBreathLabel('Exhale');
        stopInhaleVibration();
      }
      inhale = !inhale;
    }, HALF_BREATH_SEC * 1000);

    tickRef.current = setInterval(() => {
      const started = startedAtRef.current ?? Date.now();
      const elapsed = Date.now() - started;
      const ratio = Math.min(1, elapsed / SESSION_MS);
      setProgress(ratio);
      if (ratio >= 1) finishCapture(true);
    }, 100);

    return () => {
      cancelAnimationFrame(raf);
      stopInhaleVibration();
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [phase]);

  const handleStart = async () => {
    const granted = stream.hasPermission
      ? true
      : await stream.requestPermission();
    if (!granted) {
      finishCapture(false);
      return;
    }
    setPhase('placement');
    stream.startStream();
  };

  const remainingSec = Math.max(0, Math.ceil((1 - progress) * 60));

  if (phase === 'placement' || phase === 'running') {
    const isRunning = phase === 'running';
    return (
      <View style={styles.fill}>
        {isRunning && !hudVisible ? (
          <Pressable
            style={styles.tapToRevealLayer}
            onPress={showHud}
            accessibilityLabel="Show controls"
          />
        ) : null}

        <View style={[styles.stage, { paddingTop: insets.top }]}>
          <View style={styles.header} />

          <View style={styles.center}>
            <View style={styles.centerStack}>
              <BreathingCircle
                ref={circleRef}
                cameraSlot={cameraSlot}
                beatTick={visibleBeatTick}
              >
                {isRunning ? (
                  <Text style={styles.phaseLabel}>{breathLabel}</Text>
                ) : null}
              </BreathingCircle>
              <View style={styles.belowSlot}>
                {!isRunning ? (
                  <Text
                    style={[
                      styles.hintText,
                      { color: placementCfg.ringColor },
                    ]}
                  >
                    {placementCfg.status}
                  </Text>
                ) : (
                  <View style={styles.metricStack}>
                    {bpmDisplay != null ? (
                      <View
                        style={[
                          styles.bpmRow,
                          showSignalWarning && styles.bpmRowDim,
                        ]}
                      >
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
                          {placementCfg.status}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                )}
              </View>
            </View>
          </View>

          <Animated.View
            style={[
              styles.bottom,
              isRunning ? { opacity: hudOpacity } : null,
            ]}
          >
            <View
              style={[
                styles.timePill,
                !isRunning && styles.hiddenPlaceholder,
              ]}
            >
              <Text style={styles.timeValue}>{remainingSec}s</Text>
            </View>
            <View
              style={[
                styles.progressBar,
                !isRunning && styles.hiddenPlaceholder,
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress * 100}%` },
                ]}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => finishCapture(false)}
              style={({ pressed }) => [
                styles.cancel,
                pressed && styles.skipPressed,
              ]}
            >
              <Text style={styles.skipText}>
                {isRunning ? 'End early' : 'Cancel'}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <OnboardingScreenLayout
      title="Read your baseline"
      subtitle="A 60-second breathing check so we can tune your plan. Make sure you're relaxed and in a comfortable place."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={
        <View style={styles.introFooter}>
          <OnboardingPrimaryButton label="Start" onPress={handleStart} />
          <Pressable
            accessibilityRole="button"
            onPress={() => finishCapture(false)}
            style={({ pressed }) => [
              styles.skip,
              pressed && styles.skipPressed,
            ]}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </View>
      }
    >
      <View style={styles.illustrationWrap}>
        <BaselineHero />
      </View>

      <View style={styles.stepsRow}>
        {STEPS.map((step, index) => (
          <View key={step.num} style={styles.stepItem}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{step.num}</Text>
            </View>
            <Text style={styles.stepLabel}>{step.label}</Text>
            {index < STEPS.length - 1 && <View style={styles.stepConnector} />}
          </View>
        ))}
      </View>

      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>For the cleanest reading</Text>
        {READING_TIPS.map((tip) => (
          <View key={tip} style={styles.tipRow}>
            <View style={styles.tipDot} />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  stepsRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    position: 'relative',
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.blue100,
  },
  stepBadgeText: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 14,
    color: colors.primary.blue700,
  },
  stepLabel: {
    ...typography.body.small,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    color: colors.text.secondary,
  },
  stepConnector: {
    position: 'absolute',
    top: 13,
    right: -spacing.sm - 6,
    width: 12,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.border.subtle,
  },
  tipsCard: {
    marginTop: spacing.lg,
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  tipsTitle: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    backgroundColor: colors.primary.blue500,
  },
  tipText: {
    ...typography.body.small,
    flex: 1,
    color: colors.text.secondary,
  },

  fill: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  tapToRevealLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  stage: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  belowSlot: {
    minHeight: 64,
    marginTop: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  metricStack: {
    alignItems: 'center',
    gap: 4,
  },
  hintText: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
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
    letterSpacing: 0,
    color: colors.text.primary,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  warningText: {
    ...typography.caption.caption1,
    fontFamily: fonts.medium,
    color: colors.warning[700],
  },
  bottom: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  timePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  timeValue: {
    ...typography.caption.caption1,
    color: colors.text.secondary,
  },
  phaseLabel: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: 1.2,
    color: colors.neutral[50],
    textAlign: 'center',
  },
  progressBar: {
    height: 3,
    width: '70%',
    borderRadius: 999,
    backgroundColor: colors.primary.blue100,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary.blue600,
  },
  hiddenPlaceholder: {
    opacity: 0,
  },
  introFooter: {
    gap: spacing.sm,
  },
  skip: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  cancel: {
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
});
