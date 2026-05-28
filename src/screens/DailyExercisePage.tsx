import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { EXERCISE_DARK_THEMES, type ExerciseDarkTheme } from '../theme/exerciseDarkThemes';
import BreathingCircle, {
  BreathingCircleRef,
} from '../components/exercise/BreathingCircle';
import ExerciseScaffold from '../components/exercise/ExerciseScaffold';
import HoldProgressBar from '../components/exercise/HoldProgressBar';
import { useLivePulse } from '../hooks/useLivePulse';
import { HeartRateCameraPreview } from '../components/heartRate/HeartRateCameraPreview';
import { LiveSignalGraph } from '../components/heartRate/LiveSignalGraph';
import { HeartRateProcessingScreen } from '../components/heartRate/HeartRateProcessingScreen';
import type {
  CaptureResult,
  FingerPlacementState,
} from '../lib/heartRate/types';
import { usePostHog } from 'posthog-react-native';
import { AnalyticsEvent } from '../services/analytics/events';
import { captureException } from '../services/analytics/errorTracking';
import type { DailyExerciseScreenProps } from '../app/navigation';
import { startInhaleVibration, stopInhaleVibration } from '../native/inhaleVibration';
import { isHapticsEnabled } from '../services/preferences/hapticsPreference';
import { useBreathPhaseAudio } from '../hooks/useBreathPhaseAudio';
import { useAmbientAudio } from '../hooks/useAmbientAudio';
import { usePhaseChime } from '../hooks/usePhaseChime';
import {
  AudioSettingsSheet,
  SettingsGearButton,
  ThemePickerSection,
  useAudioPreferences,
} from '../features/audioSettings';
import { useCancellableFlow } from '../hooks/useCancellableFlow';
import { useAuthStore } from '../stores/authStore';
import { useCompleteBreathHoldMutation } from '../queries/tracking/useCompleteBreathHoldMutation';
import { useShowLiveSignalPreference } from '../hooks/useShowLiveSignalPreference';
import { estimateLungAge } from '../lib/lungAge';
import { buildCaptureResult } from '../lib/heartRate/captureResult';
import { runAfterNextPaint } from '../lib/ui/runAfterNextPaint';
import {
  buildBpmSamplesFromHoldSeconds,
  type HeartRateSessionRpcSample,
} from '../lib/heartRate/sessionPayload';
import { buildBpmSeries } from '../lib/heartRate/bpmSeries';
import { createBpmPresentationFilter } from '../lib/heartRate/bpmSmoothing';

const PLACEMENT_GOOD_DURATION_MS = 1500;
const PRE_BREATH_CYCLES = 3;
const PRE_BREATH_INHALE_SECONDS = 3;
const PRE_BREATH_EXHALE_SECONDS = 6;
const FINAL_INHALE_SECONDS = 4;
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

type HoldPhase =
  | 'idle'
  | 'placement'
  | 'preInhale'
  | 'preExhale'
  | 'inhale'
  | 'hold'
  | 'processingResults'
  | 'done';

const PHASE_LABELS: Record<HoldPhase, string> = {
  idle: '',
  placement: '',
  preInhale: 'Inhale',
  preExhale: 'Exhale',
  inhale: 'Inhale',
  hold: 'Hold',
  processingResults: '',
  done: 'Done',
};

function isBreathingPhase(phase: HoldPhase): boolean {
  return phase === 'preInhale' || phase === 'preExhale' || phase === 'inhale';
}

function getBreathingPhaseDuration(phase: HoldPhase): number {
  if (phase === 'preInhale') return PRE_BREATH_INHALE_SECONDS;
  if (phase === 'preExhale') return PRE_BREATH_EXHALE_SECONDS;
  if (phase === 'inhale') return FINAL_INHALE_SECONDS;
  return 0;
}

interface BreathCuePart {
  text: string;
  emphasis?: boolean;
}

function buildBreathCueParts(phase: HoldPhase, prepCycle: number): BreathCuePart[] | null {
  if (phase === 'preInhale') {
    return [
      { text: 'Easy ' },
      { text: 'inhale', emphasis: true },
      { text: ' through your nose — cycle ' },
      { text: String(prepCycle) },
      { text: ` of ${PRE_BREATH_CYCLES}` },
    ];
  }
  if (phase === 'preExhale') {
    return [
      { text: 'Slow exhale. ' },
      { text: 'Relax your shoulders', emphasis: true },
      { text: ` — cycle ${prepCycle} of ${PRE_BREATH_CYCLES}` },
    ];
  }
  if (phase === 'inhale') {
    return [
      { text: 'Fill up gently, then ' },
      { text: 'stay relaxed', emphasis: true },
    ];
  }
  if (phase === 'hold') {
    return [
      { text: 'Hold', emphasis: true },
      { text: ' your breath for ' },
      { text: 'as long as you can', emphasis: true },
      { text: '. ' },
      { text: 'Tap the screen', emphasis: true },
      { text: ' when you need to breathe.' },
    ];
  }
  return null;
}

interface BpmSample {
  t: number;
  bpm: number;
}

interface BreathHoldBpmStats {
  avgBpm: number | null;
  minBpm: number | null;
  maxBpm: number | null;
  bpmSamples: { offsetMs: number; bpm: number }[];
}

// Breath holds no longer compute HRV. The result is derived entirely from the
// live per-second BPM series captured during the hold — no inter-beat timing
// involved. avg / min / max are taken from the SAME smoothed series that
// HRGraphCard plots (via buildBpmSeries), so the numbers on the result screen
// can never disagree with the graph next to them.
function buildBreathHoldBpmStats(
  _result: CaptureResult,
  holdBpmSamples: HeartRateSessionRpcSample[],
): BreathHoldBpmStats {
  const bpmSamples = holdBpmSamples.map((sample) => ({
    offsetMs: sample.offset_ms,
    bpm: sample.bpm,
  }));
  const { summary } = buildBpmSeries(bpmSamples);

  return {
    avgBpm: summary.avgBpm,
    minBpm: summary.minBpm,
    maxBpm: summary.maxBpm,
    bpmSamples,
  };
}

export default function DailyExercisePage({
  navigation,
}: DailyExerciseScreenProps) {
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
  const measurementStartAtRef = useRef<number>(0);
  const holdStartAtRef = useRef<number>(0);
  const [phase, setPhase] = useState<HoldPhase>('idle');
  const [holdSeconds, setHoldSeconds] = useState(0);
  const [prepCycle, setPrepCycle] = useState(1);
  const [bestHoldSeconds, setBestHoldSeconds] = useState(0);
  const [hrEnabled, setHrEnabled] = useState(true);
  const [lastRelease, setLastRelease] = useState<BreathHoldBpmStats | null>(null);
  const [releaseAudioActive, setReleaseAudioActive] = useState(false);
  const [presentedBpm, setPresentedBpm] = useState<number | null>(null);
  const { preferences: audioPreferences, setThemeId } = useAudioPreferences();
  const activeTheme = useMemo<ExerciseDarkTheme>(
    () =>
      EXERCISE_DARK_THEMES.find((t) => t.id === audioPreferences.themeId) ??
      EXERCISE_DARK_THEMES[0],
    [audioPreferences.themeId],
  );
  const [audioSettingsOpen, setAudioSettingsOpen] = useState(false);
  const isFocused = useIsFocused();

  const bpmOpacity = useRef(new Animated.Value(0.6)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const bpmPresentationFilterRef = useRef(
    createBpmPresentationFilter({
      warmupMs: 5_000,
      maxStepBpm: 3,
      spikeThresholdBpm: 12,
      spikeConfirmationBpm: 4,
    }),
  );
  const lastPresentationUpdateAtRef = useRef(0);

  const cueOpacity = useRef(new Animated.Value(0)).current;
  const cueTranslateY = useRef(new Animated.Value(10)).current;
  const prevPhaseRef = useRef<HoldPhase>(phase);

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

  const circleOpacity = transition.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0, 0.3, 1],
  });
  const circleScale = transition.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1],
  });
  const dailyAudioActive =
    isFocused && (isBreathingPhase(phase) || phase === 'hold');
  const phaseCueAudioActive =
    isFocused && (isBreathingPhase(phase) || phase === 'hold');

  useBreathPhaseAudio(
    phase === 'preInhale' || phase === 'inhale'
      ? 'inhale'
      : phase === 'preExhale' || releaseAudioActive
        ? 'exhale'
        : phase === 'hold'
          ? 'hold'
        : null,
    { active: phaseCueAudioActive || (isFocused && releaseAudioActive) },
  );
  useAmbientAudio({
    active: dailyAudioActive,
  });
  usePhaseChime(phase, { active: phaseCueAudioActive });

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
  const { showLiveSignalEnabled } = useShowLiveSignalPreference();

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
    currentBpmRef.current = presentedBpm;
  }, [presentedBpm]);

  useEffect(() => {
    if (!isBreathingPhase(phase) && phase !== 'hold') return;
    if (currentBpm == null || currentBpm <= 0) return;

    const now = Date.now();
    if (now - lastPresentationUpdateAtRef.current < 900) return;
    lastPresentationUpdateAtRef.current = now;

    const elapsedMs =
      measurementStartAtRef.current > 0
        ? now - measurementStartAtRef.current
        : 0;
    const nextBpm = bpmPresentationFilterRef.current.update({
      elapsedMs,
      bpm: currentBpm,
    });
    if (nextBpm != null) {
      setPresentedBpm(nextBpm);
    }
  }, [currentBpm, phase, pulse.beatTick]);

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

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: phase !== 'processingResults' });
    return () => {
      navigation.setOptions({ gestureEnabled: true });
    };
  }, [navigation, phase]);

  const beginHold = useCallback(() => {
    if (!flow.isActive()) return;
    clearTimer();
    stopInhaleVibration();
    samplesRef.current = [];
    holdStartAtRef.current = Date.now();
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
  }, [flow]);

  const startBreathPhase = useCallback((nextPhase: 'preInhale' | 'preExhale' | 'inhale', cycle: number) => {
    if (!flow.isActive()) return;
    clearTimer();
    const duration = getBreathingPhaseDuration(nextPhase);
    setPrepCycle(cycle);
    setPhase(nextPhase);
    if (nextPhase === 'preExhale') {
      stopInhaleVibration();
    } else {
      startInhaleVibration(duration * 1000);
    }
    inhaleTimeoutRef.current = setTimeout(() => {
      if (!flow.isActive()) return;
      clearTimer();
      if (nextPhase === 'preInhale') {
        startBreathPhase('preExhale', cycle);
        return;
      }
      if (nextPhase === 'preExhale') {
        if (cycle < PRE_BREATH_CYCLES) {
          startBreathPhase('preInhale', cycle + 1);
          return;
        }
        startBreathPhase('inhale', PRE_BREATH_CYCLES);
        return;
      }
      beginHold();
    }, duration * 1000);
  }, [beginHold, flow]);

  const startPrepBreathing = useCallback((withHeartRate = hrEnabled) => {
    if (!flow.isActive()) return;
    clearTimer();
    samplesRef.current = [];
    savedSessionKeyRef.current = null;
    savingSessionKeyRef.current = null;
    measurementStartAtRef.current = 0;
    setPresentedBpm(null);
    bpmPresentationFilterRef.current.reset();
    lastPresentationUpdateAtRef.current = 0;
    setReleaseAudioActive(false);
    setHoldSeconds(0);
    setPrepCycle(1);
    if (withHeartRate) {
      measurementStartAtRef.current = Date.now();
      startPulse();
      beginPulseMeasurementWindow();
    }
    posthog.capture(AnalyticsEvent.DailyBreathHoldStarted, {
      prep_cycles: PRE_BREATH_CYCLES,
      prep_inhale_seconds: PRE_BREATH_INHALE_SECONDS,
      prep_exhale_seconds: PRE_BREATH_EXHALE_SECONDS,
      final_inhale_seconds: FINAL_INHALE_SECONDS,
    });
    startBreathPhase('preInhale', 1);
  }, [beginPulseMeasurementWindow, flow, hrEnabled, posthog, startBreathPhase, startPulse]);

  const saveCompletedHold = useCallback(async (
    completedHoldSeconds: number,
    result: CaptureResult,
    holdBpmSamples: HeartRateSessionRpcSample[],
    endedAtMs: number,
  ) => {
    const holdStartedAtMs = holdStartAtRef.current;
    const measuredStartedAtMs = measurementStartAtRef.current;
    const startedAtMs =
      measuredStartedAtMs > 0
        ? Math.min(measuredStartedAtMs, holdStartedAtMs || measuredStartedAtMs)
        : holdStartedAtMs;
    if (startedAtMs <= 0 || endedAtMs < startedAtMs) return;

    const sessionKey = [
      startedAtMs,
      endedAtMs,
      completedHoldSeconds,
      result.reading?.sampleCount ?? 0,
      holdBpmSamples.length,
    ].join(':');

    if (
      savedSessionKeyRef.current === sessionKey ||
      savingSessionKeyRef.current === sessionKey
    ) {
      return;
    }

    const reading = result.reading;
    const { avgBpm, minBpm, maxBpm } = buildBreathHoldBpmStats(result, holdBpmSamples);
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
        inhaleSeconds: FINAL_INHALE_SECONDS,
        holdSeconds: completedHoldSeconds,
        avgBpm,
        minBpm,
        maxBpm,
        lungAge,
        samples: holdBpmSamples.map((sample) => ({
          offsetMs: sample.offset_ms,
          bpm: sample.bpm,
          signalQuality: sample.signal_quality,
        })),
      });
      savedSessionKeyRef.current = sessionKey;
    } catch (error) {
      const errObj = error as {
        name?: string;
        message?: string;
        stack?: string;
        code?: string;
        details?: string;
        hint?: string;
        status?: number;
        cause?: unknown;
      } | null;
      console.error('[daily-breath-hold] Could not save breath hold', {
        errorName: errObj?.name,
        errorMessage: errObj?.message,
        errorCode: errObj?.code,
        errorDetails: errObj?.details,
        errorHint: errObj?.hint,
        errorStatus: errObj?.status,
        errorCause: errObj?.cause,
        errorStack: errObj?.stack,
        error,
        sessionKey,
        startedAtMs,
        endedAtMs,
        holdSeconds: completedHoldSeconds,
        bpmSampleCount: holdBpmSamples.length,
        hasReading: reading != null,
      });
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
    if (phase === 'preInhale') {
      if (prepCycle === 1) circleRef.current?.reset();
      circleRef.current?.expand(PRE_BREATH_INHALE_SECONDS);
      return;
    }
    if (phase === 'preExhale') {
      circleRef.current?.contract(PRE_BREATH_EXHALE_SECONDS);
      return;
    }
    if (phase === 'inhale') {
      circleRef.current?.expand(FINAL_INHALE_SECONDS);
      return;
    }
    if (phase === 'hold') {
      circleRef.current?.pause();
    }
  }, [phase, prepCycle]);

  const startPlacement = useCallback(async () => {
    if (!flow.start()) return;
    try {
      const granted = hasPermission ? true : await requestPermission();
      if (!flow.isActive()) return;
      if (!granted) {
        setHrEnabled(false);
        startPrepBreathing(false);
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
      startPrepBreathing(false);
    }
  }, [flow, hasPermission, requestPermission, startPrepBreathing, startPulse]);

  useEffect(() => {
    if (!isFocused || phase !== 'idle') return;
    void startPlacement();
  }, [isFocused, phase, startPlacement]);

  const startPrepBreathingRef = useRef(startPrepBreathing);
  useEffect(() => {
    startPrepBreathingRef.current = startPrepBreathing;
  }, [startPrepBreathing]);

  useEffect(() => {
    if (phase !== 'placement') return;
    if (pulse.fingerPlacement !== 'good') return;
    const t = setTimeout(() => {
      if (!flow.isActive()) return;
      startPrepBreathingRef.current();
    }, PLACEMENT_GOOD_DURATION_MS);
    return () => clearTimeout(t);
  }, [flow, phase, pulse.fingerPlacement]);


  const releaseHold = () => {
    const endedAtMs = Date.now();
    const captureSamples = getMeasurementSamples();
    const holdBpmSamples = buildBpmSamplesFromHoldSeconds(samplesRef.current);
    const releasedHoldSeconds = holdSeconds;
    setPhase('processingResults');

    void runAfterNextPaint(() => {
      const captureResult = buildCaptureResult(captureSamples, 'quick');
      flow.cancel();
      setReleaseAudioActive(false);
      const newBest = releasedHoldSeconds > bestHoldSeconds && releasedHoldSeconds > 0;
      const updatedBest = Math.max(bestHoldSeconds, releasedHoldSeconds);
      setBestHoldSeconds(updatedBest);
      setPhase('done');
      if (newBest) {
        AsyncStorage.setItem(BEST_HOLD_KEY, String(updatedBest)).catch(() => {});
      }
      if (isHapticsEnabled() && newBest) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else if (isHapticsEnabled()) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      posthog.capture(AnalyticsEvent.DailyBreathHoldReleased, {
        is_new_best: newBest,
        hr_monitoring_enabled: hrEnabled,
      });
      void saveCompletedHold(releasedHoldSeconds, captureResult, holdBpmSamples, endedAtMs);

      const release = buildBreathHoldBpmStats(captureResult, holdBpmSamples);
      setLastRelease(release);
      navigation.navigate('DailyResult', {
        holdSeconds: releasedHoldSeconds,
        avgBpm: release.avgBpm ?? undefined,
        minBpm: release.minBpm ?? undefined,
        maxBpm: release.maxBpm ?? undefined,
        bpmSamples: release.bpmSamples,
      });
    });
  };

  const tryReleaseHold = () => {
    if (phase !== 'hold') return;
    if (Date.now() - holdStartAtRef.current < HOLD_RELEASE_GUARD_MS) return;
    releaseHold();
  };

  const handleCirclePress = () => {
    if (phase === 'hold') {
      tryReleaseHold();
    }
  };

  const handlePrimaryPress = () => {
    if (phase === 'idle' || phase === 'done') {
      void startPlacement();
    }
  };

  const handleViewResults = () => {
    posthog.capture(AnalyticsEvent.DailyResultsViewed, {
      hr_monitoring_enabled: lastRelease?.avgBpm != null,
    });
    navigation.navigate('DailyResult', {
      holdSeconds,
      avgBpm: lastRelease?.avgBpm ?? undefined,
      minBpm: lastRelease?.minBpm ?? undefined,
      maxBpm: lastRelease?.maxBpm ?? undefined,
      bpmSamples: lastRelease?.bpmSamples,
    });
  };

  const cancelPlacement = useCallback(() => {
    flow.cancel();
    setPhase('idle');
    navigation.goBack();
  }, [flow, navigation]);

  const isPlacement = phase === 'placement';
  const isLive = isBreathingPhase(phase) || phase === 'hold';
  const activeBreathCueParts = useMemo(() => buildBreathCueParts(phase, prepCycle), [phase, prepCycle]);

  if (prevPhaseRef.current !== phase) {
    prevPhaseRef.current = phase;
    cueOpacity.setValue(0);
    cueTranslateY.setValue(10);
  }

  useEffect(() => {
    if (!isBreathingPhase(phase) && phase !== 'hold') return;
    Animated.parallel([
      Animated.timing(cueOpacity, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cueTranslateY, {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [phase]);

  const primaryLabel = phase === 'idle' ? 'Start' : 'Try Again';

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
    isLive && pulse.active && pulse.currentBpm != null && presentedBpm != null
      ? Math.round(presentedBpm)
      : null;
  const signalGood = pulse.fingerPlacement === 'good';
  const showSignalWarning = isLive && pulse.active && !signalGood;

  const showSettingsPill = phase === 'idle' || phase === 'done';
  const showPrimaryButton = phase === 'idle' || phase === 'done' || isPlacement;
  const tapAnywhereToRelease = phase === 'hold';

  if (phase === 'processingResults') {
    return (
      <HeartRateProcessingScreen
        title="Reading your recovery signal"
        message="Turning your heart rhythm into today's results"
        backgroundColor={activeTheme.screen}
        accentColor={activeTheme.textAccent}
        titleColor={activeTheme.textPrimary}
        messageColor={activeTheme.textSecondary}
      />
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: activeTheme.screen }]}>
      <ExerciseScaffold
        darkTheme={activeTheme}
        centerSlot={
          <View style={styles.centerSlotWrap}>
            {hrEnabled && pulse.active && (
              <View style={styles.liveSignalGraphSlot} pointerEvents="none">
                <LiveSignalGraph
                  samples={pulse.liveSignalSamples}
                  fingerPlacement={pulse.fingerPlacement}
                  bpm={isLive ? presentedBpm : null}
                  beatTick={pulse.beatTick}
                  textColor={activeTheme.textPrimary}
                  showLine={showLiveSignalEnabled}
                />
              </View>
            )}
            <View style={styles.contentArea}>
              <Animated.View
                style={[
                  styles.contentLayer,
                  {
                    opacity: circleOpacity,
                    transform: [{ scale: circleScale }],
                  },
                ]}
                pointerEvents={phase === 'idle' ? 'none' : 'auto'}
              >
                <Pressable
                  onPress={handleCirclePress}
                  disabled={phase !== 'hold'}
                  accessibilityRole="button"
                  accessibilityLabel={phase === 'hold' ? 'Tap to release hold' : undefined}
                  style={({ pressed }) => [
                    styles.centerStack,
                    phase === 'hold' && pressed && styles.circleTapPressed,
                  ]}
                >
                  <BreathingCircle
                    ref={circleRef}
                    cameraSlot={cameraSlot}
                    beatTick={pulse.beatTick}
                    themeColors={{
                      outline: activeTheme.circleOutline,
                      outlineOpacity: activeTheme.circleOutlineOpacity,
                      outer: activeTheme.circleOuter,
                      outerOpacity: activeTheme.circleOuterOpacity,
                      inner: activeTheme.circleInner,
                      beatPulse: activeTheme.beatPulse,
                      beatFlush: activeTheme.beatFlush,
                    }}
                  >
                    {PHASE_LABELS[phase] ? (
                      <Text style={[styles.phaseLabelInside, { color: colors.neutral[50] }]}>
                        {PHASE_LABELS[phase]}
                      </Text>
                    ) : null}
                  </BreathingCircle>
                </Pressable>
              </Animated.View>
              <View style={styles.belowSlot} pointerEvents="none">
                {isPlacement ? (
                  <Text style={[styles.hintText, { color: activeTheme.textSecondary }]}>
                    {placementHint(pulse.fingerPlacement)}
                  </Text>
                ) : phase === 'hold' || isBreathingPhase(phase) ? (
                  <View style={styles.metricStack}>
                    {activeBreathCueParts != null ? (
                      <Animated.View
                        style={{ opacity: cueOpacity, transform: [{ translateY: cueTranslateY }] }}
                      >
                        <Text style={[styles.holdMicroCopy, { color: activeTheme.textSecondary }]}>
                          {activeBreathCueParts.map((part, i) => (
                            <Text
                              key={i}
                              style={
                                part.emphasis
                                  ? [styles.holdMicroCopyEmphasis, { color: activeTheme.textPrimary }]
                                  : undefined
                              }
                            >
                              {part.text}
                            </Text>
                          ))}
                        </Text>
                      </Animated.View>
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
          </View>
        }
        bottomSlot={
          <View style={styles.bottomContainer}>
            {phase === 'hold' ? (
              <HoldProgressBar
                holdSeconds={holdSeconds}
                bestSeconds={bestHoldSeconds}
                textColor={activeTheme.textPrimary}
                trackColor={activeTheme.surface}
                fillColor={activeTheme.textAccent}
              />
            ) : null}
            {showSettingsPill ? (
              <SettingsGearButton
                onPress={() => setAudioSettingsOpen(true)}
                label="Audio & voice"
                color={activeTheme.textPrimary}
                backgroundColor={activeTheme.surface}
                borderColor={activeTheme.surfaceBorder}
                style={styles.settingsPill}
              />
            ) : null}
            {showPrimaryButton ? (
              <View style={styles.btnRow}>
                {isPlacement ? (
                  <>
                    <Pressable
                      style={({ pressed }) => [
                        styles.squareBtn,
                        { backgroundColor: activeTheme.surface, borderColor: activeTheme.surfaceBorder },
                        pressed && styles.circleBtnPressed,
                      ]}
                      onPress={cancelPlacement}
                      accessibilityLabel="Cancel"
                    >
                      <MaterialCommunityIcons name="close" size={26} color={activeTheme.iconPrimary} />
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.circleBtn,
                        { backgroundColor: activeTheme.surface, borderColor: activeTheme.surfaceBorder },
                        pressed && styles.circleBtnPressed,
                      ]}
                      onPress={() => setAudioSettingsOpen(true)}
                      accessibilityLabel="Audio & voice"
                    >
                      <MaterialCommunityIcons
                        name="cog-outline"
                        size={26}
                        color={activeTheme.iconPrimary}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setHrEnabled(false);
                        stopPulse();
                        startPrepBreathing(false);
                      }}
                      style={({ pressed }) => [
                        styles.inlineLink,
                        pressed && styles.textLinkPressed,
                      ]}
                    >
                      <Text style={[styles.textLinkLabel, { color: activeTheme.textTertiary }]}>Skip heart rate</Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Pressable
                      style={({ pressed }) => [
                        styles.circleBtn,
                        { backgroundColor: activeTheme.surface, borderColor: activeTheme.surfaceBorder },
                        pressed && styles.circleBtnPressed,
                      ]}
                      onPress={handlePrimaryPress}
                      accessibilityLabel={primaryLabel}
                    >
                      <MaterialCommunityIcons
                        name={phase === 'idle' || phase === 'done' ? 'play' : 'hand-back-left-outline'}
                        size={28}
                        color={activeTheme.iconPrimary}
                      />
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.circleBtn,
                        { backgroundColor: activeTheme.surface, borderColor: activeTheme.surfaceBorder },
                        pressed && styles.circleBtnPressed,
                      ]}
                      onPress={() => setAudioSettingsOpen(true)}
                      accessibilityLabel="Audio & voice"
                    >
                      <MaterialCommunityIcons
                        name="cog-outline"
                        size={26}
                        color={activeTheme.iconPrimary}
                      />
                    </Pressable>
                  </>
                )}
              </View>
            ) : null}
            <Pressable
              pointerEvents={phase === 'done' ? 'auto' : 'none'}
              style={({ pressed }) => [
                styles.viewResultsButton,
                { backgroundColor: activeTheme.surface, borderColor: activeTheme.surfaceBorder },
                pressed && styles.circleBtnPressed,
                phase !== 'done' && styles.viewResultsHidden,
              ]}
              onPress={handleViewResults}
            >
              <MaterialCommunityIcons name="chart-line" size={18} color={activeTheme.textAccent} style={{ marginRight: spacing.xs }} />
              <Text style={[styles.viewResultsText, { color: activeTheme.textPrimary }]}>View Results</Text>
            </Pressable>
          </View>
        }
      />
      {tapAnywhereToRelease ? (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={tryReleaseHold}
          accessibilityRole="button"
          accessibilityLabel="Tap anywhere to release hold"
        />
      ) : null}
      <AudioSettingsSheet
        visible={audioSettingsOpen}
        onClose={() => setAudioSettingsOpen(false)}
        extraSectionsTop={
          <ThemePickerSection
            activeThemeId={activeTheme.id}
            onSelect={(theme) => setThemeId(theme.id)}
          />
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
    position: 'absolute',
    top: -52,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.md,
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
  phaseLabelInside: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: 1.2,
    color: colors.neutral[50],
    textAlign: 'center',
  },
  belowSlot: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: spacing.lg,
    alignItems: 'center',
    justifyContent: 'flex-start',
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
    gap: spacing.sm,
  },
  bpmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
    gap: spacing.xs,
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
  settingsPill: {
    alignSelf: 'center',
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
  contentArea: {
    width: 340,
    height: 300,
    marginBottom: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSlotWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveSignalGraphSlot: {
    position: 'absolute',
    top: -102,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  contentLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  holdMicroCopy: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    maxWidth: 320,
  },
  holdMicroCopyEmphasis: {
    fontFamily: fonts.bold,
  },
});
