import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
import { LiveHeartRateMonitor } from '../components/meditation/LiveHeartRateMonitor';
import { PersistentCameraRing } from '../components/heartRate/PersistentCameraRing';
import type { FingerPlacementState, IbiSample, PpgFrameSample } from '../lib/heartRate/types';
import { usePostHog } from 'posthog-react-native';
import { AnalyticsEvent } from '../services/analytics/events';
import { captureException } from '../services/analytics/errorTracking';
import type { DailyExerciseScreenProps } from '../app/navigation';
import { startInhaleVibration, stopInhaleVibration } from '../native/inhaleVibration';
import { isHapticsEnabled } from '../services/preferences/hapticsPreference';
import { useBreathPhaseAudio } from '../hooks/useBreathPhaseAudio';
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

const PLACEMENT_RING_SIZE = 240;
const PLACEMENT_TIMEOUT_SECONDS = 10;

function placementConfig(p: FingerPlacementState): { ringColor: string; status: string } {
  switch (p) {
    case 'good':
      return { ringColor: colors.success[500], status: 'Hold still…' };
    case 'partial':
      return { ringColor: colors.warning[500], status: 'Cover the lens fully' };
    case 'too_much_pressure':
      return { ringColor: '#8B5CF6', status: 'Ease up slightly' };
    case 'no_finger':
    case 'lost':
    default:
      return { ringColor: colors.error[500], status: 'Place your fingertip over the camera' };
  }
}

type HoldPhase = 'idle' | 'placement' | 'inhale' | 'hold' | 'done';

const PHASE_LABELS: Record<HoldPhase, string> = {
  idle: 'Daily Hold',
  placement: 'Place finger',
  inhale: 'Inhale',
  hold: 'Hold',
  done: 'Released',
};

const PLACEMENT_GOOD_DURATION_MS = 1500;

interface BpmSample {
  t: number;
  bpm: number;
}

function summarizeBpmSamples(samples: BpmSample[]): {
  avgBpm: number | null;
  minBpm: number | null;
  maxBpm: number | null;
} {
  const bpms = samples.map((s) => s.bpm);

  return {
    avgBpm: bpms.length
      ? Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length)
      : null,
    minBpm: bpms.length ? Math.min(...bpms) : null,
    maxBpm: bpms.length ? Math.max(...bpms) : null,
  };
}

interface PreviewFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

const BEST_HOLD_KEY = 'daily_breath_hold_best_seconds';

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
  const [bestHoldSeconds, setBestHoldSeconds] = useState(0);
  const [hrEnabled, setHrEnabled] = useState(true);
  const [lastSamples, setLastSamples] = useState<BpmSample[]>([]);
  const [previewFrame, setPreviewFrame] = useState<PreviewFrame | null>(null);
  const [releaseAudioActive, setReleaseAudioActive] = useState(false);

  useBreathPhaseAudio(
    phase === 'inhale' ? 'inhale' : releaseAudioActive ? 'exhale' : null,
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
    getIbiSamples,
  } = pulse;

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
    if (inhaleTimeoutRef.current) {
      clearTimeout(inhaleTimeoutRef.current);
      inhaleTimeoutRef.current = null;
    }
    if (releaseAudioTimeoutRef.current) {
      clearTimeout(releaseAudioTimeoutRef.current);
      releaseAudioTimeoutRef.current = null;
    }
  };

  useEffect(
    () => () => {
      clearTimer();
      stopInhaleVibration();
      stopPulse();
    },
    [stopPulse],
  );

  const cancelPlacement = useCallback(() => {
    clearTimer();
    stopInhaleVibration();
    stopPulse();
    navigation.goBack();
  }, [navigation, stopPulse]);

  const beginHold = useCallback(() => {
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
  }, [beginPulseMeasurementWindow]);

  const INHALE_SECONDS = 6;

  const startInhale = useCallback(() => {
    clearTimer();
    samplesRef.current = [];
    savedSessionKeyRef.current = null;
    savingSessionKeyRef.current = null;
    setLastSamples([]);
    setReleaseAudioActive(false);
    setHoldSeconds(0);
    setPhase('inhale');
    if (hrEnabled) startPulse();
    startInhaleVibration(INHALE_SECONDS * 1000);
    posthog.capture(AnalyticsEvent.DailyBreathHoldStarted);
    inhaleTimeoutRef.current = setTimeout(() => {
      clearTimer();
      beginHold();
    }, INHALE_SECONDS * 1000);
  }, [beginHold, hrEnabled, posthog, startPulse]);

  const saveCompletedHold = useCallback(async (
    completedHoldSeconds: number,
    liveSamples: BpmSample[],
    captureSamples: PpgFrameSample[],
    ibiSamples: IbiSample[],
    endedAtMs: number,
  ) => {
    const startedAtMs = holdStartAtRef.current;
    if (startedAtMs <= 0 || endedAtMs < startedAtMs) return;

    const sessionKey = [
      startedAtMs,
      endedAtMs,
      completedHoldSeconds,
      captureSamples.length,
      ibiSamples.length,
    ].join(':');

    if (
      savedSessionKeyRef.current === sessionKey ||
      savingSessionKeyRef.current === sessionKey
    ) {
      return;
    }

    const result = buildCaptureResult(captureSamples, ibiSamples);
    const reading = result.reading;
    const rpcIbiSamples = mapIbiSamples(result.ibiSamples);
    const bpmSamples = buildBpmSamplesFromIbiSamples(rpcIbiSamples);
    const bpmSummary = summarizeHeartRateBpmSamples(
      buildInstantaneousBpmSamplesFromIbiSamples(rpcIbiSamples),
    );
    const liveSummary = summarizeBpmSamples(liveSamples);
    const avgBpm = reading?.bpm ?? liveSummary.avgBpm;
    const minBpm = bpmSummary.minBpm ?? reading?.bpm ?? liveSummary.minBpm;
    const maxBpm = bpmSummary.maxBpm ?? reading?.bpm ?? liveSummary.maxBpm;
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
        hrDrop: reading?.hrDrop ?? (
          avgBpm != null && minBpm != null ? Math.round(avgBpm - minBpm) : null
        ),
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
    try {
      const granted = hasPermission ? true : await requestPermission();
      if (!granted) {
        setHrEnabled(false);
        startInhale();
        return;
      }
      setHrEnabled(true);
      setPhase('placement');
      startPulse();
    } catch (error) {
      captureException(error, {
        flow: 'daily_breath_hold',
        action: 'start_placement',
        screen_name: 'DailyExercise',
      });
      startInhale();
    }
  }, [hasPermission, requestPermission, startInhale, startPulse]);

  useEffect(() => {
    if (phase !== 'placement') return;
    if (pulse.fingerPlacement !== 'good') return;
    const t = setTimeout(() => {
      startInhale();
    }, PLACEMENT_GOOD_DURATION_MS);
    return () => clearTimeout(t);
  }, [phase, pulse.fingerPlacement, startInhale]);

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
    clearTimer();
    stopInhaleVibration();
    const samples = samplesRef.current.slice();
    const captureSamples = getMeasurementSamples();
    const ibiSamples = getIbiSamples();
    setReleaseAudioActive(false);
    setLastSamples(samples);
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
      bpm_sample_count: samples.length,
    });
    void saveCompletedHold(holdSeconds, samples, captureSamples, ibiSamples, endedAtMs);
    const liveSummary = summarizeBpmSamples(samples);
    const captureResult = buildCaptureResult(captureSamples, ibiSamples);
    const reading = captureResult.reading;
    const avgBpm = reading?.bpm ?? liveSummary.avgBpm ?? undefined;
    const hrDrop = reading?.hrDrop ?? (
      avgBpm != null && liveSummary.minBpm != null
        ? Math.round(avgBpm - liveSummary.minBpm)
        : null
    );
    navigation.navigate('DailyResult', {
      holdSeconds,
      bpmSamples: samples,
      avgBpm,
      minBpm: liveSummary.minBpm ?? undefined,
      maxBpm: liveSummary.maxBpm ?? undefined,
      rmssd: reading?.rmssd ?? null,
      sdnn: reading?.sdnn ?? null,
      hrDrop,
      stress: reading?.stress ?? null,
      confidence: reading?.confidence,
      sampleCount: reading?.sampleCount,
      hrvAvailabilityReason: reading?.hrvAvailabilityReason,
      ibiSamples: captureResult.ibiSamples,
    });
  };

  const HOLD_RELEASE_GUARD_MS = 1000;

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
    const samples = lastSamples;
    const { avgBpm, minBpm, maxBpm } = summarizeBpmSamples(samples);

    posthog.capture(AnalyticsEvent.DailyResultsViewed, {
      hold_seconds: holdSeconds,
      best_hold_seconds: bestHoldSeconds,
      avg_bpm: avgBpm ?? null,
      min_bpm: minBpm ?? null,
      max_bpm: maxBpm ?? null,
    });
    navigation.navigate('DailyResult', {
      holdSeconds,
      bpmSamples: samples,
      avgBpm: avgBpm ?? undefined,
      minBpm: minBpm ?? undefined,
      maxBpm: maxBpm ?? undefined,
    });
  };

  const primaryLabel =
    phase === 'idle'
      ? 'Start'
      : phase === 'inhale'
        ? 'Skip'
        : phase === 'hold'
          ? 'Release'
          : 'Try Again';

  // Placement state: hold-steady arc + start-anyway timeout
  const [placementHoldProgress, setPlacementHoldProgress] = useState(0);
  useEffect(() => {
    if (phase !== 'placement' || pulse.fingerPlacement !== 'good') {
      setPlacementHoldProgress(0);
      return;
    }
    const start = Date.now();
    let raf: number;
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / PLACEMENT_GOOD_DURATION_MS);
      setPlacementHoldProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, pulse.fingerPlacement]);

  const [showStartAnyway, setShowStartAnyway] = useState(false);
  useEffect(() => {
    if (phase !== 'placement') {
      setShowStartAnyway(false);
      return;
    }
    const t = setTimeout(() => setShowStartAnyway(true), PLACEMENT_TIMEOUT_SECONDS * 1000);
    return () => clearTimeout(t);
  }, [phase]);

  const placementCfg = placementConfig(pulse.fingerPlacement);
  const isPlacement = phase === 'placement';
  const pillPreviewStyle = !isPlacement && pulse.active && previewFrame != null
    ? [
        styles.persistentCameraPillPreview,
        {
          top: previewFrame.y - (PLACEMENT_RING_SIZE - previewFrame.height) / 2,
          left: previewFrame.x - (PLACEMENT_RING_SIZE - previewFrame.width) / 2,
        },
      ]
    : null;
  const cameraProps = pulse.device != null
    ? {
        device: pulse.device,
        format: pulse.format,
        frameProcessor: pulse.frameProcessor,
        torchMode: pulse.torchMode,
        isActive: pulse.active,
      }
    : undefined;

  return (
    <View style={styles.fill}>
      {isPlacement ? (
        <SafeAreaView style={styles.placementSafeArea}>
        <View style={styles.placementContainer}>
          <View style={styles.placementTopArea}>
            <Text style={[styles.placementStatus, { color: placementCfg.ringColor }]}>
              {placementCfg.status}
            </Text>
          </View>

          {/* Reserves space for the persistent camera + ring (rendered absolutely) */}
          <View style={styles.placementRingSlot} pointerEvents="none" />

          <View style={styles.placementBottomArea}>
            {showStartAnyway && (
              <TouchableOpacity
                style={styles.startAnywayButton}
                onPress={startInhale}
                activeOpacity={0.85}
              >
                <Text style={styles.startAnywayText}>Start Anyway</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={cancelPlacement}
              activeOpacity={0.7}
              style={styles.placementCancelTouchable}
            >
              <Text style={styles.placementCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
        </SafeAreaView>
      ) : (
        <ExerciseScaffold
      titleSlot={
        <View style={styles.titleSlotWrap}>
          {pulse.active ? (
            <View style={styles.hrRow}>
              <LiveHeartRateMonitor
                active={pulse.active}
                fingerPlacement={pulse.fingerPlacement}
                currentBpm={pulse.currentBpm}
                beatTick={pulse.beatTick}
                device={pulse.device}
                format={pulse.format}
                frameProcessor={pulse.frameProcessor}
                torchMode={pulse.torchMode}
                mountCamera={false}
                showCameraPreview={true}
                onPreviewFrame={setPreviewFrame}
              />
            </View>
          ) : null}
        </View>
      }
      centerSlot={
        <Pressable
          onPress={handleCirclePress}
          disabled={phase !== 'hold' && phase !== 'inhale'}
          accessibilityRole="button"
          accessibilityLabel={
            phase === 'hold'
              ? 'Tap to release hold'
              : phase === 'inhale'
                ? 'Tap to skip inhale and begin hold'
                : undefined
          }
          style={({ pressed }) => [
            styles.circleTapTarget,
            (phase === 'hold' || phase === 'inhale') && pressed && styles.circleTapPressed,
          ]}
        >
          <BreathingCircle ref={circleRef}>
            {phase === 'hold' ? (
              <View style={styles.holdStack}>
                <Text style={styles.holdTimer}>{formatHoldTime(holdSeconds)}</Text>
                <Text style={styles.holdCaption}>{PHASE_LABELS.hold}</Text>
              </View>
            ) : phase === 'inhale' ? (
              <Text style={styles.phaseLabel}>{PHASE_LABELS.inhale}</Text>
            ) : null}
          </BreathingCircle>
        </Pressable>
      }
      bottomSlot={
        <View style={styles.bottomContainer}>
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
          <Pressable
            pointerEvents={phase === 'done' ? 'auto' : 'none'}
            style={({ pressed }) => [styles.viewResultsButton, pressed && styles.circleBtnPressed, phase !== 'done' && styles.viewResultsHidden]}
            onPress={handleViewResults}
          >
            <MaterialCommunityIcons name="chart-line" size={18} color={colors.primary.blue600} style={{ marginRight: spacing.xs }} />
            <Text style={styles.viewResultsText}>View Results</Text>
          </Pressable>
        </View>
      }
    />
      )}
      <View
        pointerEvents="none"
        style={[
          styles.persistentCamera,
          isPlacement
            ? styles.persistentCameraVisible
            : pillPreviewStyle
              ? pillPreviewStyle
              : styles.persistentCameraHidden,
        ]}
      >
        <PersistentCameraRing
          ringColor={isPlacement ? placementCfg.ringColor : colors.primary.blue600}
          trackColor={isPlacement ? placementCfg.ringColor + '33' : colors.border.subtle}
          progress={isPlacement ? placementHoldProgress : 0}
          cameraProps={cameraProps}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  persistentCamera: {
    position: 'absolute',
    zIndex: 0,
  },
  persistentCameraVisible: {
    top: '50%',
    left: '50%',
    width: PLACEMENT_RING_SIZE,
    height: PLACEMENT_RING_SIZE,
    marginTop: -PLACEMENT_RING_SIZE / 2,
    marginLeft: -PLACEMENT_RING_SIZE / 2,
    opacity: 1,
  },
  persistentCameraHidden: {
    top: 0,
    left: 0,
    width: PLACEMENT_RING_SIZE,
    height: PLACEMENT_RING_SIZE,
    opacity: 0,
    transform: [{ scale: 0.01 }],
  },
  persistentCameraPillPreview: {
    width: PLACEMENT_RING_SIZE,
    height: PLACEMENT_RING_SIZE,
    opacity: 1,
    zIndex: 100,
    elevation: 100,
    transform: [{ scale: 20 / PLACEMENT_RING_SIZE }],
  },
  placementSafeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  placementContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  placementTopArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing['6xl'],
    zIndex: 2,
  },
  placementRingSlot: {
    width: PLACEMENT_RING_SIZE,
    height: PLACEMENT_RING_SIZE,
  },
  placementBottomArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.xl,
    gap: spacing.sm,
    zIndex: 2,
  },
  placementStatus: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  startAnywayButton: {
    width: '100%',
    backgroundColor: colors.primary.blue600,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startAnywayText: {
    ...typography.button.large,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  placementCancelTouchable: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  placementCancelText: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
  titleSlotWrap: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  hrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  bottomContainer: {
    alignItems: 'center',
    gap: spacing.lg,
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
  circleBtnDisabled: {
    opacity: 0.4,
  },
  circleTapTarget: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleTapPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  viewResultsHidden: {
    opacity: 0,
  },
  phaseLabel: {
    ...typography.display.display2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 28,
    lineHeight: 34,
    color: colors.neutral[50],
    textAlign: 'center',
  },
  holdStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  holdTimer: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 64,
    lineHeight: 72,
    color: colors.neutral[50],
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  holdCaption: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 18,
    color: colors.neutral[50],
    opacity: 0.75,
    textAlign: 'center',
    marginTop: spacing.xs,
    letterSpacing: 2,
    textTransform: 'uppercase',
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
