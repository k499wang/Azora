import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { EXERCISE_DARK_THEMES, type ExerciseDarkTheme } from '../../../theme/exerciseDarkThemes';
import type { BreathingCircleRef } from '../shared/components/BreathingCircle';
import ExerciseScaffold from '../shared/components/ExerciseScaffold';
import { GuidedBreathingHud } from './components/GuidedBreathingHud';
import {
  GUIDED_BREATHING_INTRO_DURATION_MS,
  GuidedBreathingPresentation,
  type GuidedBreathingPhase,
} from './components/GuidedBreathingPresentation';
import TECHNIQUES from './techniques';
import type { BreathingTechnique } from './techniques';
import { useCancellableFlow } from '../shared/hooks/useCancellableFlow';
import { useLivePulse } from '../../../hooks/useLivePulse';
import { useBreathPhaseAudio } from '../shared/hooks/useBreathPhaseAudio';
import { useAmbientAudio } from '../shared/hooks/useAmbientAudio';
import { usePhaseChime } from '../shared/hooks/usePhaseChime';
import { useHeartRatePlacementFlow } from '../shared/hooks/useHeartRatePlacementFlow';
import { useBreathingHeartRateMonitoringAccess } from '../shared/hooks/useBreathingHeartRateMonitoringAccess';
import {
  AudioSettingsSheet,
  ThemePickerSection,
  useAudioPreferences,
} from '../../audioSettings';
import {
  showCameraAccessNeededAlert,
  showHeartRateCameraUnavailableAlert,
} from '../../../components/heartRate/cameraAccessPrompts';
import { usePostHog } from 'posthog-react-native';
import type { ExerciseSessionScreenProps } from '../../../app/navigation';
import { captureException } from '../../../services/analytics/errorTracking';
import { AnalyticsEvent } from '../../../services/analytics/events';
import { useAuthStore } from '../../../stores/authStore';
import { useCompleteBreathingSessionMutation } from '../../../queries/tracking/useCompleteBreathingSessionMutation';
import { useBreathingPhaseRunner } from './hooks/useBreathingPhaseRunner';
import {
  useGuidedBreathingFlow,
  type GuidedBreathingSequenceCompletion,
} from './hooks/useGuidedBreathingFlow';
import { buildBreathingSessionCompletion } from './domain/breathingSessionCompletion';
import {
  getBreathingSessionProgress,
  getBreathingSessionTargetSeconds,
} from './domain/breathingSessionTiming';
import { resolveBreathingSessionStart } from '../shared/domain/breathingSessionStart';

const MIN_ROUNDS = 1;
const MAX_ROUNDS = 30;

export default function GuidedBreathingSessionScreen({
  navigation,
  route,
}: ExerciseSessionScreenProps) {
  const techniqueId = route.params?.techniqueId;
  const initialTechnique = TECHNIQUES.find((t) => t.id === techniqueId) ?? TECHNIQUES[0];

  const { preferences: audioPreferences, setThemeId } = useAudioPreferences();
  const activeTheme = useMemo<ExerciseDarkTheme>(
    () =>
      EXERCISE_DARK_THEMES.find((t) => t.id === audioPreferences.themeId) ??
      EXERCISE_DARK_THEMES[0],
    [audioPreferences.themeId],
  );
  const [audioSettingsOpen, setAudioSettingsOpen] = useState(false);

  const circleRef = useRef<BreathingCircleRef>(null);
  const introTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionStartMsRef = useRef<number>(0);
  const savedSessionRef = useRef(false);
  const [phase, setPhase] = useState<GuidedBreathingPhase>('idle');
  const [round, setRound] = useState(0);
  const {
    elapsedSeconds: elapsed,
    paused,
    runPhase,
    pause: pausePhase,
    resume: resumePhase,
    resetElapsed,
    getElapsedSeconds,
    cancel: cancelPhase,
  } = useBreathingPhaseRunner({
    circleRef,
    onPhaseChange: setPhase,
  });
  const [technique] = useState<BreathingTechnique>(initialTechnique);
  const [totalRounds, setTotalRounds] = useState(initialTechnique.defaultRounds);
  const [hrEnabled, setHrEnabled] = useState(true);
  const isFocused = useIsFocused();

  const hudOpacity = useRef(new Animated.Value(1)).current;
  const [hudVisible, setHudVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const completeBreathingSessionMutation = useCompleteBreathingSessionMutation(userId);
  const breathingAudioActive =
    isFocused &&
    !paused &&
    (phase === 'inhale' || phase === 'holdIn' || phase === 'exhale' || phase === 'holdOut');

  useBreathPhaseAudio(
    !paused && (phase === 'inhale' || phase === 'exhale')
      ? phase
      : !paused && (phase === 'holdIn' || phase === 'holdOut')
        ? 'hold'
        : null,
    { active: breathingAudioActive },
  );
  useAmbientAudio({
    active: breathingAudioActive,
  });
  usePhaseChime(phase, { active: breathingAudioActive });

  const pulse = useLivePulse({ initialProfile: 'guidedBreathing' });
  const {
    start: startPulse,
    stop: stopPulse,
    hasPermission,
    requestPermission,
    isBpmReady,
    beginBpmSampleCollection,
    pauseBpmSampleCollection,
    resumeBpmSampleCollection,
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

  const isTimedSession =
    phase !== 'idle' &&
    phase !== 'done' &&
    phase !== 'intro' &&
    phase !== 'placement';

  useEffect(() => {
    if (!hrEnabled || !heartRateMonitoringAllowed) {
      stopPulse();
    } else if (isTimedSession) {
      startPulse();
    } else {
      stopPulse();
    }
  }, [
    heartRateMonitoringAllowed,
    hrEnabled,
    isTimedSession,
    startPulse,
    stopPulse,
  ]);

  const clearIntroTimeout = useCallback(() => {
    if (introTimeoutRef.current) {
      clearTimeout(introTimeoutRef.current);
      introTimeoutRef.current = null;
    }
  }, []);

  const flow = useCancellableFlow(
    useCallback(() => {
      cancelPhase();
      clearIntroTimeout();
      stopPulse();
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    }, [cancelPhase, clearIntroTimeout, stopPulse]),
  );

  useEffect(() => {
    if (isFocused || phase === 'done') return;

    setPhase('idle');
  }, [isFocused, phase]);

  const handleSessionCompleted = useCallback(
    ({
      pattern,
      totalRounds: completedRounds,
      elapsedSeconds,
    }: GuidedBreathingSequenceCompletion) => {
      if (savedSessionRef.current) return;
      savedSessionRef.current = true;

      // Finish sampling before cancellation stops the pulse workflow.
      const collectedBpmSamples = getBpmSamples();
      flow.cancel();
      setPhase('done');
      stopPulse();

      const completion = buildBreathingSessionCompletion({
        pattern,
        rounds: completedRounds,
        startedAtMs: sessionStartMsRef.current,
        endedAtMs: Date.now(),
        fallbackElapsedSeconds: elapsedSeconds,
        bpmSamples: collectedBpmSamples,
      });

      posthog.capture(AnalyticsEvent.ExerciseSessionCompleted, {
        technique_id: technique.id,
        technique_name: technique.name,
        technique_category: technique.category,
        total_rounds: completedRounds,
        elapsed_seconds: completion.durationSeconds,
        hr_monitoring_enabled: hrEnabled,
      });

      // Navigate immediately — don't wait for backend persistence.
      navigation.replace('SessionComplete', {
        techniqueId: technique.id,
        techniqueName: technique.name,
        techniqueBpmResponse: technique.heartRateResponse,
        breathCount: completedRounds,
        targetBreaths: completedRounds,
        durationSec: completion.durationSeconds,
        targetSec: completion.targetSeconds,
        cycles: completedRounds,
        targetCycles: completedRounds,
        avgBpm: completion.bpmSummary.avgBpm ?? undefined,
        hrSamples: completion.graphSamples,
      });

      if (userId != null) {
        void completeBreathingSessionMutation.mutateAsync({
          techniqueId: technique.id,
          startedAt: new Date(completion.startedAtMs).toISOString(),
          endedAt: new Date(completion.endedAtMs).toISOString(),
          durationSeconds: completion.durationSeconds,
          roundsCompleted: completedRounds,
          targetRounds: completedRounds,
          avgBpm: completion.bpmSummary.avgBpm,
          minBpm: completion.bpmSummary.minBpm,
          maxBpm: completion.bpmSummary.maxBpm,
          completed: true,
          samples: completion.bpmSamples,
        }).catch((error) => {
          captureException(error, {
            flow: 'breathing_exercise',
            action: 'complete_breathing_session',
            technique_id: technique.id,
          });
        });
      }
    },
    [
      completeBreathingSessionMutation,
      flow,
      getBpmSamples,
      hrEnabled,
      navigation,
      posthog,
      stopPulse,
      technique,
      userId,
    ],
  );

  const startSessionFlow = useGuidedBreathingFlow({
    isActive: flow.isActive,
    runPhase,
    getElapsedSeconds,
    onRoundChange: setRound,
    onComplete: handleSessionCompleted,
  });

  const handlePause = () => {
    pausePhase();
    pauseBpmSampleCollection();
    posthog.capture(AnalyticsEvent.ExerciseSessionPaused, {
      technique_id: technique.id,
      technique_name: technique.name,
      round,
      total_rounds: totalRounds,
      elapsed_seconds: elapsed,
    });
  };

  const handleResume = () => {
    resumeBpmSampleCollection();
    resumePhase();
  };

  const beginExercise = useCallback(
    (withHr: boolean) => {
      if (!flow.start()) return;
      const shouldMeasureHeartRate = withHr && heartRateMonitoringAllowed;
      if (withHr && heartRateMonitoringProLocked) {
        setHeartRateMonitoringEnabled(false);
        setHrEnabled(false);
      }
      resetElapsed();
      setRound(0);
      sessionStartMsRef.current = Date.now();
      savedSessionRef.current = false;
      if (shouldMeasureHeartRate) {
        beginBpmSampleCollection();
      }
      requestAnimationFrame(() => circleRef.current?.reset());
      posthog.capture(AnalyticsEvent.ExerciseSessionStarted, {
        technique_id: technique.id,
        technique_name: technique.name,
        technique_category: technique.category,
        total_rounds: totalRounds,
        hr_monitoring_enabled: shouldMeasureHeartRate,
      });
      startSessionFlow(technique.pattern, totalRounds);
    },
    [
      flow,
      heartRateMonitoringAllowed,
      heartRateMonitoringProLocked,
      posthog,
      setHeartRateMonitoringEnabled,
      technique,
      totalRounds,
      startSessionFlow,
      beginBpmSampleCollection,
      resetElapsed,
    ],
  );

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
    onPlacementReady: () => beginExercise(true),
    onHeartRateDisabled: () => setHrEnabled(false),
    onPermissionDenied: showCameraAccessNeededAlert,
    onCameraUnavailable: showHeartRateCameraUnavailableAlert,
    onUnexpectedError: (error) => {
      captureException(error, {
        flow: 'exercise_session',
        action: 'start_placement',
        screen_name: 'ExerciseSession',
        technique_id: technique.id,
        technique_name: technique.name,
      });
    },
  });

  const startIntroWithoutHeartRate = useCallback(() => {
    if (!flow.start()) return;

    setHrEnabled(false);
    resetElapsed();
    setRound(1);
    setPhase('intro');
    clearIntroTimeout();
    introTimeoutRef.current = setTimeout(() => {
      if (!flow.isActive()) return;
      beginExercise(false);
    }, GUIDED_BREATHING_INTRO_DURATION_MS);
  }, [beginExercise, clearIntroTimeout, flow, resetElapsed]);

  const handleStart = () => {
    if (phase !== 'idle' && phase !== 'done') return;

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
  };

  const handleClose = () => {
    flow.cancel();
    setPhase('idle');
    if (phase !== 'idle' && phase !== 'done') {
      const targetSeconds = getBreathingSessionTargetSeconds(
        technique.pattern,
        totalRounds,
      );
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
    phase !== 'idle' &&
    phase !== 'done' &&
    phase !== 'placement' &&
    phase !== 'intro';
  const isPlacement = phase === 'placement';
  const showSessionControls = isActive || paused || phase === 'intro';

  useEffect(() => {
    if (isActive) {
      showHud();
    } else {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      setHudVisible(true);
      hudOpacity.setValue(1);
    }
  }, [isActive, showHud, hudOpacity]);

  const targetSeconds = getBreathingSessionTargetSeconds(
    technique.pattern,
    totalRounds,
  );
  const progress = getBreathingSessionProgress(
    elapsed,
    targetSeconds,
    phase === 'done',
  );

  const handleScreenTap = () => {
    if (isActive) showHud();
  };

  // Touch listener lives on the root container instead of an invisible
  // overlay: touch events bubble up from every child (camera preview, Skia
  // graph, circle), so nothing can sit above it and swallow the tap while
  // the controls are hidden.
  return (
    <View
      style={[styles.fill, { backgroundColor: activeTheme.screen }]}
      onTouchStart={handleScreenTap}
    >
      <ExerciseScaffold
        darkTheme={activeTheme}
        centerSlot={
          <GuidedBreathingPresentation
            ref={circleRef}
            phase={phase}
            technique={technique}
            theme={activeTheme}
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
            style={isActive ? { opacity: hudOpacity } : undefined}
            pointerEvents={isActive && !hudVisible ? 'none' : 'auto'}
          >
            <GuidedBreathingHud
              theme={activeTheme}
              showProgress={showSessionControls}
              progress={progress}
              currentRound={round}
              totalRounds={totalRounds}
              showRoundsPicker={!showSessionControls && !isPlacement}
              minRounds={MIN_ROUNDS}
              maxRounds={MAX_ROUNDS}
              onRoundsChange={setTotalRounds}
              showSettingsButton={phase === 'idle' || phase === 'done'}
              onSettingsPress={() => setAudioSettingsOpen(true)}
              showPrimaryButton={!isPlacement}
              primaryIcon={showSessionControls && !paused ? 'pause' : 'play'}
              onPrimaryPress={() => {
                if (phase === 'intro') return;
                if (isActive) showHud();
                if (phase === 'idle' || phase === 'done') {
                  handleStart();
                } else if (paused) {
                  handleResume();
                } else {
                  handlePause();
                }
              }}
              onClosePress={() => {
                if (isActive) showHud();
                handleClose();
              }}
            />
          </Animated.View>
        }
      />
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
