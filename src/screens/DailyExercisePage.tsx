import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXERCISE_DARK_THEMES, type ExerciseDarkTheme } from '../theme/exerciseDarkThemes';
import type { BreathingCircleRef } from '../components/exercise/BreathingCircle';
import ExerciseScaffold from '../components/exercise/ExerciseScaffold';
import {
  DAILY_BREATH_HOLD_INTRO_DURATION_MS,
  DailyBreathHoldPresentation,
} from '../components/exercise/DailyBreathHoldPresentation';
import { DailyBreathHoldHud } from '../components/exercise/DailyBreathHoldHud';
import { useLivePulse } from '../hooks/useLivePulse';
import { HeartRateProcessingScreen } from '../components/heartRate/HeartRateProcessingScreen';
import {
  showCameraAccessNeededAlert,
  showHeartRateCameraUnavailableAlert,
} from '../components/heartRate/cameraAccessPrompts';
import { usePostHog } from 'posthog-react-native';
import { AnalyticsEvent } from '../services/analytics/events';
import { captureException } from '../services/analytics/errorTracking';
import type { DailyExerciseScreenProps } from '../app/navigation';
import { isHapticsEnabled } from '../services/preferences/hapticsPreference';
import { useBreathPhaseAudio } from '../hooks/useBreathPhaseAudio';
import { useAmbientAudio } from '../hooks/useAmbientAudio';
import { usePhaseChime } from '../hooks/usePhaseChime';
import {
  AudioSettingsSheet,
  ThemePickerSection,
  useAudioPreferences,
} from '../features/audioSettings';
import { useCancellableFlow } from '../hooks/useCancellableFlow';
import { useHeartRatePlacementFlow } from '../hooks/useHeartRatePlacementFlow';
import { useBreathingHeartRateMonitoringAccess } from '../hooks/useBreathingHeartRateMonitoringAccess';
import { useBreathHoldPhaseSequence } from '../hooks/useBreathHoldPhaseSequence';
import { useBreathHoldCompletionPersistence } from '../hooks/useBreathHoldCompletionPersistence';
import { useAuthStore } from '../stores/authStore';
import { buildCaptureResult } from '../lib/heartRate/captureResult';
import { runAfterNextPaint } from '../lib/ui/runAfterNextPaint';
import { resolveBreathingSessionStart } from '../lib/breathingSessionStart';
import {
  isBreathHoldBreathingPhase,
  type DailyBreathHoldPhase,
} from '../lib/breathHoldPhases';
import {
  buildBreathHoldCompletion,
  type BreathHoldCompletion,
} from '../lib/breathHoldCompletion';

const PRE_BREATH_CYCLES = 3;
const PRE_BREATH_INHALE_SECONDS = 3;
const PRE_BREATH_EXHALE_SECONDS = 6;
const FINAL_INHALE_SECONDS = 4;
const HOLD_RELEASE_GUARD_MS = 1000;
const BEST_HOLD_KEY = 'daily_breath_hold_best_seconds';

export default function DailyExercisePage({
  navigation,
}: DailyExerciseScreenProps) {
  const posthog = usePostHog();
  const user = useAuthStore((state) => state.user);
  const {
    reset: resetCompletionPersistence,
    save: saveCompletedHold,
  } = useBreathHoldCompletionPersistence(
    user?.id ?? null,
    FINAL_INHALE_SECONDS,
  );
  const circleRef = useRef<BreathingCircleRef>(null);
  const introTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const measurementStartAtRef = useRef<number>(0);
  const [phase, setPhase] = useState<DailyBreathHoldPhase>('idle');
  const [bestHoldSeconds, setBestHoldSeconds] = useState(0);
  const [hrEnabled, setHrEnabled] = useState(true);
  const [lastRelease, setLastRelease] = useState<BreathHoldCompletion | null>(null);
  const { preferences: audioPreferences, setThemeId } = useAudioPreferences();
  const activeTheme = useMemo<ExerciseDarkTheme>(
    () =>
      EXERCISE_DARK_THEMES.find((t) => t.id === audioPreferences.themeId) ??
      EXERCISE_DARK_THEMES[0],
    [audioPreferences.themeId],
  );
  const [audioSettingsOpen, setAudioSettingsOpen] = useState(false);
  const isFocused = useIsFocused();

  const breathHoldAudioActive =
    isFocused && (isBreathHoldBreathingPhase(phase) || phase === 'hold');

  useBreathPhaseAudio(
    phase === 'preInhale' || phase === 'inhale'
      ? 'inhale'
      : phase === 'preExhale'
        ? 'exhale'
        : phase === 'hold'
          ? 'hold'
        : null,
    { active: breathHoldAudioActive },
  );
  useAmbientAudio({
    active: breathHoldAudioActive,
  });
  usePhaseChime(phase, { active: breathHoldAudioActive });

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
    heartRateMonitoringAllowed,
    heartRateMonitoringAccessLoading,
    heartRateMonitoringProLocked,
    setHeartRateMonitoringEnabled,
  } = useBreathingHeartRateMonitoringAccess();
  const {
    holdSeconds,
    start: startPrepSequence,
    cancel: cancelPhaseSequence,
    getHoldStartedAtMs,
  } = useBreathHoldPhaseSequence({
    circleRef,
    prepCycles: PRE_BREATH_CYCLES,
    prepInhaleSeconds: PRE_BREATH_INHALE_SECONDS,
    prepExhaleSeconds: PRE_BREATH_EXHALE_SECONDS,
    finalInhaleSeconds: FINAL_INHALE_SECONDS,
    onPhaseChange: setPhase,
    onHoldStarted: beginBpmSampleCollection,
  });

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

  const clearIntroTimeout = useCallback(() => {
    if (introTimeoutRef.current) {
      clearTimeout(introTimeoutRef.current);
      introTimeoutRef.current = null;
    }
  }, []);

  const flow = useCancellableFlow(
    useCallback(() => {
      cancelPhaseSequence();
      clearIntroTimeout();
      stopPulse();
    }, [cancelPhaseSequence, clearIntroTimeout, stopPulse]),
  );

  useEffect(() => {
    if (isFocused || phase === 'done') return;

    setPhase('idle');
  }, [isFocused, phase]);

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: phase !== 'processingResults' });
    return () => {
      navigation.setOptions({ gestureEnabled: true });
    };
  }, [navigation, phase]);

  const startPrepBreathing = useCallback((withHeartRate = hrEnabled) => {
    if (!flow.isActive()) return;
    clearIntroTimeout();
    resetCompletionPersistence();
    measurementStartAtRef.current = 0;
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
    startPrepSequence();
  }, [
    beginPulseMeasurementWindow,
    clearIntroTimeout,
    flow,
    heartRateMonitoringAllowed,
    heartRateMonitoringProLocked,
    hrEnabled,
    posthog,
    resetCompletionPersistence,
    setHeartRateMonitoringEnabled,
    startPrepSequence,
    startPulse,
  ]);

  const { startPlacement } = useHeartRatePlacementFlow({
    flow,
    accessLoading: heartRateMonitoringAccessLoading,
    accessAllowed: heartRateMonitoringAllowed,
    hasPermission,
    requestPermission,
    cameraAvailable: pulse.device != null,
    placementActive: phase === 'placement',
    heartRateEnabled: hrEnabled,
    fingerPlacement: pulse.fingerPlacement,
    signalStatus: pulse.signalStatus,
    bpmLocked:
      isBpmReady && presentedBpm != null && pulse.signalStatus === 'measuring',
    onAccessDenied: () => {
      if (heartRateMonitoringProLocked) {
        setHeartRateMonitoringEnabled(false);
      }
      setHrEnabled(false);
    },
    onPlacementStarted: () => {
      setHrEnabled(true);
      setPhase('placement');
      startPulse();
    },
    onPlacementReady: () => startPrepBreathing(),
    onHeartRateDisabled: () => setHrEnabled(false),
    onPermissionDenied: showCameraAccessNeededAlert,
    onCameraUnavailable: showHeartRateCameraUnavailableAlert,
    onUnexpectedError: (error) => {
      captureException(error, {
        flow: 'daily_breath_hold',
        action: 'start_placement',
        screen_name: 'DailyExercise',
      });
    },
  });

  const startIntroWithoutHeartRate = useCallback(() => {
    if (!flow.start()) return;

    setHrEnabled(false);
    setPhase('intro');
    clearIntroTimeout();
    introTimeoutRef.current = setTimeout(() => {
      if (!flow.isActive()) return;
      startPrepBreathing(false);
    }, DAILY_BREATH_HOLD_INTRO_DURATION_MS);
  }, [clearIntroTimeout, flow, startPrepBreathing]);

  const startDailyExercise = useCallback(() => {
    const decision = resolveBreathingSessionStart({
      heartRatePreferenceLoaded: heartRateMonitoringPreferenceLoaded,
      heartRateMonitoringEnabled,
      heartRateAccessLoading: heartRateMonitoringAccessLoading,
      heartRateAccessAllowed: heartRateMonitoringAllowed,
    });

    if (decision.type === 'not_ready') return;
    if (decision.type === 'start_heart_rate_placement') {
      void startPlacement();
      return;
    }

    if (decision.disableHeartRatePreference) {
      setHeartRateMonitoringEnabled(false);
    }
    startIntroWithoutHeartRate();
  }, [
    heartRateMonitoringAccessLoading,
    heartRateMonitoringAllowed,
    heartRateMonitoringEnabled,
    heartRateMonitoringPreferenceLoaded,
    setHeartRateMonitoringEnabled,
    startIntroWithoutHeartRate,
    startPlacement,
  ]);

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
      const completion = buildBreathHoldCompletion({
        holdSeconds: releasedHoldSeconds,
        previousBestSeconds: bestHoldSeconds,
        measuredStartedAtMs: measurementStartAtRef.current,
        holdStartedAtMs: getHoldStartedAtMs(),
        endedAtMs,
        hasReading: captureResult.reading != null,
        captureSampleCount: captureResult.reading?.sampleCount ?? 0,
        bpmSamples: holdBpmSamples,
      });
      flow.cancel();
      setBestHoldSeconds(completion.bestHoldSeconds);
      setPhase('done');
      if (completion.isNewBest) {
        AsyncStorage.setItem(BEST_HOLD_KEY, String(completion.bestHoldSeconds)).catch(() => {});
      }
      if (isHapticsEnabled() && completion.isNewBest) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else if (isHapticsEnabled()) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      posthog.capture(AnalyticsEvent.DailyBreathHoldReleased, {
        is_new_best: completion.isNewBest,
        hr_monitoring_enabled: hrEnabled,
      });
      void saveCompletedHold(completion);

      setLastRelease(completion);
      navigation.navigate('DailyResult', {
        holdSeconds: releasedHoldSeconds,
        avgBpm: completion.avgBpm ?? undefined,
        minBpm: completion.minBpm ?? undefined,
        maxBpm: completion.maxBpm ?? undefined,
        bpmSamples: completion.graphSamples,
      });
    });
  };

  const tryReleaseHold = () => {
    if (phase !== 'hold') return;
    if (Date.now() - getHoldStartedAtMs() < HOLD_RELEASE_GUARD_MS) return;
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
      bpmSamples: lastRelease?.graphSamples,
    });
  };

  const cancelPlacement = useCallback(() => {
    flow.cancel();
    setPhase('idle');
    navigation.goBack();
  }, [flow, navigation]);

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
          <DailyBreathHoldPresentation
            ref={circleRef}
            phase={phase}
            theme={activeTheme}
            prepCycles={PRE_BREATH_CYCLES}
            prepInhaleSeconds={PRE_BREATH_INHALE_SECONDS}
            prepExhaleSeconds={PRE_BREATH_EXHALE_SECONDS}
            onReleasePress={handleCirclePress}
            heartRate={{
              enabled: hrEnabled,
              active: pulse.active,
              bpm: presentedBpm,
              beatTick: pulse.beatTick,
              samples: pulse.liveSignalSamples,
              fingerPlacement: pulse.fingerPlacement,
              signalStatus: pulse.signalStatus,
              camera:
                pulse.device == null
                  ? undefined
                  : {
                      device: pulse.device,
                      format: pulse.format,
                      frameProcessor: pulse.frameProcessor,
                      torchMode: pulse.torchMode,
                    },
            }}
          />
        }
        bottomSlot={
          <DailyBreathHoldHud
            phase={phase}
            theme={activeTheme}
            holdSeconds={holdSeconds}
            bestHoldSeconds={bestHoldSeconds}
            onSettingsPress={() => setAudioSettingsOpen(true)}
            onCancelPlacement={cancelPlacement}
            onStop={() => navigation.goBack()}
            onStart={handlePrimaryPress}
            onViewResults={handleViewResults}
          />
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
  },
});
