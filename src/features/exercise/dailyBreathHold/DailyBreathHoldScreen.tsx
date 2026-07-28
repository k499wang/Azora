import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXERCISE_DARK_THEMES, type ExerciseDarkTheme } from '../../../theme/exerciseDarkThemes';
import type { BreathingCircleRef } from '../shared/components/BreathingCircle';
import ExerciseScaffold from '../shared/components/ExerciseScaffold';
import {
  DAILY_BREATH_HOLD_INTRO_DURATION_MS,
  DailyBreathHoldPresentation,
} from './components/DailyBreathHoldPresentation';
import { DailyBreathHoldHud } from './components/DailyBreathHoldHud';
import { useLivePulse } from '../../../hooks/useLivePulse';
import { HeartRateProcessingScreen } from '../../../components/heartRate/HeartRateProcessingScreen';
import {
  showCameraAccessNeededAlert,
  showHeartRateCameraUnavailableAlert,
} from '../../../components/heartRate/cameraAccessPrompts';
import { usePostHog } from 'posthog-react-native';
import { AnalyticsEvent } from '../../../services/analytics/events';
import { captureException } from '../../../services/analytics/errorTracking';
import type { DailyExerciseScreenProps } from '../../../app/navigation';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import { useBreathPhaseAudio } from '../shared/hooks/useBreathPhaseAudio';
import { useAmbientAudio } from '../shared/hooks/useAmbientAudio';
import { usePhaseChime } from '../shared/hooks/usePhaseChime';
import {
  AudioSettingsSheet,
  ThemePickerSection,
  useAudioPreferences,
} from '../../audioSettings';
import { useCancellableFlow } from '../shared/hooks/useCancellableFlow';
import { useHeartRatePlacementFlow } from '../shared/hooks/useHeartRatePlacementFlow';
import { useBreathingHeartRateMonitoringAccess } from '../shared/hooks/useBreathingHeartRateMonitoringAccess';
import { useBreathHoldPhaseSequence } from './hooks/useBreathHoldPhaseSequence';
import { useBreathHoldCompletionPersistence } from './hooks/useBreathHoldCompletionPersistence';
import { useAuthStore } from '../../../stores/authStore';
import { buildCaptureResult } from '../../../lib/heartRate/captureResult';
import { runAfterNextPaint } from '../../../lib/ui/runAfterNextPaint';
import { resolveBreathingSessionStart } from '../shared/domain/breathingSessionStart';
import {
  isBreathHoldBreathingPhase,
  type DailyBreathHoldPhase,
} from './domain/breathHoldPhases';
import { buildBreathHoldCompletion } from './domain/breathHoldCompletion';
import {
  DAILY_BREATH_HOLD_PROTOCOL,
  isBreathHoldReleaseAllowed,
} from './domain/dailyBreathHoldProtocol';

const BEST_HOLD_KEY = 'daily_breath_hold_best_seconds';
const HUD_HIDE_DELAY_MS = 3000;
const HUD_FADE_IN_DURATION_MS = 200;
const HUD_FADE_OUT_DURATION_MS = 600;

export default function DailyBreathHoldScreen({
  navigation,
}: DailyExerciseScreenProps) {
  const posthog = usePostHog();
  const user = useAuthStore((state) => state.user);
  const {
    reset: resetCompletionPersistence,
    save: saveCompletedHold,
  } = useBreathHoldCompletionPersistence(
    user?.id ?? null,
    DAILY_BREATH_HOLD_PROTOCOL.finalInhaleSeconds,
  );
  const circleRef = useRef<BreathingCircleRef>(null);
  const introTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const measurementStartAtRef = useRef<number>(0);
  const releaseInFlightRef = useRef(false);
  const [phase, setPhase] = useState<DailyBreathHoldPhase>('idle');
  const [bestHoldSeconds, setBestHoldSeconds] = useState(0);
  const [hrEnabled, setHrEnabled] = useState(true);
  const { preferences: audioPreferences, setThemeId } = useAudioPreferences();
  const activeTheme = useMemo<ExerciseDarkTheme>(
    () =>
      EXERCISE_DARK_THEMES.find((t) => t.id === audioPreferences.themeId) ??
      EXERCISE_DARK_THEMES[0],
    [audioPreferences.themeId],
  );
  const [audioSettingsOpen, setAudioSettingsOpen] = useState(false);
  const isFocused = useIsFocused();
  const hudOpacity = useRef(new Animated.Value(1)).current;
  const [hudVisible, setHudVisible] = useState(true);
  const hudHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHudHideTimer = useCallback(() => {
    if (hudHideTimerRef.current == null) return;
    clearTimeout(hudHideTimerRef.current);
    hudHideTimerRef.current = null;
  }, []);

  const resetHud = useCallback(() => {
    clearHudHideTimer();
    hudOpacity.stopAnimation();
    setHudVisible(true);
    hudOpacity.setValue(1);
  }, [clearHudHideTimer, hudOpacity]);

  const showHud = useCallback(() => {
    clearHudHideTimer();
    hudOpacity.stopAnimation();
    setHudVisible(true);
    Animated.timing(hudOpacity, {
      toValue: 1,
      duration: HUD_FADE_IN_DURATION_MS,
      useNativeDriver: true,
    }).start();

    hudHideTimerRef.current = setTimeout(() => {
      hudHideTimerRef.current = null;
      hudOpacity.stopAnimation();
      Animated.timing(hudOpacity, {
        toValue: 0,
        duration: HUD_FADE_OUT_DURATION_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setHudVisible(false);
      });
    }, HUD_HIDE_DELAY_MS);
  }, [clearHudHideTimer, hudOpacity]);

  const pulse = useLivePulse({ initialProfile: 'dailyBreathHold' });
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
    paused,
    start: startPrepSequence,
    pause: pausePhaseSequence,
    resume: resumePhaseSequence,
    cancel: cancelPhaseSequence,
    getHoldStartedAtMs,
    getActiveHoldElapsedMs,
  } = useBreathHoldPhaseSequence({
    circleRef,
    protocol: DAILY_BREATH_HOLD_PROTOCOL,
    onPhaseChange: setPhase,
    onHoldStarted: beginBpmSampleCollection,
  });
  const shouldAutoHideHud = isBreathHoldBreathingPhase(phase) && !paused;

  useEffect(() => {
    if (shouldAutoHideHud) showHud();
    else resetHud();
  }, [resetHud, shouldAutoHideHud, showHud]);

  useEffect(
    () => () => {
      clearHudHideTimer();
      hudOpacity.stopAnimation();
    },
    [clearHudHideTimer, hudOpacity],
  );

  const breathHoldAudioActive =
    isFocused &&
    !paused &&
    (isBreathHoldBreathingPhase(phase) || phase === 'hold');

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
    if (isFocused) return;

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
    releaseInFlightRef.current = false;
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
      prep_cycles: DAILY_BREATH_HOLD_PROTOCOL.prepCycles,
      prep_inhale_seconds: DAILY_BREATH_HOLD_PROTOCOL.prepInhaleSeconds,
      prep_exhale_seconds: DAILY_BREATH_HOLD_PROTOCOL.prepExhaleSeconds,
      final_inhale_seconds: DAILY_BREATH_HOLD_PROTOCOL.finalInhaleSeconds,
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
      introTimeoutRef.current = null;
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
    const releasedHoldSeconds = Math.floor(getActiveHoldElapsedMs() / 1000);
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

      navigation.replace('DailyResult', {
        holdSeconds: releasedHoldSeconds,
        heartRateResultStatus: completion.heartRateResultStatus,
        avgBpm: completion.avgBpm ?? undefined,
        minBpm: completion.minBpm ?? undefined,
        maxBpm: completion.maxBpm ?? undefined,
        bpmSamples: completion.graphSamples,
      });
    });
  };

  const tryReleaseHold = () => {
    if (releaseInFlightRef.current) return;
    if (!isBreathHoldReleaseAllowed({
      phase,
      paused,
      activeHoldElapsedMs: getActiveHoldElapsedMs(),
      releaseGuardMs: DAILY_BREATH_HOLD_PROTOCOL.releaseGuardMs,
    })) {
      return;
    }
    releaseInFlightRef.current = true;
    releaseHold();
  };

  const handlePrimaryPress = () => {
    if (phase === 'idle') {
      startDailyExercise();
    }
  };

  const handlePauseResume = () => {
    if (phase === 'intro') return;

    if (paused) resumePhaseSequence();
    else pausePhaseSequence();
  };

  const handleExit = useCallback(() => {
    releaseInFlightRef.current = false;
    flow.cancel();
    setPhase('idle');
    navigation.goBack();
  }, [flow, navigation]);

  const handleScreenTouchStart = useCallback(() => {
    if (shouldAutoHideHud) showHud();
  }, [shouldAutoHideHud, showHud]);

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
    <View
      style={[styles.fill, { backgroundColor: activeTheme.screen }]}
      onTouchStart={shouldAutoHideHud ? handleScreenTouchStart : undefined}
    >
      <ExerciseScaffold
        darkTheme={activeTheme}
        centerSlot={
          <DailyBreathHoldPresentation
            ref={circleRef}
            phase={phase}
            paused={paused}
            theme={activeTheme}
            protocol={DAILY_BREATH_HOLD_PROTOCOL}
            holdSeconds={holdSeconds}
            bestHoldSeconds={bestHoldSeconds}
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
          <Animated.View
            style={shouldAutoHideHud ? { opacity: hudOpacity } : undefined}
            pointerEvents={shouldAutoHideHud && !hudVisible ? 'none' : 'auto'}
          >
            {phase !== 'hold' ? (
              <DailyBreathHoldHud
                phase={phase}
                paused={paused}
                theme={activeTheme}
                onSettingsPress={() => setAudioSettingsOpen(true)}
                onExit={handleExit}
                onStart={handlePrimaryPress}
                onPauseResume={handlePauseResume}
              />
            ) : null}
          </Animated.View>
        }
      />
      {phase === 'hold' && !paused ? (
        <Pressable
          style={styles.holdReleaseTarget}
          onPress={tryReleaseHold}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Stop breath hold"
          accessibilityHint="Stops the hold and opens your results"
        />
      ) : null}
      <AudioSettingsSheet
        visible={audioSettingsOpen}
        onClose={() => setAudioSettingsOpen(false)}
        title="Session options"
        heartRateMonitoringLocked={phase !== 'idle'}
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
  holdReleaseTarget: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
});
