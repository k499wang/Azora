import { useCallback, useRef, useState, useEffect } from 'react';
import {
  useFrameProcessor,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { useRunOnJS } from 'react-native-worklets-core';
import type {
  CaptureState,
  BrightnessSample,
  CaptureResult,
  FingerPlacementState,
} from '../lib/heartRate/types';
import { heartRatePlugin } from '../lib/heartRate/heartRatePlugin';
import { classifyFingerPlacementStateless } from '../lib/heartRate/fingerQuality';
import { computeBPM } from '../lib/heartRate/signalProcessing';

const CAPTURE_DURATION_MS = 15000;
const MIN_GOOD_DURATION_MS = 1500;
const FINGER_QUALITY_WINDOW_MS = 1000;
const ROLLING_CLASSIFY_WINDOW_MS = 2000;

interface UseHeartRateCaptureReturn {
  captureState: CaptureState;
  fingerPlacement: FingerPlacementState;
  progress: number;
  secondsRemaining: number;
  result: CaptureResult | null;
  device: ReturnType<typeof useCameraDevice>;
  frameProcessor: ReturnType<typeof useFrameProcessor>;
  torchMode: 'on' | 'off';
  startCapture: () => void;
  startMeasuring: () => void;
  cancel: () => void;
  reset: () => void;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

export function useHeartRateCapture(): UseHeartRateCaptureReturn {
  const [captureState, setCaptureState] = useState<CaptureState>('idle');
  const [fingerPlacement, setFingerPlacement] = useState<FingerPlacementState>('no_finger');
  const [progress, setProgress] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(15);
  const [result, setResult] = useState<CaptureResult | null>(null);

  const samplesRef = useRef<BrightnessSample[]>([]);
  const captureStartRef = useRef<number | null>(null);
  const measureStartRef = useRef<number | null>(null);
  const goodSinceRef = useRef<number | null>(null);
  const captureStateRef = useRef<CaptureState>('idle');
  const fingerClassifyStateRef = useRef<{
    previousState?: FingerPlacementState;
    goodSinceMs?: number;
  }>({});
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  // Keep captureStateRef in sync
  useEffect(() => {
    captureStateRef.current = captureState;
  }, [captureState]);

  const torchMode: 'on' | 'off' =
    captureState === 'camera_check' || captureState === 'measuring' ? 'on' : 'off';

  const startMeasuring = useCallback(() => {
    samplesRef.current = [];
    measureStartRef.current = Date.now();
    goodSinceRef.current = null;
    fingerClassifyStateRef.current = {};
    setProgress(0);
    setSecondsRemaining(15);
    setCaptureState('measuring');
    captureStateRef.current = 'measuring';
  }, []);

  // JS callback invoked from worklet to add a brightness sample
  const addSample = useRunOnJS(
    (brightness: number) => {
      const timestamp = Date.now();
      const state = captureStateRef.current;
      if (state !== 'camera_check' && state !== 'measuring') return;

      const sample: BrightnessSample = { value: brightness, timestamp };
      samplesRef.current.push(sample);

      // Classify finger placement based on last ROLLING_CLASSIFY_WINDOW_MS of samples
      const recentCutoff = timestamp - ROLLING_CLASSIFY_WINDOW_MS;
      const recentSamples = samplesRef.current.filter((s) => s.timestamp >= recentCutoff);
      const { placement, state: newClassifyState } = classifyFingerPlacementStateless(
        recentSamples,
        FINGER_QUALITY_WINDOW_MS,
        fingerClassifyStateRef.current,
      );
      fingerClassifyStateRef.current = newClassifyState;
      setFingerPlacement(placement);

      if (state === 'camera_check') {
        if (placement === 'good') {
          if (goodSinceRef.current == null) {
            goodSinceRef.current = timestamp;
          } else if (timestamp - goodSinceRef.current >= MIN_GOOD_DURATION_MS) {
            // Transition to a clean measurement window after placement stabilizes.
            startMeasuring();
          }
        } else {
          goodSinceRef.current = null;
        }
      } else if (state === 'measuring') {
        if (measureStartRef.current != null) {
          const elapsed = timestamp - measureStartRef.current;
          const prog = Math.min(1, elapsed / CAPTURE_DURATION_MS);
          const remaining = Math.max(0, Math.ceil((CAPTURE_DURATION_MS - elapsed) / 1000));
          setProgress(prog);
          setSecondsRemaining(remaining);

          if (elapsed >= CAPTURE_DURATION_MS) {
            // Done — process result
            setCaptureState('processing');
            captureStateRef.current = 'processing';

            const samples = [...samplesRef.current];
            setTimeout(() => {
              const bpmResult = computeBPM(samples);
              if (bpmResult == null) {
                const tooFew = samples.length < 12;
                setResult({
                  reading: null,
                  error: tooFew ? 'too_few_samples' : 'low_confidence',
                });
                setCaptureState('error');
                captureStateRef.current = 'error';
              } else {
                const startTs = samples[0]?.timestamp ?? 0;
                const endTs = samples[samples.length - 1]?.timestamp ?? 0;
                setResult({
                  reading: {
                    bpm: bpmResult.bpm,
                    confidence: bpmResult.confidence,
                    sampleCount: samples.length,
                    durationMs: endTs - startTs,
                    recordedAt: new Date().toISOString(),
                    source: 'camera-flash',
                  },
                  error: null,
                });
                setCaptureState('done');
                captureStateRef.current = 'done';
              }
            }, 0);
          }
        }
      }
    },
    [startMeasuring],
  );

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      const brightness = heartRatePlugin(frame);
      if (brightness != null) {
        addSample(brightness);
      }
    },
    [addSample],
  );

  const startCapture = useCallback(() => {
    samplesRef.current = [];
    captureStartRef.current = Date.now();
    measureStartRef.current = null;
    goodSinceRef.current = null;
    fingerClassifyStateRef.current = {};
    setProgress(0);
    setSecondsRemaining(15);
    setResult(null);
    setFingerPlacement('no_finger');
    setCaptureState('camera_check');
    captureStateRef.current = 'camera_check';
  }, []);

  const cancel = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    samplesRef.current = [];
    captureStartRef.current = null;
    measureStartRef.current = null;
    goodSinceRef.current = null;
    fingerClassifyStateRef.current = {};
    setProgress(0);
    setSecondsRemaining(15);
    setFingerPlacement('no_finger');
    setCaptureState('idle');
    captureStateRef.current = 'idle';
  }, []);

  const reset = useCallback(() => {
    cancel();
    setResult(null);
  }, [cancel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return {
    captureState,
    fingerPlacement,
    progress,
    secondsRemaining,
    result,
    device,
    frameProcessor,
    torchMode,
    startCapture,
    startMeasuring,
    cancel,
    reset,
    hasPermission,
    requestPermission,
  };
}
