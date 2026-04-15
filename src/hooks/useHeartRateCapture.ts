import { useCallback, useRef, useState, useEffect } from 'react';
import {
  useFrameProcessor,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { useRunOnJS } from 'react-native-worklets-core';
import type {
  CaptureState,
  PpgFrameSample,
  CaptureResult,
  FingerPlacementState,
} from '../lib/heartRate/types';
import { heartRatePlugin } from '../lib/heartRate/heartRatePlugin';
import { classifyFingerPlacementStateless } from '../lib/heartRate/fingerQuality';
import { computeBPM, PREVIEW_BPM_OPTIONS } from '../lib/heartRate/signalProcessing';
import { computeRollingBPM } from '../lib/heartRate/rollingWindow';

const CAPTURE_DURATION_MS = 15000;
const MIN_GOOD_DURATION_MS = 1500;
const FINGER_QUALITY_WINDOW_MS = 1000;
const ROLLING_CLASSIFY_WINDOW_MS = 2000;
const ROLLING_BPM_WINDOW_MS = 8000;
const BPM_UPDATE_INTERVAL_MS = 1000;

function isValidFrameSample(value: unknown): value is PpgFrameSample {
  if (value == null || typeof value !== 'object') return false;

  const sample = value as Partial<PpgFrameSample>;
  if (!Number.isFinite(sample.timestamp) || !Array.isArray(sample.rois)) return false;

  return sample.rois.length > 0 && sample.rois.every((roi) =>
    roi != null &&
    typeof roi.id === 'string' &&
    Number.isFinite(roi.r) &&
    Number.isFinite(roi.g) &&
    Number.isFinite(roi.b) &&
    Number.isFinite(roi.saturatedPct) &&
    Number.isFinite(roi.darkPct) &&
    Number.isFinite(roi.variance)
  );
}

interface UseHeartRateCaptureReturn {
  captureState: CaptureState;
  fingerPlacement: FingerPlacementState;
  progress: number;
  secondsRemaining: number;
  currentBpm: number | null;
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
  const [currentBpm, setCurrentBpm] = useState<number | null>(null);
  const [result, setResult] = useState<CaptureResult | null>(null);

  const samplesRef = useRef<PpgFrameSample[]>([]);
  const captureStartRef = useRef<number | null>(null);
  const measureStartRef = useRef<number | null>(null);
  const goodSinceRef = useRef<number | null>(null);
  const lastBpmUpdateRef = useRef<number>(0);
  const currentBpmRef = useRef<number | null>(null);
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

  const startMeasuring = useCallback((startTimestamp?: number) => {
    samplesRef.current = [];
    measureStartRef.current = startTimestamp ?? null;
    goodSinceRef.current = null;
    lastBpmUpdateRef.current = 0;
    fingerClassifyStateRef.current = {};
    setProgress(0);
    setSecondsRemaining(15);
    currentBpmRef.current = null;
    setCurrentBpm(null);
    setCaptureState('measuring');
    captureStateRef.current = 'measuring';
  }, []);

  // JS callback invoked from worklet to add a brightness sample
  const addSample = useRunOnJS(
    (frameSample: unknown) => {
      if (!isValidFrameSample(frameSample)) {
        samplesRef.current = [];
        goodSinceRef.current = null;
        fingerClassifyStateRef.current = {};
        currentBpmRef.current = null;
        setCurrentBpm(null);
        setFingerPlacement('no_finger');
        return;
      }

      const timestamp = frameSample.timestamp;
      const state = captureStateRef.current;
      if (state !== 'camera_check' && state !== 'measuring') return;

      samplesRef.current.push(frameSample);

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
            startMeasuring(timestamp);
          }
        } else {
          goodSinceRef.current = null;
        }
      } else if (state === 'measuring') {
        if (measureStartRef.current == null) {
          measureStartRef.current = timestamp;
        }

        if (measureStartRef.current != null) {
          const elapsed = timestamp - measureStartRef.current;
          const prog = Math.min(1, elapsed / CAPTURE_DURATION_MS);
          const remaining = Math.max(0, Math.ceil((CAPTURE_DURATION_MS - elapsed) / 1000));
          setProgress(prog);
          setSecondsRemaining(remaining);

          const canEstimateBpm = placement === 'good' || placement === 'partial';
          if (!canEstimateBpm && currentBpmRef.current != null) {
            currentBpmRef.current = null;
            setCurrentBpm(null);
          }

          if (
            timestamp - lastBpmUpdateRef.current >= BPM_UPDATE_INTERVAL_MS &&
            canEstimateBpm
          ) {
            lastBpmUpdateRef.current = timestamp;
            const bpmResult = computeRollingBPM(
              samplesRef.current,
              ROLLING_BPM_WINDOW_MS,
              PREVIEW_BPM_OPTIONS,
            );
            if (bpmResult != null) {
              currentBpmRef.current = bpmResult.bpm;
              setCurrentBpm(bpmResult.bpm);
            }
          }

          if (elapsed >= CAPTURE_DURATION_MS) {
            // Done — process result
            setCaptureState('processing');
            captureStateRef.current = 'processing';

            const samples = [...samplesRef.current];
            setTimeout(() => {
              const bpmResult = computeBPM(samples);
              if (bpmResult == null) {
                const tooFew = samples.length < 60;
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
                    quality: bpmResult.quality,
                    roiId: bpmResult.roiId,
                    channel: bpmResult.channel,
                    snrDb: bpmResult.snrDb,
                    frequencyBpm: bpmResult.frequencyBpm,
                    peakBpm: bpmResult.peakBpm,
                    sampleCount: bpmResult.sampleCount,
                    durationMs: bpmResult.durationMs || endTs - startTs,
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
      const frameSample = heartRatePlugin(frame);
      if (frameSample != null) {
        addSample(frameSample);
      }
    },
    [addSample],
  );

  const startCapture = useCallback(() => {
    samplesRef.current = [];
    captureStartRef.current = Date.now();
    measureStartRef.current = null;
    goodSinceRef.current = null;
    lastBpmUpdateRef.current = 0;
    fingerClassifyStateRef.current = {};
    setProgress(0);
    setSecondsRemaining(15);
    setResult(null);
    currentBpmRef.current = null;
    setCurrentBpm(null);
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
    lastBpmUpdateRef.current = 0;
    fingerClassifyStateRef.current = {};
    setProgress(0);
    setSecondsRemaining(15);
    currentBpmRef.current = null;
    setCurrentBpm(null);
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
    currentBpm,
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
