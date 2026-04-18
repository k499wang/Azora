import { useCallback, useRef, useState } from 'react';
import {
  useFrameProcessor,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
  runAtTargetFps,
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
import {
  detectLatestBeat,
  PREVIEW_BPM_OPTIONS,
} from '../lib/heartRate/signalProcessing';
import { computeRollingBPM } from '../lib/heartRate/rollingWindow';
import { buildCaptureResult } from '../lib/heartRate/captureResult';
import { useMeasurementTimer } from './useMeasurementTimer';

const CAPTURE_DURATION_MS = 15000;
const MIN_GOOD_DURATION_MS = 1500;
const FINGER_QUALITY_WINDOW_MS = 1000;
const ROLLING_CLASSIFY_WINDOW_MS = 2000;
const ROLLING_BPM_WINDOW_MS = 8000;
const BPM_UPDATE_INTERVAL_MS = 1000;
const PROGRESS_UPDATE_INTERVAL_MS = 200;
const BEAT_DETECTION_INTERVAL_MS = 80;
const FRAME_PROCESSING_FPS = 20;

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
  beatTick: number;
  result: CaptureResult | null;
  device: ReturnType<typeof useCameraDevice>;
  format: ReturnType<typeof useCameraFormat>;
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
  const [beatTick, setBeatTick] = useState(0);
  const [result, setResult] = useState<CaptureResult | null>(null);

  const samplesRef = useRef<PpgFrameSample[]>([]);
  const goodSinceRef = useRef<number | null>(null);
  const lastBpmUpdateRef = useRef<number>(0);
  const lastBeatCheckTimestampRef = useRef<number>(0);
  const lastBeatTimestampRef = useRef<number | null>(null);
  const currentBpmRef = useRef<number | null>(null);
  const fingerPlacementRef = useRef<FingerPlacementState>('no_finger');
  const captureStateRef = useRef<CaptureState>('idle');
  const fingerClassifyStateRef = useRef<{
    previousState?: FingerPlacementState;
    goodSinceMs?: number;
  }>({});

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back', {
    physicalDevices: ['wide-angle-camera'],
  });
  const format = useCameraFormat(device, [
    { fps: 30 },
    { videoResolution: { width: 640, height: 480 } },
  ]);

  const torchMode: 'on' | 'off' =
    captureState === 'camera_check' || captureState === 'measuring' ? 'on' : 'off';

  const resetCaptureRefs = useCallback(() => {
    samplesRef.current = [];
    goodSinceRef.current = null;
    lastBpmUpdateRef.current = 0;
    lastBeatCheckTimestampRef.current = 0;
    lastBeatTimestampRef.current = null;
    currentBpmRef.current = null;
    fingerClassifyStateRef.current = {};
  }, []);

  const updateProgress = useCallback((elapsedMs: number) => {
    const clampedElapsed = Math.max(0, Math.min(CAPTURE_DURATION_MS, elapsedMs));
    const prog = clampedElapsed / CAPTURE_DURATION_MS;
    const remaining = Math.max(0, Math.ceil((CAPTURE_DURATION_MS - clampedElapsed) / 1000));
    setProgress(prog);
    setSecondsRemaining(remaining);
  }, []);

  const finishMeasurement = useCallback(() => {
    updateProgress(CAPTURE_DURATION_MS);
    setCaptureState('processing');
    captureStateRef.current = 'processing';

    // Yield so 'processing' paints before the blocking BPM computation.
    const samples = [...samplesRef.current];
    setTimeout(() => {
      if (captureStateRef.current !== 'processing') return;

      const nextResult = buildCaptureResult(samples);
      const next = nextResult.reading == null ? 'error' : 'done';
      setResult(nextResult);
      setCaptureState(next);
      captureStateRef.current = next;
    }, 0);
  }, [updateProgress]);

  const {
    start: startMeasurementTimer,
    stop: stopMeasurementTimer,
  } = useMeasurementTimer({
    durationMs: CAPTURE_DURATION_MS,
    intervalMs: PROGRESS_UPDATE_INTERVAL_MS,
    onTick: updateProgress,
    onComplete: finishMeasurement,
  });

  const startMeasuring = useCallback(() => {
    stopMeasurementTimer();
    resetCaptureRefs();
    setProgress(0);
    setSecondsRemaining(15);
    setBeatTick(0);
    setCurrentBpm(null);
    setCaptureState('measuring');
    captureStateRef.current = 'measuring';
    startMeasurementTimer();
  }, [resetCaptureRefs, startMeasurementTimer, stopMeasurementTimer]);

  // JS callback invoked from worklet to add a brightness sample
  const addSample = useRunOnJS(
    (frameSample: unknown) => {
      if (!isValidFrameSample(frameSample)) {
        samplesRef.current = [];
        goodSinceRef.current = null;
        fingerClassifyStateRef.current = {};
        currentBpmRef.current = null;
        fingerPlacementRef.current = 'no_finger';
        lastBeatTimestampRef.current = null;
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
      if (placement !== fingerPlacementRef.current) {
        fingerPlacementRef.current = placement;
        setFingerPlacement(placement);
      }

      if (state === 'camera_check') {
        if (placement !== 'good') {
          goodSinceRef.current = null;
          return;
        }
        if (goodSinceRef.current == null) {
          goodSinceRef.current = timestamp;
          return;
        }
        if (timestamp - goodSinceRef.current >= MIN_GOOD_DURATION_MS) {
          startMeasuring();
        }
        return;
      }

      // state === 'measuring'
      const canEstimateBpm = placement === 'good' || placement === 'partial';
      if (!canEstimateBpm) {
        if (currentBpmRef.current != null) {
          currentBpmRef.current = null;
          setCurrentBpm(null);
        }
        lastBeatTimestampRef.current = null;
        return;
      }

      if (timestamp - lastBeatCheckTimestampRef.current >= BEAT_DETECTION_INTERVAL_MS) {
        lastBeatCheckTimestampRef.current = timestamp;
        const beat = detectLatestBeat(samplesRef.current, lastBeatTimestampRef.current);
        if (beat != null) {
          lastBeatTimestampRef.current = beat.timestamp;
          setBeatTick((tick) => tick + 1);
        }
      }

      if (timestamp - lastBpmUpdateRef.current >= BPM_UPDATE_INTERVAL_MS) {
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
    },
    [startMeasuring],
  );

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      runAtTargetFps(FRAME_PROCESSING_FPS, () => {
        'worklet';
        const frameSample = heartRatePlugin(frame);
        if (frameSample != null) {
          addSample(frameSample);
        }
      });
    },
    [addSample],
  );

  const startCapture = useCallback(() => {
    stopMeasurementTimer();
    resetCaptureRefs();
    setProgress(0);
    setSecondsRemaining(15);
    setResult(null);
    setBeatTick(0);
    setCurrentBpm(null);
    fingerPlacementRef.current = 'no_finger';
    setFingerPlacement('no_finger');
    setCaptureState('camera_check');
    captureStateRef.current = 'camera_check';
  }, [resetCaptureRefs, stopMeasurementTimer]);

  const cancel = useCallback(() => {
    stopMeasurementTimer();
    resetCaptureRefs();
    setProgress(0);
    setSecondsRemaining(15);
    setBeatTick(0);
    setCurrentBpm(null);
    fingerPlacementRef.current = 'no_finger';
    setFingerPlacement('no_finger');
    setCaptureState('idle');
    captureStateRef.current = 'idle';
  }, [resetCaptureRefs, stopMeasurementTimer]);

  const reset = useCallback(() => {
    cancel();
    setResult(null);
  }, [cancel]);

  return {
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
  };
}
