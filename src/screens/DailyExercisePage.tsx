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
import BreathHoldIntro, {
  type BreathHoldStep,
} from '../components/exercise/BreathHoldIntro';
import HoldProgressBar from '../components/exercise/HoldProgressBar';
import { useLivePulse } from '../hooks/useLivePulse';
import { HeartRateCameraPreview } from '../components/heartRate/HeartRateCameraPreview';
import { LiveSignalGraph } from '../components/heartRate/LiveSignalGraph';
import { FindingPulseHint } from '../components/heartRate/FindingPulseHint';
import { HeartRateProcessingScreen } from '../components/heartRate/HeartRateProcessingScreen';
import {
  showCameraAccessNeededAlert,
  showHeartRateCameraUnavailableAlert,
} from '../components/heartRate/cameraAccessPrompts';
import type {
  CaptureResult,
  FingerPlacementState,
  SignalStatus,
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
import { useHeartRateMonitoringPreference } from '../hooks/useHeartRateMonitoringPreference';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { FeatureKey } from '../services/subscriptions/featureAccess';
import { estimateAzoraScore } from '../lib/azoraScore';
import { buildCaptureResult } from '../lib/heartRate/captureResult';
import { runAfterNextPaint } from '../lib/ui/runAfterNextPaint';
import {
  type HeartRateSessionRpcSample,
} from '../lib/heartRate/sessionPayload';
import { buildBpmSeries } from '../lib/heartRate/bpmSeries';

// Placement waits for the first locked BPM so the hold starts with a real
// reading instead of calibrating through the prep breaths. On lock the prep
// breathing starts right away (the BPM number itself is the confirmation). If
// the pulse never locks (cold fingers, low perfusion), fall back to starting
// anyway after a bounded wait — the gate must never hard-block the exercise.
const PLACEMENT_LOCKED_START_DELAY_MS = 250;
const PLACEMENT_LOCK_TIMEOUT_MS = 15000;
const PRE_BREATH_CYCLES = 3;
const PRE_BREATH_INHALE_SECONDS = 3;
const PRE_BREATH_EXHALE_SECONDS = 6;
const FINAL_INHALE_SECONDS = 4;
const HOLD_RELEASE_GUARD_MS = 1000;
const BEST_HOLD_KEY = 'daily_breath_hold_best_seconds';
const SPRING_IN_DURATION_MS = 750;
const CUE_FADE_OUT_MS = 280;
const CUE_FADE_IN_MS = 360;

const INTRO_TITLE = 'Daily Breath Hold';
const INTRO_DESCRIPTION =
  `Take ${PRE_BREATH_CYCLES} slow breaths, one last deep inhale, then hold as long as you ` +
  `comfortably can. Tap to release. Builds CO₂ tolerance, calms your nervous system, and ` +
  `strengthens lung capacity. Over time it trains a steadier, more resilient breath.`;
const INTRO_STEPS: BreathHoldStep[] = [
  { icon: 'arrow-up-bold', value: `${PRE_BREATH_INHALE_SECONDS}s`, label: 'Inhale' },
  { icon: 'arrow-down-bold', value: `${PRE_BREATH_EXHALE_SECONDS}s`, label: 'Exhale' },
  { icon: 'pause', value: 'Max', label: 'Hold' },
];

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

// Warning shown while measuring: prefers the specific signal problem (motion,
// no pulse) over the coarser finger-placement hint so the exercise flow coaches
// the same way the standalone capture screen does.
function signalHint(status: SignalStatus, placement: FingerPlacementState): string {
  switch (status) {
    case 'excessive_motion':
      return 'Too much movement — keep still';
    case 'no_pulse':
      return 'No pulse — adjust your finger';
    case 'partial_coverage':
      return 'Cover the lens fully';
    case 'too_much_pressure':
      return 'Ease up slightly';
    case 'no_finger':
    case 'signal_lost':
      return 'Rest your fingertip on the camera';
    default:
      return placementHint(placement);
  }
}

type HoldPhase =
  | 'idle'
  | 'intro'
  | 'placement'
  | 'preInhale'
  | 'preExhale'
  | 'inhale'
  | 'hold'
  | 'processingResults'
  | 'done';

const PHASE_LABELS: Record<HoldPhase, string> = {
  idle: '',
  intro: '',
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

function buildBreathCueParts(phase: HoldPhase): BreathCuePart[] | null {
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
  const { summary } = buildBpmSeries(bpmSamples, { mode: 'exercise' });

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
  const introTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const releaseAudioTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prepPhaseRunIdRef = useRef(0);
  const measurementStartAtRef = useRef<number>(0);
  const holdStartAtRef = useRef<number>(0);
  const [phase, setPhase] = useState<HoldPhase>('idle');
  const [holdSeconds, setHoldSeconds] = useState(0);
  const [prepCycle, setPrepCycle] = useState(1);
  const [bestHoldSeconds, setBestHoldSeconds] = useState(0);
  const [hrEnabled, setHrEnabled] = useState(true);
  const [lastRelease, setLastRelease] = useState<BreathHoldBpmStats | null>(null);
  const [releaseAudioActive, setReleaseAudioActive] = useState(false);
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

  const cueOpacity = useRef(new Animated.Value(0)).current;
  const [displayedCue, setDisplayedCue] = useState<BreathCuePart[] | null>(null);
  const displayedCueKeyRef = useRef<string | null>(null);

  const transition = useRef(new Animated.Value(phase === 'idle' ? 0 : 1)).current;

  useEffect(() => {
    if (phase === 'intro') {
      transition.setValue(0);
    }
    const toValue = phase === 'idle' ? 0 : 1;
    Animated.timing(transition, {
      toValue,
      duration: SPRING_IN_DURATION_MS,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [phase, transition]);

  const circleOpacity = transition.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0, 0.3, 1],
  });
  const circleScale = transition.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1],
  });
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

  const pulse = useLivePulse({ presentationMode: 'breathExercise' });
  const {
    start: startPulse,
    stop: stopPulse,
    hasPermission,
    requestPermission,
    isBpmReady,
    beginMeasurementWindow: beginPulseMeasurementWindow,
    getMeasurementSamples,
    beginBpmSampleCollection,
    getBpmSamples,
  } = pulse;
  const presentedBpm = pulse.currentBpm;
  const {
    heartRateMonitoringEnabled,
    heartRateMonitoringPreferenceLoaded,
    heartRateMonitoringPreferenceIsUnset,
    setHeartRateMonitoringEnabled,
  } = useHeartRateMonitoringPreference();
  const heartRateMonitoringAccess = useFeatureAccess(FeatureKey.BreathingHeartRateMonitoring);
  const heartRateMonitoringAllowed = heartRateMonitoringAccess.allowed;
  const heartRateMonitoringAccessLoading = heartRateMonitoringAccess.isLoading;
  const heartRateMonitoringProLocked =
    !heartRateMonitoringAllowed && !heartRateMonitoringAccessLoading;

  useEffect(() => {
    if (!heartRateMonitoringProLocked || !heartRateMonitoringEnabled) return;
    setHeartRateMonitoringEnabled(false);
  }, [
    heartRateMonitoringEnabled,
    heartRateMonitoringProLocked,
    setHeartRateMonitoringEnabled,
  ]);

  // Pro users get heart rate monitoring on by default until they explicitly set a preference.
  useEffect(() => {
    if (
      !heartRateMonitoringPreferenceLoaded ||
      !heartRateMonitoringPreferenceIsUnset ||
      !heartRateMonitoringAllowed ||
      heartRateMonitoringEnabled
    ) {
      return;
    }
    setHeartRateMonitoringEnabled(true);
  }, [
    heartRateMonitoringAllowed,
    heartRateMonitoringEnabled,
    heartRateMonitoringPreferenceLoaded,
    heartRateMonitoringPreferenceIsUnset,
    setHeartRateMonitoringEnabled,
  ]);

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
    if (introTimeoutRef.current) {
      clearTimeout(introTimeoutRef.current);
      introTimeoutRef.current = null;
    }
    if (releaseAudioTimeoutRef.current) {
      clearTimeout(releaseAudioTimeoutRef.current);
      releaseAudioTimeoutRef.current = null;
    }
  };

  const flow = useCancellableFlow(
    useCallback(() => {
      prepPhaseRunIdRef.current += 1;
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
    beginBpmSampleCollection();
    holdStartAtRef.current = Date.now();
    setHoldSeconds(0);
    setPhase('hold');
    if (isHapticsEnabled()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    timerRef.current = setInterval(() => {
      setHoldSeconds((current) => current + 1);
    }, 1000);
  }, [beginBpmSampleCollection, flow]);

  const startBreathPhase = useCallback((nextPhase: 'preInhale' | 'preExhale' | 'inhale', cycle: number) => {
    if (!flow.isActive()) return;
    clearTimer();
    const prepPhaseRunId = prepPhaseRunIdRef.current + 1;
    prepPhaseRunIdRef.current = prepPhaseRunId;
    const duration = getBreathingPhaseDuration(nextPhase);
    setPrepCycle(cycle);
    setPhase(nextPhase);

    const scheduleNextPhase = () => {
      if (prepPhaseRunIdRef.current !== prepPhaseRunId || !flow.isActive()) return;
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
    };

    requestAnimationFrame(() => {
      if (!flow.isActive()) return;
      const circle = circleRef.current;
      if (!circle) {
        scheduleNextPhase();
        return;
      }
      if (nextPhase === 'preExhale') {
        stopInhaleVibration();
        circle.contract(duration, scheduleNextPhase);
      } else {
        if (nextPhase === 'preInhale' && cycle === 1) {
          circle.reset();
        }
        startInhaleVibration(duration * 1000);
        circle.expand(duration, scheduleNextPhase);
      }
    });
  }, [beginHold, flow]);

  const startPrepBreathing = useCallback((withHeartRate = hrEnabled) => {
    if (!flow.isActive()) return;
    clearTimer();
    savedSessionKeyRef.current = null;
    savingSessionKeyRef.current = null;
    measurementStartAtRef.current = 0;
    setReleaseAudioActive(false);
    setHoldSeconds(0);
    setPrepCycle(1);
    displayedCueKeyRef.current = null;
    setDisplayedCue(null);
    cueOpacity.setValue(0);
    const shouldMeasureHeartRate = withHeartRate && heartRateMonitoringAllowed;
    if (withHeartRate && heartRateMonitoringProLocked) {
      setHeartRateMonitoringEnabled(false);
      setHrEnabled(false);
    }
    if (shouldMeasureHeartRate) {
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
  }, [
    beginPulseMeasurementWindow,
    flow,
    heartRateMonitoringAllowed,
    heartRateMonitoringProLocked,
    hrEnabled,
    posthog,
    setHeartRateMonitoringEnabled,
    startBreathPhase,
    startPulse,
  ]);

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
    const azoraScore = estimateAzoraScore({
      holdSeconds: completedHoldSeconds,
      avgBpm: avgBpm ?? undefined,
      minBpm: minBpm ?? undefined,
    }).score;

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
        azoraScore,
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
    if (phase === 'hold') {
      circleRef.current?.pause();
    }
  }, [phase]);

  const startPlacement = useCallback(async () => {
    if (heartRateMonitoringAccessLoading) return;
    if (!heartRateMonitoringAllowed) {
      if (heartRateMonitoringProLocked) {
        setHeartRateMonitoringEnabled(false);
      }
      setHrEnabled(false);
      return;
    }
    if (!flow.start()) return;
    try {
      const granted = hasPermission ? true : await requestPermission();
      if (!flow.isActive()) return;
      if (!granted) {
        showCameraAccessNeededAlert();
        setHrEnabled(false);
        flow.cancel();
        return;
      }
      if (pulse.device == null) {
        showHeartRateCameraUnavailableAlert();
        setHrEnabled(false);
        flow.cancel();
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
      showHeartRateCameraUnavailableAlert();
      setHrEnabled(false);
      flow.cancel();
    }
  }, [
    flow,
    hasPermission,
    heartRateMonitoringAccessLoading,
    heartRateMonitoringAllowed,
    heartRateMonitoringProLocked,
    pulse.device,
    requestPermission,
    setHeartRateMonitoringEnabled,
    startPulse,
  ]);

  const startDailyExercise = useCallback(() => {
    if (!heartRateMonitoringPreferenceLoaded) return;
    if (heartRateMonitoringEnabled) {
      if (heartRateMonitoringAccessLoading) return;
      if (!heartRateMonitoringAllowed) {
        if (heartRateMonitoringProLocked) {
          setHeartRateMonitoringEnabled(false);
        }
        if (!flow.start()) return;
        setHrEnabled(false);
        setPhase('intro');
        clearTimer();
        introTimeoutRef.current = setTimeout(() => {
          if (!flow.isActive()) return;
          startPrepBreathing(false);
        }, SPRING_IN_DURATION_MS);
        return;
      }
      void startPlacement();
      return;
    }
    if (!flow.start()) return;
    setHrEnabled(false);
    setPhase('intro');
    clearTimer();
    introTimeoutRef.current = setTimeout(() => {
      if (!flow.isActive()) return;
      startPrepBreathing(false);
    }, SPRING_IN_DURATION_MS);
  }, [
    flow,
    heartRateMonitoringAccessLoading,
    heartRateMonitoringAllowed,
    heartRateMonitoringEnabled,
    heartRateMonitoringPreferenceLoaded,
    heartRateMonitoringProLocked,
    setHeartRateMonitoringEnabled,
    startPlacement,
    startPrepBreathing,
  ]);

  const startPrepBreathingRef = useRef(startPrepBreathing);
  useEffect(() => {
    startPrepBreathingRef.current = startPrepBreathing;
  }, [startPrepBreathing]);

  const placementBpmLocked =
    isBpmReady && pulse.signalStatus === 'measuring';

  useEffect(() => {
    if (phase !== 'placement') return;
    if (!hrEnabled) return;
    if (pulse.fingerPlacement !== 'good') return;
    const t = setTimeout(() => {
      if (!flow.isActive()) return;
      startPrepBreathingRef.current();
    }, placementBpmLocked ? PLACEMENT_LOCKED_START_DELAY_MS : PLACEMENT_LOCK_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [flow, hrEnabled, phase, pulse.fingerPlacement, placementBpmLocked]);


  const releaseHold = () => {
    const endedAtMs = Date.now();
    const captureSamples = getMeasurementSamples();
    const collectedBpmSamples = getBpmSamples();
    const holdBpmSamples = (collectedBpmSamples.length >= 2
      ? collectedBpmSamples
      : []).map((sample) => ({
        offset_ms: sample.offsetMs,
        bpm: sample.bpm,
        signal_quality: sample.signalQuality,
      }));
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
      startDailyExercise();
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
  const activeBreathCueParts = useMemo(() => buildBreathCueParts(phase), [phase]);
  const activeCueKey = useMemo(
    () => (activeBreathCueParts ? activeBreathCueParts.map((part) => part.text).join('') : null),
    [activeBreathCueParts],
  );

  // Sequential calming fade: the current instruction fades fully out before the
  // next fades in, so two cues are never on screen at once (pure opacity, no slide).
  useEffect(() => {
    if (activeCueKey === displayedCueKeyRef.current) return;

    if (displayedCueKeyRef.current === null) {
      displayedCueKeyRef.current = activeCueKey;
      setDisplayedCue(activeBreathCueParts);
      cueOpacity.setValue(0);
      Animated.timing(cueOpacity, {
        toValue: 1,
        duration: CUE_FADE_IN_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
      return;
    }

    let cancelled = false;
    Animated.timing(cueOpacity, {
      toValue: 0,
      duration: CUE_FADE_OUT_MS,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished || cancelled) return;
      displayedCueKeyRef.current = activeCueKey;
      setDisplayedCue(activeBreathCueParts);
      if (activeCueKey === null) return;
      Animated.timing(cueOpacity, {
        toValue: 1,
        duration: CUE_FADE_IN_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
    return () => {
      cancelled = true;
    };
  }, [activeCueKey, activeBreathCueParts, cueOpacity]);

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

  const cameraSlot = null;

  const signalGood =
    pulse.fingerPlacement === 'good' &&
    (pulse.signalStatus === 'measuring' || pulse.signalStatus === 'warming_up');
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
                  bpm={presentedBpm}
                  beatTick={pulse.beatTick}
                  textColor={activeTheme.textPrimary}
                />
              </View>
            )}
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
                pointerEvents="none"
              >
                <BreathHoldIntro
                  title={INTRO_TITLE}
                  description={INTRO_DESCRIPTION}
                  steps={INTRO_STEPS}
                  textColors={{
                    primary: activeTheme.textPrimary,
                    secondary: activeTheme.textSecondary,
                    tertiary: activeTheme.textTertiary,
                    accent: activeTheme.textAccent,
                  }}
                />
              </Animated.View>

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
                  pulse.signalStatus === 'excessive_motion' ||
                  pulse.signalStatus === 'no_pulse' ? (
                    <Text style={[styles.hintText, { color: activeTheme.textSecondary }]}>
                      {signalHint(pulse.signalStatus, pulse.fingerPlacement)}
                    </Text>
                  ) : pulse.fingerPlacement !== 'good' ? (
                    <Text style={[styles.hintText, { color: activeTheme.textSecondary }]}>
                      {placementHint(pulse.fingerPlacement)}
                    </Text>
                  ) : (
                    <FindingPulseHint
                      textStyle={[styles.hintText, { color: activeTheme.textSecondary }]}
                    />
                  )
                ) : phase === 'hold' || isBreathingPhase(phase) ? (
                  <View style={styles.metricStack}>
                    {displayedCue != null ? (
                      <Animated.View style={{ opacity: cueOpacity }}>
                        <Text style={[styles.holdMicroCopy, { color: activeTheme.textSecondary }]}>
                          {displayedCue.map((part, i) => (
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
                          {signalHint(pulse.signalStatus, pulse.fingerPlacement)}
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
                label="Session options"
                iconName="tune-variant"
                color={activeTheme.textPrimary}
                backgroundColor={activeTheme.surface}
                borderColor={activeTheme.surfaceBorder}
                style={styles.settingsPill}
              />
            ) : null}
            {showPrimaryButton ? (
              <View style={styles.btnRow}>
                {isPlacement ? (
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
                ) : (
                  <>
                    <Pressable
                      style={({ pressed }) => [
                        styles.squareBtn,
                        { backgroundColor: activeTheme.surface, borderColor: activeTheme.surfaceBorder },
                        pressed && styles.circleBtnPressed,
                      ]}
                      onPress={() => navigation.goBack()}
                      accessibilityLabel="Stop"
                    >
                      <MaterialCommunityIcons name="stop" size={26} color={activeTheme.iconPrimary} />
                    </Pressable>
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
                        name="play"
                        size={28}
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
        title="Session options"
        heartRateMonitoringLocked={phase !== 'idle' && phase !== 'done'}
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
    fontWeight: '500',
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 1.5,
    color: colors.text.primary,
    opacity: 0.7,
    textAlign: 'center',
  },
  phaseLabelInside: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
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
    fontWeight: '500',
    fontSize: 15,
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
    fontWeight: '500',
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
    fontWeight: '500',
    fontSize: 15,
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
    fontWeight: '500',
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
