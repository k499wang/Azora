import { Text } from '../common/Text';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  InteractionManager, SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePostHog } from 'posthog-react-native';
import { useHeartRateCapture } from '../../hooks/useHeartRateCapture';
import { ResultScreen } from './ResultScreen';
import { DefaultInstructionScreen } from './setupScreens/DefaultInstructionScreen';
import { PersistentCameraRing } from './PersistentCameraRing';
import { AnimatedCalibratingText } from './AnimatedCalibratingText';
import { HeartRateProcessingScreen } from './HeartRateProcessingScreen';
import { HeartRateHelpSheet } from './HeartRateHelpSheet';
import { LiveSignalGraph } from './LiveSignalGraph';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import type {
  SetupScreenProps,
  CaptureResult,
  FingerPlacementState,
  SignalStatus,
  PpgFrameSample,
} from '../../lib/heartRate/types';
import {
  DEFAULT_CAPTURE_MODE,
  type HeartRateCaptureMode,
} from '../../lib/heartRate/captureModes';
import type { RootStackNavigationProp } from '../../app/navigation';
import { captureException } from '../../services/analytics/errorTracking';
import { AnalyticsEvent } from '../../services/analytics/events';
import { trackFeatureGateHit } from '../../services/analytics/tracking';
import { useAuthStore } from '../../stores/authStore';
import { useCompleteHeartRateSessionMutation } from '../../queries/tracking/useCompleteHeartRateSessionMutation';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { FeatureKey } from '../../services/subscriptions/featureAccess';
import { PaywallPlacement } from '../../services/paywall';
import {
  showCameraAccessNeededAlert,
  showHeartRateCameraUnavailableAlert,
} from './cameraAccessPrompts';
import {
  getCameraCheckMessage,
  getHeartRateCameraTarget,
  getMeasurementCorrectionMessage,
} from '../../lib/heartRate/captureGuidance';
import {
  classifyStallIssue,
  dominantStallIssue,
  HEART_RATE_STALL_DELAY_MS,
  type HeartRateStallIssue,
  type HeartRateStallSample,
} from '../../lib/heartRate/captureStall';

interface HeartRateCaptureFlowProps {
  setupScreens?: React.ComponentType<SetupScreenProps>[];
  onComplete: (result: CaptureResult) => void;
  onCancel: () => void;
  context?: string;
}

const DEFAULT_SETUP_SCREENS: React.ComponentType<SetupScreenProps>[] = [
  DefaultInstructionScreen,
];

interface PendingHeartRateSave {
  result: CaptureResult;
  captureSamples: PpgFrameSample[];
}

function checkStateConfig(
  placement: FingerPlacementState,
  signalStatus: SignalStatus,
  cameraTarget: string,
  pulseConfirmed: boolean,
): {
  statusColor: string;
  status: string;
} {
  const isMissing = placement === 'no_finger' || placement === 'lost';
  const placementAccepted = placement === 'good';
  const needsCorrection =
    placement === 'partial' ||
    placement === 'too_much_pressure' ||
    signalStatus === 'partial_coverage' ||
    signalStatus === 'too_much_pressure' ||
    signalStatus === 'no_pulse' ||
    signalStatus === 'excessive_motion';

  return {
    statusColor: isMissing
      ? colors.error[500]
      : needsCorrection
        ? colors.warning[500]
        : placementAccepted
          ? colors.success[500]
          : colors.primary.blue500,
    status: getCameraCheckMessage({
      fingerPlacement: placement,
      signalStatus,
      pulseConfirmed,
      cameraTarget,
    }),
  };
}

function measuringWarning(
  status: SignalStatus,
  placement: FingerPlacementState,
  cameraTarget: string,
): string | null {
  return getMeasurementCorrectionMessage(status, placement, cameraTarget);
}

export function HeartRateCaptureFlow({
  setupScreens = DEFAULT_SETUP_SCREENS,
  onComplete,
  onCancel,
  context,
}: HeartRateCaptureFlowProps) {
  const posthog = usePostHog();
  const navigation = useNavigation<RootStackNavigationProp<'HeartRate'>>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const completeHeartRateSessionMutation = useCompleteHeartRateSessionMutation(user?.id ?? null);
  const heartRateAccess = useFeatureAccess(FeatureKey.HeartRateMeasurement);
  const [currentSetupIndex, setCurrentSetupIndex] = useState(0);
  const [pastSetup, setPastSetup] = useState(false);
  const [selectedMode, setSelectedMode] = useState<HeartRateCaptureMode>(DEFAULT_CAPTURE_MODE);
  const [pendingSave, setPendingSave] = useState<PendingHeartRateSave | null>(null);
  const [helpVisible, setHelpVisible] = useState(false);
  const helpShownRef = useRef(false);
  const stallSamplesRef = useRef<HeartRateStallSample[]>([]);
  const lastStallIssueRef = useRef<HeartRateStallIssue | null>(null);
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cameraTarget = getHeartRateCameraTarget(Device.modelName, Device.modelId);
  const completeHeartRateSessionMutationRef = useRef(completeHeartRateSessionMutation);
  completeHeartRateSessionMutationRef.current = completeHeartRateSessionMutation;

  const {
    captureState,
    fingerPlacement,
    signalStatus,
    progress,
    currentBpm,
    beatTick,
    liveSignalSamples,
    result,
    device,
    format,
    frameProcessor,
    torchMode,
    cameraFps,
    startCapture,
    cancel,
    reset,
    hasPermission,
    requestPermission,
  } = useHeartRateCapture({
    mode: selectedMode,
    onCaptureComplete: (capturedResult, samples) => {
      setPendingSave({
        result: capturedResult,
        captureSamples: samples,
      });
    },
  });

  useEffect(() => {
    if (captureState !== 'done' || pendingSave == null) return;

    // Wait until the done screen has committed so the camera preview unmounts
    // before the first network request starts.
    const task = InteractionManager.runAfterInteractions(() => {
      completeHeartRateSessionMutationRef.current.mutate(pendingSave);
      setPendingSave(null);
    });

    return () => {
      task.cancel();
    };
  }, [captureState, pendingSave]);

  const clearStallTimer = useCallback(() => {
    if (stallTimerRef.current == null) return;
    clearTimeout(stallTimerRef.current);
    stallTimerRef.current = null;
  }, []);

  useEffect(() => {
    if (captureState !== 'camera_check') {
      clearStallTimer();
      setHelpVisible(false);
      return;
    }

    stallSamplesRef.current = [];
    lastStallIssueRef.current = null;
    helpShownRef.current = false;
    stallTimerRef.current = setTimeout(() => {
      stallTimerRef.current = null;
      const issue = dominantStallIssue(stallSamplesRef.current, Date.now());
      helpShownRef.current = true;
      setHelpVisible(true);
      posthog.capture(AnalyticsEvent.HeartRateCaptureHelpShown, {
        issue,
        mode: selectedMode,
        context: context ?? null,
      });
    }, HEART_RATE_STALL_DELAY_MS);

    return clearStallTimer;
  }, [captureState, clearStallTimer, context, posthog, selectedMode]);

  // Which fault held longest decides the advice, so every change is timestamped.
  useEffect(() => {
    if (captureState !== 'camera_check') return;
    const issue = classifyStallIssue(fingerPlacement, signalStatus);
    if (issue === lastStallIssueRef.current) return;
    lastStallIssueRef.current = issue;
    stallSamplesRef.current.push({ issue, atMs: Date.now() });
  }, [captureState, fingerPlacement, signalStatus]);

  // A confirmed pulse settles the check for good: stand down and get out of the way.
  useEffect(() => {
    if (currentBpm == null) return;
    clearStallTimer();
    setHelpVisible(false);
  }, [clearStallTimer, currentBpm]);

  const beginCapture = useCallback(async () => {
    try {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          showCameraAccessNeededAlert();
          return;
        }
      }

      if (device == null) {
        showHeartRateCameraUnavailableAlert();
        return;
      }

      setPastSetup(true);
      posthog.capture(AnalyticsEvent.HeartRateCaptureStarted, { context: context ?? null });
      startCapture();
    } catch (error) {
      captureException(error, {
        flow: 'heart_rate_capture',
        action: 'begin_capture',
        screen_name: 'HeartRate',
        context: context ?? null,
      });
    }
  }, [device, hasPermission, requestPermission, startCapture, posthog, context]);

  const handleSetupNext = useCallback(async (selection?: { mode: HeartRateCaptureMode }) => {
    try {
      if (selection?.mode != null) {
        setSelectedMode(selection.mode);
      }
      if (currentSetupIndex < setupScreens.length - 1) {
        setCurrentSetupIndex((i) => i + 1);
      } else {
        await beginCapture();
      }
    } catch (error) {
      captureException(error, {
        flow: 'heart_rate_capture',
        action: 'setup_next',
        screen_name: 'HeartRate',
        context: context ?? null,
      });
    }
  }, [beginCapture, context, currentSetupIndex, setupScreens.length]);

  useEffect(() => {
    if (setupScreens.length === 0 && !pastSetup) {
      void beginCapture();
    }
  }, [beginCapture, pastSetup, setupScreens.length]);

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: captureState !== 'processing' });
    return () => {
      navigation.setOptions({ gestureEnabled: true });
    };
  }, [captureState, navigation]);

  const handleSetupCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const handleRetry = useCallback(() => {
    const blockedByLimit =
      completeHeartRateSessionMutation.isSuccess && !heartRateAccess.isPro;
    const blockedByCache =
      !heartRateAccess.isLoading && !heartRateAccess.allowed;
    if (blockedByLimit || blockedByCache) {
      const access = blockedByLimit && heartRateAccess.allowed
        ? {
            ...heartRateAccess,
            allowed: false,
            reason: 'free_limit_reached' as const,
            used: Math.max(heartRateAccess.used, heartRateAccess.limit ?? 1),
            limit: heartRateAccess.limit ?? 1,
          }
        : heartRateAccess;
      trackFeatureGateHit({
        feature: FeatureKey.HeartRateMeasurement,
        placement: PaywallPlacement.HeartRateProGate,
        sourceScreen: 'HeartRate',
        sourceAction: 'retry_after_free_capture',
        access,
      });
      navigation.replace('ProPaywall', {
        placement: PaywallPlacement.HeartRateProGate,
        sourceScreen: 'HeartRate',
        sourceAction: 'retry_after_free_capture',
        feature: FeatureKey.HeartRateMeasurement,
      });
      return;
    }
    setPendingSave(null);
    completeHeartRateSessionMutation.reset();
    reset();
    setCurrentSetupIndex(0);
    setPastSetup(false);
  }, [
    completeHeartRateSessionMutation,
    heartRateAccess.allowed,
    heartRateAccess.isLoading,
    heartRateAccess.isPro,
    navigation,
    reset,
  ]);

  const retrySave = useCallback(() => {
    const variables = completeHeartRateSessionMutation.variables;
    if (variables == null) return;
    completeHeartRateSessionMutation.mutate(variables);
  }, [completeHeartRateSessionMutation]);

  const handleDone = useCallback(() => {
    if (result == null) {
      onCancel();
      return;
    }
    if (
      result.reading != null &&
      (pendingSave != null ||
        completeHeartRateSessionMutation.isPending ||
        completeHeartRateSessionMutation.isError)
    ) {
      // The save is still active, or the inline save-error banner is showing.
      return;
    }
    onComplete(result);
  }, [
    pendingSave,
    completeHeartRateSessionMutation.isPending,
    completeHeartRateSessionMutation.isError,
    result,
    onComplete,
    onCancel,
  ]);

  const handleCancel = useCallback(() => {
    setPendingSave(null);
    cancel();
    onCancel();
  }, [cancel, onCancel]);

  const cameraProps = useMemo(() => (
    device != null
      ? {
        device,
        format,
        frameProcessor,
        torchMode,
        fps: cameraFps,
        isActive: captureState !== 'processing',
      }
      : undefined
  ), [captureState, device, format, frameProcessor, torchMode, cameraFps]);

  // Setup screens
  if (!pastSetup) {
    const SetupScreen = setupScreens[currentSetupIndex];
    if (SetupScreen != null) {
      return (
        <SetupScreen onNext={handleSetupNext} onCancel={handleSetupCancel} />
      );
    }
  }

  // Done or error
  if ((captureState === 'done' || captureState === 'error') && result != null) {
    return (
      <ResultScreen
        result={result}
        onRetry={handleRetry}
        onDone={handleDone}
        isSaving={pendingSave != null || completeHeartRateSessionMutation.isPending}
        saveError={completeHeartRateSessionMutation.isError}
        onRetrySave={retrySave}
        context={context}
        helpShown={helpShownRef.current}
      />
    );
  }

  if (captureState === 'processing') {
    return <HeartRateProcessingScreen />;
  }

  const isMeasuring = captureState === 'measuring';
  const isCheck = captureState === 'camera_check';
  const checkConfig = checkStateConfig(
    fingerPlacement,
    signalStatus,
    cameraTarget,
    currentBpm != null,
  );
  const warningMessage = isMeasuring
    ? measuringWarning(signalStatus, fingerPlacement, cameraTarget)
    : null;

  const ringColor = colors.primary.blue600;
  const ringProgress = isMeasuring ? progress : 0;
  const trackColor = colors.border.subtle;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top: the live PPG trace, swapped for the warning banner while measuring */}
        <View style={styles.topArea}>
          <TouchableOpacity
            onPress={handleCancel}
            activeOpacity={0.7}
            style={styles.cancelTouchableTop}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          {(isCheck || isMeasuring) && (
            <View style={styles.measuringTopSlot}>
              {isMeasuring && warningMessage != null ? (
                <View style={styles.warningBanner}>
                  <MaterialCommunityIcons
                    name="alert-outline"
                    size={16}
                    color={colors.warning[500]}
                  />
                  <Text style={styles.warningText}>{warningMessage}</Text>
                </View>
              ) : (
                <LiveSignalGraph
                  samples={liveSignalSamples}
                  fingerPlacement={fingerPlacement}
                  signalStatus={signalStatus}
                />
              )}
            </View>
          )}
        </View>

        {/* Persistent ring + camera — never unmounts across check ↔ measuring */}
        <View
          style={[
            styles.ringSlot,
            { transform: [{ translateY: (insets.bottom - insets.top) / 2 }] },
          ]}
        >
          <PersistentCameraRing
            ringColor={ringColor}
            trackColor={trackColor}
            progress={ringProgress}
            cameraProps={cameraProps}
            fingerPlacement={fingerPlacement}
            beatTick={isMeasuring || isCheck ? beatTick : 0}
            showHeartIcon={isMeasuring || isCheck}
            hapticOnBeat={isMeasuring || isCheck}
            smoothProgress={isMeasuring}
          />
        </View>

        {/* Bottom: state-specific chrome */}
        <View style={styles.bottomArea}>
          {(isCheck || isMeasuring) && (
            <View style={styles.bpmRow}>
              {currentBpm != null ? (
                <View style={styles.bpmValueRow}>
                  <Text style={styles.bpmValue}>{currentBpm}</Text>
                  <Text style={styles.bpmUnit}>BPM</Text>
                </View>
              ) : isMeasuring ? (
                <AnimatedCalibratingText textStyle={styles.bpmCalibrating} />
              ) : (
                <Text style={[styles.bpmCalibrating, { color: checkConfig.statusColor }]}>
                  {checkConfig.status}
                </Text>
              )}
            </View>
          )}

        </View>
      </View>

      <HeartRateHelpSheet
        visible={helpVisible}
        statusMessage={checkConfig.status}
        pulseConfirmed={currentBpm != null}
        onDismiss={() => setHelpVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  topArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.xl,
  },
  measuringTopSlot: {
    width: '100%',
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  ringSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.xl,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    width: '100%',
  },
  warningText: {
    ...typography.body.small,
    color: '#92400E',
    flex: 1,
  },
  bpmRow: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  bpmValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    minWidth: 120,
  },
  bpmValue: {
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 56,
    lineHeight: 60,
    minWidth: 64,
    textAlign: 'center',
  },
  bpmUnit: {
    color: colors.text.secondary,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 20,
    marginLeft: spacing.xs,
  },
  bpmCalibrating: {
    ...typography.title.title3,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    textAlign: 'center',
  },
  cancelTouchable: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cancelTouchableTop: {
    position: 'absolute',
    top: spacing.sm,
    alignSelf: 'center',
    zIndex: 20,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  cancelText: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
});
