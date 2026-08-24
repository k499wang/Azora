import { Text } from '../common/Text';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
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
import { padding, spacing } from '../../theme/spacing';
import GlassIconButton from '../common/GlassIconButton';
import { SESSION_GLASS_BUTTON_SIZE } from '../../features/exercise/shared/components/SessionGlassButton';
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
import { useHeartRateStallHelp } from '../../hooks/useHeartRateStallHelp';
import { runAfterNextPaint } from '../../lib/ui/runAfterNextPaint';

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
  const saveInFlight =
    pendingSave != null || completeHeartRateSessionMutation.isPending;
  const navigationBlocked = captureState === 'processing' || saveInFlight;

  useEffect(() => {
    if (captureState !== 'done' || pendingSave == null) return;

    // Let the done screen and camera teardown paint before starting I/O, but do
    // not wait through the result entrance animation. That delay made saving
    // feel slow and left a window where leaving the route could cancel it.
    void runAfterNextPaint(() => {
      completeHeartRateSessionMutationRef.current.mutate(pendingSave);
      setPendingSave(null);
    });
  }, [captureState, pendingSave]);

  const stallHelp = useHeartRateStallHelp({
    active: captureState === 'camera_check',
    pulseConfirmed: currentBpm != null,
    fingerPlacement,
    signalStatus,
    context,
    mode: selectedMode,
  });

  const beginCapture = useCallback(async () => {
    try {
      if (!heartRateAccess.allowed && !heartRateAccess.isLoading) {
        trackFeatureGateHit({
          feature: FeatureKey.HeartRateMeasurement,
          placement: PaywallPlacement.HeartRateProGate,
          sourceScreen: 'HeartRate',
          sourceAction: 'begin_measurement',
          access: heartRateAccess,
        });
        navigation.replace('ProPaywall', {
          placement: PaywallPlacement.HeartRateProGate,
          sourceScreen: 'HeartRate',
          sourceAction: 'begin_measurement',
          feature: FeatureKey.HeartRateMeasurement,
        });
        return;
      }

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
  }, [
    context,
    device,
    hasPermission,
    heartRateAccess.allowed,
    heartRateAccess.isLoading,
    heartRateAccess.isPro,
    heartRateAccess.limit,
    heartRateAccess.reason,
    heartRateAccess.used,
    navigation,
    posthog,
    requestPermission,
    startCapture,
  ]);

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
    navigation.setOptions({
      gestureEnabled: !navigationBlocked,
    });
    return () => {
      navigation.setOptions({ gestureEnabled: true });
    };
  }, [navigation, navigationBlocked]);

  useEffect(() => {
    if (!navigationBlocked) return;

    return navigation.addListener('beforeRemove', (event) => {
      event.preventDefault();
    });
  }, [navigation, navigationBlocked]);

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
        helpShown={stallHelp.shown}
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
        {/* Matches the floating close on the setup and result screens. */}
        <GlassIconButton
          accessibilityLabel="Close"
          size={SESSION_GLASS_BUTTON_SIZE}
          style={styles.floatingClose}
          onPress={handleCancel}
        >
          <MaterialCommunityIcons name="close" size={20} color={colors.text.secondary} />
        </GlassIconButton>

        {/* Top: the live PPG trace, swapped for the warning banner while measuring */}
        <View style={styles.topArea}>
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
        visible={stallHelp.visible}
        statusMessage={checkConfig.status}
        pulseConfirmed={currentBpm != null}
        onDismiss={stallHelp.dismiss}
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
  floatingClose: {
    position: 'absolute',
    top: padding.screen.vertical,
    left: padding.screen.horizontal,
    zIndex: 20,
  },
});
