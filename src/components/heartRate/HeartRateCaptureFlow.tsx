import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { usePostHog } from 'posthog-react-native';
import { useHeartRateCapture } from '../../hooks/useHeartRateCapture';
import { CameraCheckScreen } from './CameraCheckScreen';
import { MeasuringScreen } from './MeasuringScreen';
import { ResultScreen } from './ResultScreen';
import { DefaultInstructionScreen } from './setupScreens/DefaultInstructionScreen';
import type { SetupScreenProps, CaptureResult } from '../../lib/heartRate/types';
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
    secondsRemaining,
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
    // Force transition to measuring even if finger placement isn't perfect
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

  // Render setup screens
  if (!pastSetup) {
    const SetupScreen = setupScreens[currentSetupIndex];
    if (SetupScreen != null) {
      return (
        <SetupScreen
          onNext={handleSetupNext}
          onCancel={handleSetupCancel}
        />
      );
    }
  }

  // Camera check
  if (captureState === 'camera_check') {
    return (
      <CameraCheckScreen
        fingerPlacement={fingerPlacement}
        onStartAnyway={handleStartAnyway}
        onCancel={handleCancel}
        timeoutSeconds={10}
        cameraProps={cameraProps}
      />
    );
  }

  // Measuring or processing
  if (captureState === 'measuring' || captureState === 'processing') {
    return (
      <MeasuringScreen
        progress={progress}
        secondsRemaining={secondsRemaining}
        currentBpm={currentBpm}
        beatTick={beatTick}
        fingerPlacement={fingerPlacement}
        onCancel={handleCancel}
        cameraProps={cameraProps}
      />
    );
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

  // Fallback (shouldn't normally reach here)
  return <View style={styles.flex} />;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
