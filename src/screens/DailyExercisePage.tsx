import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing } from '../theme/spacing';
import BreathingCircle, {
  BreathingCircleRef,
} from '../components/exercise/BreathingCircle';
import ExerciseScaffold from '../components/exercise/ExerciseScaffold';
import { useLivePulse } from '../hooks/useLivePulse';
import { HeartRateCameraPreview } from '../components/heartRate/HeartRateCameraPreview';
import type {
  CaptureResult,
  FingerPlacementState,
  HrvAvailabilityReason,
  IbiSample,
} from '../lib/heartRate/types';
import { usePostHog } from 'posthog-react-native';
import { AnalyticsEvent } from '../services/analytics/events';
import { captureException } from '../services/analytics/errorTracking';
import type { DailyExerciseScreenProps } from '../app/navigation';
import { startInhaleVibration, stopInhaleVibration } from '../native/inhaleVibration';
import { isHapticsEnabled } from '../services/preferences/hapticsPreference';
import { useBreathPhaseAudio } from '../hooks/useBreathPhaseAudio';
import { useCancellableFlow } from '../hooks/useCancellableFlow';
import { useAuthStore } from '../stores/authStore';
import { useCompleteBreathHoldMutation } from '../queries/tracking/useCompleteBreathHoldMutation';
import { estimateLungAge } from '../lib/lungAge';
import { buildCaptureResult } from '../lib/heartRate/captureResult';
import {
  buildBpmSamplesFromIbiSamples,
  buildInstantaneousBpmSamplesFromIbiSamples,
  mapIbiSamples,
  summarizeBpmSamples as summarizeHeartRateBpmSamples,
} from '../lib/heartRate/sessionPayload';

const PLACEMENT_GOOD_DURATION_MS = 1500;
const INHALE_SECONDS = 6;
const HOLD_RELEASE_GUARD_MS = 1000;
const BEST_HOLD_KEY = 'daily_breath_hold_best_seconds';

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

type HoldPhase = 'idle' | 'placement' | 'inhale' | 'hold' | 'done';

const PHASE_LABELS: Record<HoldPhase, string> = {
  idle: '',
  placement: '',
  inhale: 'Inhale',
  hold: 'Hold',
  done: 'Released',
};

interface BpmSample {
  t: number;
  bpm: number;
}

function formatHoldTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function DailyExercisePage({
  navigation,
}: DailyExerciseScreenProps) {
  const autoStartedRef = useRef(false);
  const savedSessionKeyRef = useRef<string | null>(null);
  const savingSessionKeyRef = useRef<string | null>(null);
  const posthog = usePostHog();
  const user = useAuthStore((state) => state.user);
  const completeBreathHoldMutation = useCompleteBreathHoldMutation(user?.id ?? null);
  const circleRef = useRef<BreathingCircleRef>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inhaleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const releaseAudioTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const samplesRef = useRef<BpmSample[]>([]);
  const holdStartAtRef = useRef<number>(0);
  const [phase, setPhase] = useState<HoldPhase>('idle');
  const [holdSeconds, setHoldSeconds] = useState(0);
  const [inhaleSeconds, setInhaleSeconds] = useState(0);
  const inhaleTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [bestHoldSeconds, setBestHoldSeconds] = useState(0);
  const [hrEnabled, setHrEnabled] = useState(true);
  const [lastRelease, setLastRelease] = useState<{
    ibiSamples: IbiSample[];
    rmssd: number | null;
    sdnn: number | null;
    hrDrop: number | null;
    stress: number | null;
    confidence?: number;
    sampleCount?: number;
    hrvAvailabilityReason?: HrvAvailabilityReason;
    avgBpm?: number;
    minBpm?: number;
    maxBpm?: number;
  } | null>(null);
  const [releaseAudioActive, setReleaseAudioActive] = useState(false);
  const isFocused = useIsFocused();

  const bpmOpacity = useRef(new Animated.Value(0.6)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  useBreathPhaseAudio(
    phase === 'inhale' ? 'inhale' : releaseAudioActive ? 'exhale' : null,
    { active: isFocused },
  );

  const pulse = useLivePulse();
  const {
    start: startPulse,
    stop: stopPulse,
    hasPermission,
    requestPermission,
    currentBpm,
    beginMeasurementWindow: beginPulseMeasurementWindow,
    getMeasurementSamples,
  } = pulse;

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

  const currentBpmRef = useRef<number | null>(null);
  useEffect(() => {
    currentBpmRef.current = currentBpm;
  }, [currentBpm]);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(BEST_HOLD_KEY).then((raw) => {
      if (cancelled || raw == null) return;
      const stored = parseInt(raw, 10);
      if (Number.isFinite(stored) && stored > 0) setBestHoldSeconds(stored);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (inhaleTickRef.current) {
      clearInterval(inhaleTickRef.current);
      inhaleTickRef.current = null;
    }
    if (inhaleTimeoutRef.current) {
      clearTimeout(inhaleTimeoutRef.current);
      inhaleTimeoutRef.current = null;
    }
    if (releaseAudioTimeoutRef.current) {
      clearTimeout(releaseAudioTimeoutRef.current);
      releaseAudioTimeoutRef.current = null;
    }
  };

  const flow = useCancellableFlow(
    useCallback(() => {
      clearTimer();
      stopInhaleVibration();
      stopPulse();
      setReleaseAudioActive(false);
    }, [stopPulse]),
  );

  useEffect(() => {
    if (isFocused || phase === 'done') return;

    setReleaseAudioActive(false);
    setPhase('idle');
  }, [isFocused, phase]);

  const beginHold = useCallback(() => {
    if (!flow.isActive()) return;
    clearTimer();
    stopInhaleVibration();
    samplesRef.current = [];
    holdStartAtRef.current = Date.now();
    beginPulseMeasurementWindow();
    setHoldSeconds(0);
    setPhase('hold');
    if (isHapticsEnabled()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    timerRef.current = setInterval(() => {
      setHoldSeconds((current) => {
        const next = current + 1;
        const bpm = currentBpmRef.current;
        if (bpm != null && Number.isFinite(bpm)) {
          samplesRef.current.push({ t: next, bpm });
        }
        return next;
      });
    }, 1000);
  }, [beginPulseMeasurementWindow, flow]);

  const startInhale = useCallback(() => {
    if (!flow.isActive()) return;
    clearTimer();
    samplesRef.current = [];
    savedSessionKeyRef.current = null;
    savingSessionKeyRef.current = null;
    setReleaseAudioActive(false);
    setHoldSeconds(0);
    setInhaleSeconds(0);
    setPhase('inhale');
    if (hrEnabled) startPulse();
    startInhaleVibration(INHALE_SECONDS * 1000);
    posthog.capture(AnalyticsEvent.DailyBreathHoldStarted);
    inhaleTickRef.current = setInterval(() => {
      setInhaleSeconds((s) => Math.min(INHALE_SECONDS, s + 1));
    }, 1000);
    inhaleTimeoutRef.current = setTimeout(() => {
      if (!flow.isActive()) return;
      clearTimer();
      beginHold();
    }, INHALE_SECONDS * 1000);
  }, [beginHold, flow, hrEnabled, posthog, startPulse]);

  const saveCompletedHold = useCallback(async (
    completedHoldSeconds: number,
    captureSampleCount: number,
    result: CaptureResult,
    endedAtMs: number,
  ) => {
    const startedAtMs = holdStartAtRef.current;
    if (startedAtMs <= 0 || endedAtMs < startedAtMs) return;

    const sessionKey = [
      startedAtMs,
      endedAtMs,
      completedHoldSeconds,
      captureSampleCount,
      result.reading?.sampleCount ?? 0,
      result.ibiSamples.length,
    ].join(':');

    if (
      savedSessionKeyRef.current === sessionKey ||
      savingSessionKeyRef.current === sessionKey
    ) {
      return;
    }

    const reading = result.reading;
    const rpcIbiSamples = mapIbiSamples(result.ibiSamples);
    const bpmSamples = buildBpmSamplesFromIbiSamples(rpcIbiSamples);
    const bpmSummary = summarizeHeartRateBpmSamples(
      buildInstantaneousBpmSamplesFromIbiSamples(rpcIbiSamples),
    );
    const avgBpm = reading?.bpm ?? null;
    const minBpm = bpmSummary.minBpm ?? reading?.bpm ?? null;
    const maxBpm = bpmSummary.maxBpm ?? reading?.bpm ?? null;
    const lungAge = estimateLungAge({
      holdSeconds: completedHoldSeconds,
      avgBpm: avgBpm ?? undefined,
      minBpm: minBpm ?? undefined,
    }).age;

    savingSessionKeyRef.current = sessionKey;
    try {
      await completeBreathHoldMutation.mutateAsync({
        startedAt: new Date(startedAtMs).toISOString(),
        endedAt: new Date(endedAtMs).toISOString(),
        inhaleSeconds: INHALE_SECONDS,
        holdSeconds: completedHoldSeconds,
        avgBpm,
        minBpm,
        maxBpm,
        lungAge,
        rmssd: reading?.rmssd ?? null,
        sdnn: reading?.sdnn ?? null,
        pnn50: reading?.pnn50 ?? null,
        hrDrop: reading?.hrDrop ?? null,
        beatCount: reading?.beatCount ?? null,
        stress: reading?.stress ?? null,
        samples: bpmSamples.map((sample) => ({
          offsetMs: sample.offset_ms,
          bpm: sample.bpm,
          signalQuality: sample.signal_quality,
        })),
        ibiSamples: rpcIbiSamples.map((sample) => ({
          offsetMs: sample.offset_ms,
          ibiMs: sample.ibi_ms,
          signalQuality: sample.signal_quality,
        })),
      });
      savedSessionKeyRef.current = sessionKey;
    } catch (error) {
      captureException(error, {
        flow: 'daily_breath_hold',
        action: 'complete_breath_hold',
        screen_name: 'DailyExercise',
      });
      Alert.alert(
        'Could not save breath hold',
        'Please check your connection and try again.',
      );
    } finally {
      if (savingSessionKeyRef.current === sessionKey) {
        savingSessionKeyRef.current = null;
      }
    }
  }, [completeBreathHoldMutation]);

  useEffect(() => {
    if (phase === 'inhale') {
      circleRef.current?.reset();
      circleRef.current?.expand(INHALE_SECONDS);
      return;
    }
    if (phase === 'hold') {
      circleRef.current?.pause();
    }
  }, [phase]);

  const startPlacement = useCallback(async () => {
    if (!flow.start()) return;
    try {
      const granted = hasPermission ? true : await requestPermission();
      if (!flow.isActive()) return;
      if (!granted) {
        setHrEnabled(false);
        startInhale();
        return;
      }
      setHrEnabled(true);
      setPhase('placement');
      startPulse();
    } catch (error) {
      if (!flow.isActive()) return;
      captureException(error, {
        flow: 'daily_breath_hold',
        action: 'start_placement',
        screen_name: 'DailyExercise',
      });
      startInhale();
    }
  }, [flow, hasPermission, requestPermission, startInhale, startPulse]);

  useEffect(() => {
    if (phase !== 'placement') return;
    if (pulse.fingerPlacement !== 'good') return;
    const t = setTimeout(() => {
      if (!flow.isActive()) return;
      startInhale();
    }, PLACEMENT_GOOD_DURATION_MS);
    return () => clearTimeout(t);
  }, [flow, phase, pulse.fingerPlacement, startInhale]);

  useEffect(() => {
    if (autoStartedRef.current) return;
    autoStartedRef.current = true;
    void startPlacement();
  }, [startPlacement]);

  const skipInhale = () => {
    if (phase !== 'inhale') return;
    clearTimer();
    stopInhaleVibration();
    beginHold();
  };

  const releaseHold = () => {
    const endedAtMs = Date.now();
    const liveSampleCount = samplesRef.current.length;
    const captureSamples = getMeasurementSamples();
    const captureResult = buildCaptureResult(captureSamples);
    flow.cancel();
    setReleaseAudioActive(false);
    const newBest = holdSeconds > bestHoldSeconds && holdSeconds > 0;
    const updatedBest = Math.max(bestHoldSeconds, holdSeconds);
    setBestHoldSeconds(updatedBest);
    setPhase('done');
    stopPulse();
    if (newBest) {
      AsyncStorage.setItem(BEST_HOLD_KEY, String(updatedBest)).catch(() => {});
    }
    if (isHapticsEnabled() && newBest) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else if (isHapticsEnabled()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    posthog.capture(AnalyticsEvent.DailyBreathHoldReleased, {
      hold_seconds: holdSeconds,
      best_hold_seconds: updatedBest,
      is_new_best: newBest,
      hr_monitoring_enabled: hrEnabled,
      bpm_sample_count: liveSampleCount,
    });
    void saveCompletedHold(holdSeconds, captureSamples.length, captureResult, endedAtMs);
    const reading = captureResult.reading;
    const rpcIbiSamples = mapIbiSamples(captureResult.ibiSamples);
    const bpmSummary = summarizeHeartRateBpmSamples(
      buildInstantaneousBpmSamplesFromIbiSamples(rpcIbiSamples),
    );
    const avgBpm = reading?.bpm ?? undefined;
    const minBpm = bpmSummary.minBpm ?? reading?.bpm ?? undefined;
    const maxBpm = bpmSummary.maxBpm ?? reading?.bpm ?? undefined;
    const fallbackHrvReason: HrvAvailabilityReason | undefined =
      reading == null
        ? (captureResult.error === 'too_few_samples'
            ? 'not_enough_clean_beats'
            : 'low_signal_quality')
        : reading.hrvAvailabilityReason;
    const release = {
      ibiSamples: captureResult.ibiSamples,
      rmssd: reading?.rmssd ?? null,
      sdnn: reading?.sdnn ?? null,
      hrDrop: reading?.hrDrop ?? null,
      stress: reading?.stress ?? null,
      confidence: reading?.confidence,
      sampleCount: reading?.sampleCount,
      hrvAvailabilityReason: fallbackHrvReason,
      avgBpm,
      minBpm,
      maxBpm,
    };
    setLastRelease(release);
    navigation.navigate('DailyResult', {
      holdSeconds,
      avgBpm: release.avgBpm,
      minBpm: release.minBpm,
      maxBpm: release.maxBpm,
      rmssd: release.rmssd,
      sdnn: release.sdnn,
      hrDrop: release.hrDrop,
      stress: release.stress,
      confidence: release.confidence,
      sampleCount: release.sampleCount,
      hrvAvailabilityReason: release.hrvAvailabilityReason,
      ibiSamples: release.ibiSamples,
    });
  };

  const tryReleaseHold = () => {
    if (phase !== 'hold') return;
    if (Date.now() - holdStartAtRef.current < HOLD_RELEASE_GUARD_MS) return;
    releaseHold();
  };

  const handleCirclePress = () => {
    if (phase === 'inhale') {
      skipInhale();
      return;
    }
    if (phase === 'hold') {
      tryReleaseHold();
    }
  };

  const handlePrimaryPress = () => {
    if (phase === 'idle' || phase === 'done') {
      void startPlacement();
      return;
    }
    if (phase === 'inhale') {
      skipInhale();
      return;
    }
    if (phase === 'hold') {
      tryReleaseHold();
    }
  };

  const handleViewResults = () => {
    posthog.capture(AnalyticsEvent.DailyResultsViewed, {
      hold_seconds: holdSeconds,
      best_hold_seconds: bestHoldSeconds,
      avg_bpm: lastRelease?.avgBpm ?? null,
      min_bpm: lastRelease?.minBpm ?? null,
      max_bpm: lastRelease?.maxBpm ?? null,
    });
    navigation.navigate('DailyResult', {
      holdSeconds,
      avgBpm: lastRelease?.avgBpm,
      minBpm: lastRelease?.minBpm,
      maxBpm: lastRelease?.maxBpm,
      rmssd: lastRelease?.rmssd ?? null,
      sdnn: lastRelease?.sdnn ?? null,
      hrDrop: lastRelease?.hrDrop ?? null,
      stress: lastRelease?.stress ?? null,
      confidence: lastRelease?.confidence,
      sampleCount: lastRelease?.sampleCount,
      hrvAvailabilityReason: lastRelease?.hrvAvailabilityReason,
      ibiSamples: lastRelease?.ibiSamples ?? [],
    });
  };

  const cancelPlacement = useCallback(() => {
    flow.cancel();
    navigation.goBack();
  }, [flow, navigation]);

  const isPlacement = phase === 'placement';
  const isLive = phase === 'inhale' || phase === 'hold';

  const primaryLabel =
    phase === 'idle'
      ? 'Start'
      : phase === 'inhale'
        ? 'Skip'
        : phase === 'hold'
          ? 'Release'
          : 'Try Again';

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

  const showCamera = (isPlacement || isLive) && pulse.active && cameraProps != null;
  const cameraSlot = showCamera ? <HeartRateCameraPreview {...cameraProps} /> : null;

  const bpmDisplay =
    isLive && pulse.active && pulse.currentBpm != null && pulse.currentBpm > 0
      ? Math.round(pulse.currentBpm)
      : null;
  const signalGood = pulse.fingerPlacement === 'good';
  const showSignalWarning = isLive && pulse.active && !signalGood;

  return (
    <View style={styles.fill}>
      <ExerciseScaffold
        centerSlot={
          <Pressable
            onPress={handleCirclePress}
            disabled={!isLive}
            accessibilityRole="button"
            accessibilityLabel={
              phase === 'hold'
                ? 'Tap to release hold'
                : phase === 'inhale'
                  ? 'Tap to skip inhale and begin hold'
                  : undefined
            }
            style={({ pressed }) => [
              styles.centerStack,
              isLive && pressed && styles.circleTapPressed,
            ]}
          >
            <View style={styles.phaseSlot}>
              {PHASE_LABELS[phase] ? (
                <View style={styles.phaseRow}>
                  <Text style={styles.phaseLabel}>{PHASE_LABELS[phase]}</Text>
                  {isLive ? (
                    <Text style={styles.phaseTimer}>
                      {formatHoldTime(phase === 'inhale' ? inhaleSeconds : holdSeconds)}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
            <BreathingCircle
              ref={circleRef}
              cameraSlot={cameraSlot}
              beatTick={pulse.beatTick}
            />
            <View style={styles.belowSlot}>
              {isPlacement ? (
                <Text style={styles.hintText}>
                  {placementHint(pulse.fingerPlacement)}
                </Text>
              ) : phase === 'hold' || phase === 'inhale' ? (
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
          </Pressable>
        }
        bottomSlot={
          <View style={styles.bottomContainer}>
            <View style={styles.btnRow}>
              {isPlacement ? (
                <>
                  <Pressable
                    style={({ pressed }) => [styles.squareBtn, pressed && styles.circleBtnPressed]}
                    onPress={cancelPlacement}
                    accessibilityLabel="Cancel"
                  >
                    <MaterialCommunityIcons name="close" size={26} color={colors.neutral[900]} />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setHrEnabled(false);
                      stopPulse();
                      startInhale();
                    }}
                    style={({ pressed }) => [
                      styles.inlineLink,
                      pressed && styles.textLinkPressed,
                    ]}
                  >
                    <Text style={styles.textLinkLabel}>Skip heart rate</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable
                  style={({ pressed }) => [styles.circleBtn, pressed && styles.circleBtnPressed]}
                  onPress={handlePrimaryPress}
                  accessibilityLabel={primaryLabel}
                >
                  <MaterialCommunityIcons
                    name={
                      phase === 'idle' || phase === 'done'
                        ? 'play'
                        : phase === 'inhale'
                          ? 'chevron-double-down'
                          : 'hand-back-left-outline'
                    }
                    size={28}
                    color={colors.neutral[900]}
                  />
                </Pressable>
              )}
            </View>
            <Pressable
              pointerEvents={phase === 'done' ? 'auto' : 'none'}
              style={({ pressed }) => [
                styles.viewResultsButton,
                pressed && styles.circleBtnPressed,
                phase !== 'done' && styles.viewResultsHidden,
              ]}
              onPress={handleViewResults}
            >
              <MaterialCommunityIcons name="chart-line" size={18} color={colors.primary.blue600} style={{ marginRight: spacing.xs }} />
              <Text style={styles.viewResultsText}>View Results</Text>
            </Pressable>
          </View>
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
  centerStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleTapPressed: {
    opacity: 0.85,
  },
  phaseSlot: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: spacing.lg,
  },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.md,
  },
  phaseTimer: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: 1,
    color: colors.text.primary,
    opacity: 0.55,
    fontVariant: ['tabular-nums'],
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
    minHeight: 64,
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
    gap: spacing.xs,
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
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: 0.5,
    color: colors.text.primary,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
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
  viewResultsHidden: {
    opacity: 0,
  },
  viewResultsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.accentSoft,
    borderRadius: 18,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary.blue400,
  },
  viewResultsText: {
    ...typography.button.large,
    color: colors.primary.blue600,
  },
});
