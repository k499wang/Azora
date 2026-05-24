import { useCallback, useRef, useState } from 'react';
import { useFrameProcessor } from 'react-native-vision-camera';
import { useRunOnJS } from 'react-native-worklets-core';
import type {
  CaptureState,
  PpgFrameSample,
  CaptureResult,
  FingerPlacementState,
  LivePpgSignalSample,
} from '../lib/heartRate/types';
import { heartRatePlugin } from '../lib/heartRate/heartRatePlugin';
import { HeartRateManager } from '../lib/heartRate/heartRateManager';
import { buildCaptureResult } from '../lib/heartRate/captureResult';
import { createLiveBpmPresentationFilter } from '../lib/heartRate/bpmSmoothing';
import { isValidFrameSample } from '../lib/heartRate/frameValidation';
import { runAfterNextPaint } from '../lib/ui/runAfterNextPaint';
import { useMeasurementTimer } from './useMeasurementTimer';
import { useHeartRateCamera } from './useHeartRateCamera';

const CAPTURE_DURATION_MS = 45000;
const CAPTURE_DURATION_SEC = CAPTURE_DURATION_MS / 1000;
const MIN_GOOD_DURATION_MS = 2500;
const PROGRESS_UPDATE_INTERVAL_MS = 200;
const BPM_UPDATE_INTERVAL_MS = 1000;
const SIGNAL_GRAPH_UPDATE_INTERVAL_MS = 50;

interface UseHeartRateCaptureOptions {
  onCaptureComplete?: (result: CaptureResult, captureSamples: PpgFrameSample[]) => void;
}

interface UseHeartRateCaptureReturn {
  captureState: CaptureState;
  fingerPlacement: FingerPlacementState;
  progress: number;
  secondsRemaining: number;
  currentBpm: number | null;
  beatTick: number;
  liveSignalSamples: LivePpgSignalSample[];
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

export function useHeartRateCapture(
  options: UseHeartRateCaptureOptions = {},
): UseHeartRateCaptureReturn {
  const onCaptureCompleteRef = useRef(options.onCaptureComplete);
  onCaptureCompleteRef.current = options.onCaptureComplete;

  const [captureState, setCaptureState] = useState<CaptureState>('idle');
  const [fingerPlacement, setFingerPlacement] = useState<FingerPlacementState>('no_finger');
  const [progress, setProgress] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(CAPTURE_DURATION_SEC);
  const [currentBpm, setCurrentBpm] = useState<number | null>(null);
  const [beatTick, setBeatTick] = useState(0);
  const [liveSignalSamples, setLiveSignalSamples] = useState<LivePpgSignalSample[]>([]);
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [captureSamples, setCaptureSamples] = useState<PpgFrameSample[]>([]);

  const samplesRef = useRef<PpgFrameSample[]>([]);
  const goodSinceRef = useRef<number | null>(null);
  const lastBpmUpdateRef = useRef<number>(0);
  const lastSignalGraphUpdateRef = useRef<number>(0);
  const lastPublishedSignalTimestampRef = useRef<number | null>(null);
  const lastFrameTimestampRef = useRef<number | null>(null);
  const measurementStartedAtRef = useRef<number | null>(null);
  const currentBpmRef = useRef<number | null>(null);
  const captureStateRef = useRef<CaptureState>('idle');
  const fingerPlacementRef = useRef<FingerPlacementState>('no_finger');
  const managerRef = useRef(new HeartRateManager());
  const liveBpmFilterRef = useRef(createLiveBpmPresentationFilter());

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
    lastSignalGraphUpdateRef.current = 0;
    lastPublishedSignalTimestampRef.current = null;
    measurementStartedAtRef.current = null;
    liveBpmFilterRef.current.reset();
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
    setCaptureSamples(samples);

    void runAfterNextPaint(() => {
      if (captureStateRef.current !== 'processing') return;

      const nextResult = buildCaptureResult(samples);
      setResult(nextResult);
      setCaptureStateAndRef(nextResult.reading == null ? 'error' : 'done');
      if (nextResult.reading != null) {
        onCaptureCompleteRef.current?.(nextResult, samples);
      }
    });
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
    measurementStartedAtRef.current = measurementStartTs;
    if (measurementStartTs != null) {
      managerRef.current.beginMeasurementWindow(measurementStartTs);
    }
    currentBpmRef.current = null;
    liveBpmFilterRef.current.reset();
    setProgress(0);
    setSecondsRemaining(CAPTURE_DURATION_SEC);
    setBeatTick(0);
    setCurrentBpm(null);
    setLiveSignalSamples([]);
    setCaptureStateAndRef('measuring');
    startMeasurementTimer();
  }, [resetMeasurementRefs, setCaptureStateAndRef, startMeasurementTimer, stopMeasurementTimer]);

  const addSample = useRunOnJS(
    (frameSample: unknown) => {
      if (!isValidFrameSample(frameSample)) {
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

      if (timestamp - lastSignalGraphUpdateRef.current >= SIGNAL_GRAPH_UPDATE_INTERVAL_MS) {
        lastSignalGraphUpdateRef.current = timestamp;
        const latestSignalTimestamp = managerRef.current.getLatestLiveSignalTimestamp();
        if (
          latestSignalTimestamp != null &&
          latestSignalTimestamp !== lastPublishedSignalTimestampRef.current
        ) {
          lastPublishedSignalTimestampRef.current = latestSignalTimestamp;
          setLiveSignalSamples(managerRef.current.getLiveSignalSamples());
        }
      }

      if (frameState.beatDetected) {
        setBeatTick((tick) => tick + 1);
      }

      if (timestamp - lastBpmUpdateRef.current >= BPM_UPDATE_INTERVAL_MS) {
        lastBpmUpdateRef.current = timestamp;
        const bpm = managerRef.current.getCurrentBpm();
        if (bpm != null) {
          const elapsedMs =
            measurementStartedAtRef.current == null
              ? 0
              : timestamp - measurementStartedAtRef.current;
          const stabilizedBpm = liveBpmFilterRef.current.update({ elapsedMs, bpm });
          if (stabilizedBpm != null) {
            currentBpmRef.current = stabilizedBpm;
            setCurrentBpm(stabilizedBpm);
          }
        }
      }

      if (frameState.fingerPlacement === 'lost' && currentBpmRef.current != null) {
        currentBpmRef.current = null;
        liveBpmFilterRef.current.reset();
        setCurrentBpm(null);
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
    stopMeasurementTimer();
    resetCaptureRefs();
    setProgress(0);
    setSecondsRemaining(CAPTURE_DURATION_SEC);
    setResult(null);
    setCaptureSamples([]);
    setBeatTick(0);
    setCurrentBpm(null);
    setLiveSignalSamples([]);
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
    setLiveSignalSamples([]);
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
    liveSignalSamples,
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
