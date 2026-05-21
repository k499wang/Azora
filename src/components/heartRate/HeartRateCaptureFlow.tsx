import { useState, useCallback, useEffect, useMemo } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { usePostHog } from 'posthog-react-native';
import { useHeartRateCapture } from '../../hooks/useHeartRateCapture';
import { ResultScreen } from './ResultScreen';
import { DefaultInstructionScreen } from './setupScreens/DefaultInstructionScreen';
import { PersistentCameraRing } from './PersistentCameraRing';
import { AnimatedCalibratingText } from './AnimatedCalibratingText';
import { HeartRateProcessingScreen } from './HeartRateProcessingScreen';
import { LiveSignalGraph } from './LiveSignalGraph';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import type {
  SetupScreenProps,
  CaptureResult,
  FingerPlacementState,
} from '../../lib/heartRate/types';
import type { RootStackNavigationProp } from '../../app/navigation';
import { captureException } from '../../services/analytics/errorTracking';
import { AnalyticsEvent } from '../../services/analytics/events';
import { useAuthStore } from '../../stores/authStore';
import { useCompleteHeartRateSessionMutation } from '../../queries/tracking/useCompleteHeartRateSessionMutation';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { FeatureKey } from '../../services/subscriptions/featureAccess';
import { PaywallPlacement } from '../../services/paywall';

interface HeartRateCaptureFlowProps {
  setupScreens?: React.ComponentType<SetupScreenProps>[];
  onComplete: (result: CaptureResult) => void;
  onCancel: () => void;
  context?: string;
}

const DEFAULT_SETUP_SCREENS: React.ComponentType<SetupScreenProps>[] = [
  DefaultInstructionScreen,
];

const CHECK_TIMEOUT_SECONDS = 10;

function checkStateConfig(placement: FingerPlacementState): {
  ringColor: string;
  status: string;
} {
  switch (placement) {
    case 'good':
      return { ringColor: colors.success[500], status: 'Hold phone and finger still' };
    case 'partial':
      return { ringColor: colors.warning[500], status: 'Cover the camera fully' };
    case 'too_much_pressure':
      return { ringColor: '#8B5CF6', status: 'Ease up slightly' };
    case 'no_finger':
    case 'lost':
    default:
      return { ringColor: colors.error[500], status: 'Cover the camera with your finger pad' };
  }
}

export function HeartRateCaptureFlow({
  setupScreens = DEFAULT_SETUP_SCREENS,
  onComplete,
  onCancel,
  context,
}: HeartRateCaptureFlowProps) {
  const posthog = usePostHog();
  const navigation = useNavigation<RootStackNavigationProp<'HeartRate'>>();
  const user = useAuthStore((state) => state.user);
  const completeHeartRateSessionMutation = useCompleteHeartRateSessionMutation(user?.id ?? null);
  const heartRateAccess = useFeatureAccess(FeatureKey.HeartRateMeasurement);
  const [currentSetupIndex, setCurrentSetupIndex] = useState(0);
  const [pastSetup, setPastSetup] = useState(false);

  const {
    captureState,
    fingerPlacement,
    progress,
    currentBpm,
    beatTick,
    liveSignalSamples,
    result,
    device,
    format,
    frameProcessor,
    torchMode,
    startCapture,
    startMeasuring,
    cancel,
    reset,
    hasPermission,
    requestPermission,
  } = useHeartRateCapture({
    onCaptureComplete: (capturedResult, samples) => {
      completeHeartRateSessionMutation.mutate({
        result: capturedResult,
        captureSamples: samples,
      });
    },
  });

  const beginCapture = useCallback(async () => {
    try {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) return;
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
  }, [hasPermission, requestPermission, startCapture, posthog, context]);

  const handleSetupNext = useCallback(async () => {
    try {
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
      navigation.replace('ProPaywall', {
        placement: PaywallPlacement.HeartRateProGate,
        sourceScreen: 'HeartRate',
        feature: FeatureKey.HeartRateMeasurement,
      });
      return;
    }
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
    if (result.reading != null && completeHeartRateSessionMutation.isError) {
      // The inline save-error banner is showing; user must Retry before leaving.
      return;
    }
    onComplete(result);
  }, [
    completeHeartRateSessionMutation.isError,
    result,
    onComplete,
    onCancel,
  ]);

  const handleCancel = useCallback(() => {
    cancel();
    onCancel();
  }, [cancel, onCancel]);

  const handleStartAnyway = useCallback(() => {
    try {
      startMeasuring();
    } catch (error) {
      captureException(error, {
        flow: 'heart_rate_capture',
        action: 'start_anyway',
        screen_name: 'HeartRate',
        context: context ?? null,
      });
    }
  }, [context, startMeasuring]);

  const cameraProps = useMemo(() => (
    device != null
      ? {
        device,
        format,
        frameProcessor,
        torchMode,
        isActive: captureState !== 'processing',
      }
      : undefined
  ), [captureState, device, format, frameProcessor, torchMode]);

  const [showStartAnyway, setShowStartAnyway] = useState(false);
  useEffect(() => {
    if (captureState !== 'camera_check') {
      setShowStartAnyway(false);
      return;
    }
    const t = setTimeout(() => setShowStartAnyway(true), CHECK_TIMEOUT_SECONDS * 1000);
    return () => clearTimeout(t);
  }, [captureState]);

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
        isSaving={completeHeartRateSessionMutation.isPending}
        saveError={completeHeartRateSessionMutation.isError}
        onRetrySave={retrySave}
        context={context}
      />
    );
  }

  if (captureState === 'processing') {
    return <HeartRateProcessingScreen />;
  }

  const isMeasuring = captureState === 'measuring';
  const isCheck = captureState === 'camera_check';
  const checkConfig = checkStateConfig(fingerPlacement);
  const isFingerLost = fingerPlacement === 'lost' || fingerPlacement === 'no_finger';

  const ringColor = isMeasuring ? colors.primary.blue600 : checkConfig.ringColor;
  const ringProgress = isMeasuring ? progress : 0;
  const trackColor = isMeasuring ? colors.border.subtle : checkConfig.ringColor + '33';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top: warning banner (measuring) or status text (check) */}
        <View style={styles.topArea}>
          <TouchableOpacity
            onPress={handleCancel}
            activeOpacity={0.7}
            style={styles.cancelTouchableTop}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          {isMeasuring && isFingerLost && (
            <View style={styles.warningBanner}>
              <MaterialCommunityIcons
                name="alert-outline"
                size={16}
                color={colors.warning[500]}
              />
              <Text style={styles.warningText}>
                Finger moved — reposition and hold still
              </Text>
            </View>
          )}
          {isCheck && (
            <Text style={[styles.status, { color: checkConfig.ringColor }]}>
              {checkConfig.status}
            </Text>
          )}
          {isMeasuring && !isFingerLost && (
            <View style={styles.topSignalGraph}>
              <LiveSignalGraph
                samples={liveSignalSamples}
                fingerPlacement={fingerPlacement}
              />
            </View>
          )}
        </View>

        {/* Persistent ring + camera — never unmounts across check ↔ measuring */}
        <View style={styles.ringSlot}>
          <PersistentCameraRing
            ringColor={ringColor}
            trackColor={trackColor}
            progress={ringProgress}
            cameraProps={cameraProps}
            fingerPlacement={fingerPlacement}
            beatTick={isMeasuring ? beatTick : 0}
            showHeartIcon={isMeasuring}
            hapticOnBeat={isMeasuring}
            smoothProgress={isMeasuring}
          />
        </View>

        {/* Bottom: state-specific chrome */}
        <View style={styles.bottomArea}>
          {isMeasuring && (
            <View style={styles.bpmRow}>
              {currentBpm == null ? (
                <AnimatedCalibratingText textStyle={styles.bpmCalibrating} />
              ) : (
                <View style={styles.bpmValueRow}>
                  <Text style={styles.bpmValue}>{currentBpm}</Text>
                  <Text style={styles.bpmUnit}>BPM</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.actions}>
            {isCheck && showStartAnyway && (
              <TouchableOpacity
                style={styles.startAnywayButton}
                onPress={handleStartAnyway}
                activeOpacity={0.85}
              >
                <Text style={styles.startAnywayText}>Start Anyway</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
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
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  topArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.xl,
  },
  topSignalGraph: {
    width: '100%',
    alignItems: 'center',
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
    marginBottom: spacing.md,
  },
  warningText: {
    ...typography.body.small,
    color: '#92400E',
    flex: 1,
  },
  status: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
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
    fontWeight: '600',
    fontSize: 56,
    lineHeight: 60,
    minWidth: 64,
    textAlign: 'center',
  },
  bpmUnit: {
    color: colors.text.secondary,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 20,
    marginLeft: spacing.xs,
  },
  bpmCalibrating: {
    ...typography.title.title3,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
    alignItems: 'center',
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
