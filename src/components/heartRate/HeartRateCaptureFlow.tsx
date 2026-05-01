import { useState, useCallback, useEffect, useMemo } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePostHog } from 'posthog-react-native';
import { useHeartRateCapture } from '../../hooks/useHeartRateCapture';
import { ResultScreen } from './ResultScreen';
import { DefaultInstructionScreen } from './setupScreens/DefaultInstructionScreen';
import { PersistentCameraRing } from './PersistentCameraRing';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import type {
  SetupScreenProps,
  CaptureResult,
  FingerPlacementState,
} from '../../lib/heartRate/types';
import { captureException } from '../../services/analytics/errorTracking';
import { AnalyticsEvent } from '../../services/analytics/events';

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
const HOLD_DURATION_MS = 1500;

function checkStateConfig(placement: FingerPlacementState): {
  ringColor: string;
  status: string;
} {
  switch (placement) {
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

export function HeartRateCaptureFlow({
  setupScreens = DEFAULT_SETUP_SCREENS,
  onComplete,
  onCancel,
  context,
}: HeartRateCaptureFlowProps) {
  const posthog = usePostHog();
  const [currentSetupIndex, setCurrentSetupIndex] = useState(0);
  const [pastSetup, setPastSetup] = useState(false);

  const {
    captureState,
    fingerPlacement,
    progress,
    currentBpm,
    beatTick,
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
  } = useHeartRateCapture();

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

  const handleSetupCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const handleRetry = useCallback(() => {
    reset();
    setCurrentSetupIndex(0);
    setPastSetup(false);
  }, [reset]);

  const handleDone = useCallback(() => {
    if (result != null) {
      onComplete(result);
    } else {
      onCancel();
    }
  }, [result, onComplete, onCancel]);

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

  // Hold-steady progress for camera_check state
  const [holdProgress, setHoldProgress] = useState(0);
  useEffect(() => {
    if (captureState !== 'camera_check') {
      setHoldProgress(0);
      return;
    }
    if (fingerPlacement !== 'good') {
      setHoldProgress(0);
      return;
    }
    const start = Date.now();
    let raf: number;
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / HOLD_DURATION_MS);
      setHoldProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [captureState, fingerPlacement]);

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
        context={context}
      />
    );
  }

  const isMeasuring = captureState === 'measuring' || captureState === 'processing';
  const isCheck = captureState === 'camera_check';
  const checkConfig = checkStateConfig(fingerPlacement);
  const isFingerLost = fingerPlacement === 'lost' || fingerPlacement === 'no_finger';

  const ringColor = isMeasuring ? colors.primary.blue600 : checkConfig.ringColor;
  const ringProgress = isMeasuring ? progress : holdProgress;
  const trackColor = isMeasuring ? colors.border.subtle : checkConfig.ringColor + '33';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top: warning banner (measuring) or status text (check) */}
        <View style={styles.topArea}>
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
        </View>

        {/* Persistent ring + camera — never unmounts across check ↔ measuring */}
        <View style={styles.ringSlot}>
          <PersistentCameraRing
            ringColor={ringColor}
            trackColor={trackColor}
            progress={ringProgress}
            cameraProps={cameraProps}
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
              <Text style={styles.bpmLabel}>Current BPM</Text>
              <View style={styles.bpmValueRow}>
                <Text style={styles.bpmValue}>{currentBpm ?? '--'}</Text>
                <Text style={styles.bpmUnit}>bpm</Text>
              </View>
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
            <TouchableOpacity
              onPress={handleCancel}
              activeOpacity={0.7}
              style={styles.cancelTouchable}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
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
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  bpmLabel: {
    ...typography.body.medium,
    color: colors.text.secondary,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    marginBottom: spacing.xs,
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
    textAlign: 'right',
  },
  bpmUnit: {
    color: colors.text.secondary,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 20,
    marginLeft: spacing.xs,
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
  cancelText: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
});
