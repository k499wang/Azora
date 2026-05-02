import { useCallback, useRef, useState } from 'react';
import {
  useFrameProcessor,
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
import { HeartRateManager } from '../lib/heartRate/heartRateManager';
import { buildCaptureResult } from '../lib/heartRate/captureResult';
import { useMeasurementTimer } from './useMeasurementTimer';
import { useHeartRateCamera } from './useHeartRateCamera';

const CAPTURE_DURATION_MS = 45000;
const CAPTURE_DURATION_SEC = CAPTURE_DURATION_MS / 1000;
const MIN_GOOD_DURATION_MS = 2500;
const PROGRESS_UPDATE_INTERVAL_MS = 200;
const BPM_UPDATE_INTERVAL_MS = 1000;
const FRAME_PROCESSING_FPS = 45;

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
  captureSamples: PpgFrameSample[];
  device: ReturnType<typeof useHeartRateCamera>['device'];
  format: ReturnType<typeof useHeartRateCamera>['format'];
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
  const [secondsRemaining, setSecondsRemaining] = useState(CAPTURE_DURATION_SEC);
  const [currentBpm, setCurrentBpm] = useState<number | null>(null);
  const [beatTick, setBeatTick] = useState(0);
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [captureSamples, setCaptureSamples] = useState<PpgFrameSample[]>([]);

  const samplesRef = useRef<PpgFrameSample[]>([]);
  const goodSinceRef = useRef<number | null>(null);
  const lastBpmUpdateRef = useRef<number>(0);
  const lastFrameTimestampRef = useRef<number | null>(null);
  const currentBpmRef = useRef<number | null>(null);
  const captureStateRef = useRef<CaptureState>('idle');
  const fingerPlacementRef = useRef<FingerPlacementState>('no_finger');
  const managerRef = useRef(new HeartRateManager());

  const { device, format, hasPermission, requestPermission } = useHeartRateCamera();

  const needsIllumination = captureState === 'camera_check' || captureState === 'measuring';
  const torchMode: 'on' | 'off' =
    needsIllumination && device?.hasTorch === true
      ? 'on'
      : 'off';

  const setCaptureStateAndRef = useCallback((next: CaptureState) => {
    captureStateRef.current = next;
    setCaptureState(next);
  }, []);

  const resetMeasurementRefs = useCallback(() => {
    samplesRef.current = [];
    goodSinceRef.current = null;
    lastBpmUpdateRef.current = 0;
  }, []);

  const resetCaptureRefs = useCallback(() => {
    resetMeasurementRefs();
    lastFrameTimestampRef.current = null;
    currentBpmRef.current = null;
    managerRef.current.reset();
  }, [resetMeasurementRefs]);

  const updateProgress = useCallback((elapsedMs: number) => {
    const clampedElapsed = Math.max(0, Math.min(CAPTURE_DURATION_MS, elapsedMs));
    const prog = clampedElapsed / CAPTURE_DURATION_MS;
    const remaining = Math.max(0, Math.ceil((CAPTURE_DURATION_MS - clampedElapsed) / 1000));
    setProgress(prog);
    setSecondsRemaining(remaining);
  }, []);

  const finishMeasurement = useCallback(() => {
    updateProgress(CAPTURE_DURATION_MS);
    setCaptureStateAndRef('processing');

    const samples = [...samplesRef.current];
    const ibiSamples = managerRef.current.getIbiSamples();
    setCaptureSamples(samples);
    setTimeout(() => {
      if (captureStateRef.current !== 'processing') return;

      const nextResult = buildCaptureResult(samples, ibiSamples);
      setResult(nextResult);
      setCaptureStateAndRef(nextResult.reading == null ? 'error' : 'done');
    }, 0);
  }, [setCaptureStateAndRef, updateProgress]);

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
    resetMeasurementRefs();
    const measurementStartTs = lastFrameTimestampRef.current;
    if (measurementStartTs != null) {
      managerRef.current.beginMeasurementWindow(measurementStartTs);
    }
    const warmBpm = managerRef.current.getCurrentBpm();
    currentBpmRef.current = warmBpm;
    setProgress(0);
    setSecondsRemaining(CAPTURE_DURATION_SEC);
    setBeatTick(0);
    setCurrentBpm(warmBpm);
    setCaptureStateAndRef('measuring');
    startMeasurementTimer();
  }, [resetMeasurementRefs, setCaptureStateAndRef, startMeasurementTimer, stopMeasurementTimer]);

  const addSample = useRunOnJS(
    (frameSample: unknown) => {
      if (!isValidFrameSample(frameSample)) {
        samplesRef.current = [];
        goodSinceRef.current = null;
        currentBpmRef.current = null;
        setCurrentBpm(null);
        fingerPlacementRef.current = 'no_finger';
        setFingerPlacement('no_finger');
        managerRef.current.reset();
        return;
      }

      const timestamp = frameSample.timestamp;
      lastFrameTimestampRef.current = timestamp;
      const state = captureStateRef.current;
      if (state !== 'camera_check' && state !== 'measuring') return;

      samplesRef.current.push(frameSample);

      const frameState = managerRef.current.processFrame(frameSample);
      if (frameState.fingerPlacement !== fingerPlacementRef.current) {
        fingerPlacementRef.current = frameState.fingerPlacement;
        setFingerPlacement(frameState.fingerPlacement);
      }

      if (state === 'camera_check') {
        if (frameState.fingerPlacement !== 'good') {
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

      const bpm = managerRef.current.getCurrentBpm();

      if (frameState.beatDetected && bpm != null) {
        setBeatTick((tick) => tick + 1);
      }

      if (timestamp - lastBpmUpdateRef.current >= BPM_UPDATE_INTERVAL_MS) {
        lastBpmUpdateRef.current = timestamp;
        if (bpm != null) {
          currentBpmRef.current = bpm;
          setCurrentBpm(bpm);
        }
      }

      if (frameState.fingerPlacement === 'lost') {
        currentBpmRef.current = null;
        setCurrentBpm(null);
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
    setSecondsRemaining(CAPTURE_DURATION_SEC);
    setResult(null);
    setCaptureSamples([]);
    setBeatTick(0);
    setCurrentBpm(null);
    fingerPlacementRef.current = 'no_finger';
    setFingerPlacement('no_finger');
    setCaptureStateAndRef('camera_check');
  }, [resetCaptureRefs, setCaptureStateAndRef, stopMeasurementTimer]);

  const cancel = useCallback(() => {
    stopMeasurementTimer();
    resetCaptureRefs();
    setProgress(0);
    setSecondsRemaining(CAPTURE_DURATION_SEC);
    setBeatTick(0);
    setCurrentBpm(null);
    fingerPlacementRef.current = 'no_finger';
    setFingerPlacement('no_finger');
    setCaptureStateAndRef('idle');
  }, [resetCaptureRefs, setCaptureStateAndRef, stopMeasurementTimer]);

  const reset = useCallback(() => {
    cancel();
    setResult(null);
    setCaptureSamples([]);
  }, [cancel]);

  return {
    captureState,
    fingerPlacement,
    progress,
    secondsRemaining,
    currentBpm,
    beatTick,
    result,
    captureSamples,
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
