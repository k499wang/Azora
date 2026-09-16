import { Text } from '../../common/Text';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Device from 'expo-device';
import { useHeartRateStream } from '../../../hooks/useHeartRateStream';
import { useHeartRateStallHelp } from '../../../hooks/useHeartRateStallHelp';
import { HeartRateHelpSheet } from '../../heartRate/HeartRateHelpSheet';
import { createBpmPresentationFilter } from '../../../lib/heartRate/bpmSmoothing';
import {
  getCameraCheckMessage,
  getHeartRateCameraTarget,
  getMeasurementCorrectionMessage,
  hasConfirmedPulse,
} from '../../../lib/heartRate/captureGuidance';
import type { FingerPlacementState, SignalStatus } from '../../../lib/heartRate/types';
import { analyzeDurationMs, countAnswered } from '../../../lib/onboardingAnalyze';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { BaselineCaptureStage } from '../baseline/BaselineCaptureStage';
import HeartRatePlacementCarousel, {
  HEART_RATE_PREP_STEPS,
} from '../baseline/HeartRatePlacementCarousel';
import BaselineHeartRateResult from '../baseline/BaselineHeartRateResult';
import QuickAnalyzeScreen from './QuickAnalyzeScreen';
import type {
  CompletedOnboardingBaselineResult,
  OnboardingBaselineResult,
} from '../types';

interface BaselineScreenProps {
  stepIndex: number;
  stepCount: number;
  age: number;
  onContinue: (result: CompletedOnboardingBaselineResult) => void;
  initialResult?: CompletedOnboardingBaselineResult | null;
  onResultCaptured: (result: CompletedOnboardingBaselineResult) => void;
  onSkip: (attempt: OnboardingBaselineResult) => void;
  onBack: () => void;
}

type Phase = 'intro' | 'placement' | 'running' | 'analyzing' | 'result';

const SESSION_MS = 10_000;

const PULSE_CONFIRMATION_DURATION_MS = 500;
const PROGRESS_UPDATE_INTERVAL_MS = 200;

function placementConfig(
  fingerPlacement: FingerPlacementState,
  signalStatus: SignalStatus,
  pulseConfirmed: boolean,
  cameraTarget: string,
): { ringColor: string; status: string } {
  const isPlacementError =
    fingerPlacement === 'no_finger' || fingerPlacement === 'lost';
  const needsCorrection =
    fingerPlacement === 'partial' ||
    fingerPlacement === 'too_much_pressure' ||
    signalStatus === 'partial_coverage' ||
    signalStatus === 'too_much_pressure' ||
    signalStatus === 'no_pulse' ||
    signalStatus === 'excessive_motion';

  return {
    ringColor: pulseConfirmed
      ? colors.success[500]
      : isPlacementError
        ? colors.error[500]
        : needsCorrection
          ? colors.warning[500]
          : colors.primary.blue500,
    status: getCameraCheckMessage({
      fingerPlacement,
      signalStatus,
      pulseConfirmed,
      cameraTarget,
    }),
  };
}

// Warning shown while measuring: prefers the specific signal problem (motion,
// no pulse) over the coarser finger-placement hint so the baseline capture
// coaches the same way the standalone capture screen does.
function measuringWarning(
  status: SignalStatus,
  placement: FingerPlacementState,
  cameraTarget: string,
): string | null {
  return getMeasurementCorrectionMessage(status, placement, cameraTarget);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((s, v) => s + v, 0) / values.length);
}

export default function BaselineScreen({
  stepIndex,
  stepCount,
  age,
  onContinue,
  initialResult = null,
  onResultCaptured,
  onSkip,
  onBack,
}: BaselineScreenProps) {
  const stream = useHeartRateStream();
  const [phase, setPhase] = useState<Phase>(initialResult ? 'result' : 'intro');
  const [result, setResult] =
    useState<CompletedOnboardingBaselineResult | null>(initialResult);
  const [progress, setProgress] = useState(0);
  const [prepStep, setPrepStep] = useState(0);
  const cameraTarget = getHeartRateCameraTarget(Device.modelName, Device.modelId);

  const startedAtRef = useRef<number | null>(null);
  const earlyBpmsRef = useRef<number[]>([]);
  const lateBpmsRef = useRef<number[]>([]);
  const allBpmsRef = useRef<number[]>([]);
  const lastSeenBeatTickRef = useRef(0);
  const bpmPresentationFilterRef = useRef(
    createBpmPresentationFilter({
      warmupMs: 2_000,
      minStableReadings: 2,
      maxStepBpm: 4,
      spikeThresholdBpm: 14,
      spikeConfirmationBpm: 5,
    }),
  );
  const rafRef = useRef<number | null>(null);
  const captureFinishedRef = useRef(false);

  const hudOpacity = useRef(new Animated.Value(1)).current;
  const [hudVisible, setHudVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bpmOpacity = useRef(new Animated.Value(0.6)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  const hasConfirmedSignal =
    stream.streamState === 'streaming' &&
    hasConfirmedPulse({
      fingerPlacement: stream.fingerPlacement,
      signalStatus: stream.signalStatus,
      bpm: stream.currentBpm,
    });
  const placementCfg = placementConfig(
    stream.fingerPlacement,
    stream.signalStatus,
    hasConfirmedSignal,
    cameraTarget,
  );
  const hasUsableFingerSignal =
    stream.fingerPlacement === 'good' || stream.fingerPlacement === 'partial';
  const visibleBeatTick = hasUsableFingerSignal ? stream.beatTick : 0;
  const bpmDisplay =
    phase === 'running' && stream.currentBpm != null && stream.currentBpm > 0
      ? Math.round(stream.currentBpm)
      : null;
  const signalWarning =
    phase === 'running'
      ? measuringWarning(stream.signalStatus, stream.fingerPlacement, cameraTarget)
      : null;

  const stallHelp = useHeartRateStallHelp({
    active: phase === 'placement',
    pulseConfirmed: hasConfirmedSignal,
    fingerPlacement: stream.fingerPlacement,
    signalStatus: stream.signalStatus,
    context: 'onboarding_baseline',
  });

  useEffect(() => {
    if (visibleBeatTick <= lastSeenBeatTickRef.current) return;
    lastSeenBeatTickRef.current = visibleBeatTick;
    if ((phase === 'placement' || phase === 'running') && isHapticsEnabled()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    if (phase !== 'running') return;
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
  }, [visibleBeatTick, phase, bpmOpacity, heartScale]);

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

  const cameraProps = useMemo(() => {
    if (stream.device == null) return null;
    return {
      device: stream.device,
      format: stream.format,
      frameProcessor: stream.frameProcessor,
      torchMode: stream.torchMode,
      isActive: phase === 'placement' || phase === 'running',
    };
  }, [
    stream.device,
    stream.format,
    stream.frameProcessor,
    stream.torchMode,
    phase,
  ]);

  const finishCapture = (completed: boolean) => {
    if (captureFinishedRef.current) return;
    captureFinishedRef.current = true;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    stream.stopStream();

    const earlyBpm = average(earlyBpmsRef.current);
    const lateBpm = average(lateBpmsRef.current);
    const avgBpm = average(allBpmsRef.current);
    const bpmDrop =
      earlyBpm != null && lateBpm != null ? earlyBpm - lateBpm : null;
    const durationSec = startedAtRef.current
      ? Math.round((Date.now() - startedAtRef.current) / 1000)
      : 0;

    const attempt: OnboardingBaselineResult = {
      completed,
      avgBpm,
      earlyBpm,
      lateBpm,
      bpmDrop,
      durationSec,
      bpmHistory: allBpmsRef.current.slice(),
    };

    if (completed && avgBpm != null) {
      const completedResult: CompletedOnboardingBaselineResult = {
        ...attempt,
        completed: true,
        avgBpm,
      };
      if (isHapticsEnabled()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
          () => {},
        );
      }
      onResultCaptured(completedResult);
      setResult(completedResult);
      setPhase('analyzing');
      return;
    }

    onSkip(attempt);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      stream.stopStream();
    };
  }, []);

  useEffect(() => {
    const elapsed = startedAtRef.current
      ? Date.now() - startedAtRef.current
      : 0;

    if (
      phase !== 'running' ||
      !hasUsableFingerSignal ||
      stream.currentBpm == null ||
      stream.currentBpm <= 0
    ) {
      return;
    }

    if (!hasConfirmedSignal) return;

    const nextBpm = bpmPresentationFilterRef.current.update({
      elapsedMs: elapsed,
      bpm: stream.currentBpm,
    });
    if (nextBpm == null) {
      return;
    }
    allBpmsRef.current.push(nextBpm);
    if (elapsed < SESSION_MS / 2) {
      earlyBpmsRef.current.push(nextBpm);
    } else {
      lateBpmsRef.current.push(nextBpm);
    }
  }, [stream.currentBpm, stream.beatTick, phase, hasUsableFingerSignal, hasConfirmedSignal]);

  useEffect(() => {
    if (phase !== 'placement') return;
    if (!hasConfirmedSignal) return;
    const t = setTimeout(() => {
      startedAtRef.current = Date.now();
      earlyBpmsRef.current = [];
      lateBpmsRef.current = [];
      allBpmsRef.current = [];
      bpmPresentationFilterRef.current.reset();
      setProgress(0);
      setPhase('running');
    }, PULSE_CONFIRMATION_DURATION_MS);
    return () => clearTimeout(t);
  }, [phase, hasConfirmedSignal]);

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

    let lastProgressUpdateAt = 0;
    const tick = () => {
      const now = Date.now();
      const started = startedAtRef.current ?? now;
      const ratio = Math.min(1, (now - started) / SESSION_MS);
      if (
        ratio >= 1 ||
        now - lastProgressUpdateAt >= PROGRESS_UPDATE_INTERVAL_MS
      ) {
        lastProgressUpdateAt = now;
        setProgress(ratio);
      }
      if (ratio >= 1) {
        rafRef.current = null;
        finishCapture(true);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [phase]);

  const handleStart = async () => {
    captureFinishedRef.current = false;
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

  const handleIntroBack = () => {
    if (prepStep > 0) {
      setPrepStep((current) => current - 1);
      return;
    }
    onBack();
  };

  const handleIntroPrimary = () => {
    if (prepStep < HEART_RATE_PREP_STEPS.length - 1) {
      setPrepStep((current) => current + 1);
      return;
    }
    void handleStart();
  };

  if (phase === 'analyzing') {
    return (
      <QuickAnalyzeScreen
        label="Heart reading"
        stepCount={2}
        // The same pacing rule as the other analyze screens: the more the
        // reading produced, the longer the bar walks. `setResult` lands before
        // the phase flips, so the numbers counted here are this reading's.
        durationMs={analyzeDurationMs(
          countAnswered([result?.avgBpm, result?.earlyBpm, result?.lateBpm]),
        )}
        fact={{
          headline: 'Your pulse is a trend, not a verdict.',
          body: 'Resting heart rate means most compared with your own readings over the coming weeks.',
          emoji: '\u{1F493}',
        }}
        onDone={() => setPhase('result')}
      />
    );
  }

  if (phase === 'result' && result != null) {
    return (
      <BaselineHeartRateResult
        result={result}
        age={age}
        stepIndex={stepIndex}
        stepCount={stepCount}
        onBack={onBack}
        onContinue={() => onContinue(result)}
      />
    );
  }

  if (phase === 'placement' || phase === 'running') {
    const isRunning = phase === 'running';
    return (
      <>
        <BaselineCaptureStage
          bpmDisplay={bpmDisplay}
          bpmOpacity={bpmOpacity}
          cameraProps={cameraProps ?? undefined}
          fingerPlacement={stream.fingerPlacement}
          heartScale={heartScale}
          hudOpacity={hudOpacity}
          hudVisible={hudVisible}
          isRunning={isRunning}
          liveSignalSamples={stream.liveSignalSamples}
          onCancel={() => finishCapture(false)}
          onShowHud={showHud}
          placement={placementCfg}
          progress={progress}
          signalWarning={signalWarning}
          signalStatus={stream.signalStatus}
          visibleBeatTick={visibleBeatTick}
        />
        <HeartRateHelpSheet
          visible={stallHelp.visible}
          statusMessage={placementCfg.status}
          pulseConfirmed={hasConfirmedSignal}
          issue={stallHelp.issue}
          onDismiss={stallHelp.dismiss}
        />
      </>
    );
  }

  return (
    <OnboardingScreenLayout
      title=""
      progress={stepIndex / stepCount}
      onBack={handleIntroBack}
      enableNavigationHaptics={false}
      footer={
        <View style={styles.introFooter}>
          <OnboardingPrimaryButton
            label={
              prepStep === HEART_RATE_PREP_STEPS.length - 1
                ? 'Start my reading'
                : 'Next'
            }
            onPress={handleIntroPrimary}
          />
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
      <HeartRatePlacementCarousel
        index={prepStep}
        onIndexChange={setPrepStep}
      />
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  introFooter: {
    gap: spacing.sm,
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
    color: colors.text.secondary,
  },
});
