import { useCallback, useRef, useState } from 'react';
import {
  runAtTargetFps,
  useFrameProcessor,
} from 'react-native-vision-camera';
import { useRunOnJS, useSharedValue } from 'react-native-worklets-core';
import type {
  CaptureState,
  PpgFrameSample,
  CaptureResult,
  FingerPlacementState,
  LivePpgSignalSample,
  SignalStatus,
} from '../lib/heartRate/types';
import { heartRatePlugin } from '../lib/heartRate/heartRatePlugin';
import { HeartRateManager } from '../lib/heartRate/heartRateManager';
import { buildCaptureResult } from '../lib/heartRate/captureResult';
import { LIVE_SIGNAL_GRAPH_UPDATE_INTERVAL_MS } from '../lib/heartRate/liveSignalGraphConfig';
import {
  DEFAULT_CAPTURE_MODE,
  getCaptureModeConfig,
  resolveCaptureFps,
  type HeartRateCaptureMode,
} from '../lib/heartRate/captureModes';
import { createLiveBpmPresentationFilter } from '../lib/heartRate/bpmSmoothing';
import { createBeatTickScheduler } from '../lib/heartRate/beatTickScheduler';
import { runAfterNextPaint } from '../lib/ui/runAfterNextPaint';
import { useMeasurementTimer } from './useMeasurementTimer';
import { useHeartRateCamera } from './useHeartRateCamera';
import { useDeviceMotionFeed } from './useDeviceMotionFeed';

const MIN_GOOD_DURATION_MS = 2500;
const PROGRESS_UPDATE_INTERVAL_MS = 200;
const BPM_UPDATE_INTERVAL_MS = 1000;
const LIVE_PROCESSING_FPS = 20;
const LIVE_PROCESSING_INTERVAL_MS = 50;

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

interface UseHeartRateCaptureOptions {
  mode?: HeartRateCaptureMode;
  onCaptureComplete?: (result: CaptureResult, captureSamples: PpgFrameSample[]) => void;
}

interface UseHeartRateCaptureReturn {
  captureState: CaptureState;
  fingerPlacement: FingerPlacementState;
  signalStatus: SignalStatus;
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
  cameraFps: number;
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
  const mode = options.mode ?? DEFAULT_CAPTURE_MODE;
  const captureModeConfig = getCaptureModeConfig(mode);
  const captureDurationMs = captureModeConfig.durationMs;
  const captureDurationSec = captureDurationMs / 1000;
  const preferredCameraFps = mode === 'full' ? 60 : 30;
  const camera = useHeartRateCamera(preferredCameraFps);
  const cameraFps = resolveCaptureFps(mode, camera.format);

  const onCaptureCompleteRef = useRef(options.onCaptureComplete);
  onCaptureCompleteRef.current = options.onCaptureComplete;
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const [captureState, setCaptureState] = useState<CaptureState>('idle');
  const [fingerPlacement, setFingerPlacement] = useState<FingerPlacementState>('no_finger');
  const [signalStatus, setSignalStatus] = useState<SignalStatus>('no_finger');
  const [progress, setProgress] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(captureDurationSec);
  const [currentBpm, setCurrentBpm] = useState<number | null>(null);
  const [beatTick, setBeatTick] = useState(0);
  const [liveSignalSamples, setLiveSignalSamples] = useState<LivePpgSignalSample[]>([]);
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [captureSamples, setCaptureSamples] = useState<PpgFrameSample[]>([]);

  const samplesRef = useRef<PpgFrameSample[]>([]);
  const presentationBpmSamplesRef = useRef<Array<{ offsetMs: number; bpm: number }>>([]);
  const goodSinceRef = useRef<number | null>(null);
  const lastBpmUpdateRef = useRef<number>(0);
  const lastSignalGraphUpdateRef = useRef<number>(0);
  const lastPublishedSignalTimestampRef = useRef<number | null>(null);
  const lastLiveProcessingTimestampRef = useRef<number>(0);
  const lastFrameTimestampRef = useRef<number | null>(null);
  const measurementStartedAtRef = useRef<number | null>(null);
  const currentBpmRef = useRef<number | null>(null);
  const captureStateRef = useRef<CaptureState>('idle');
  const fingerPlacementRef = useRef<FingerPlacementState>('no_finger');
  const signalStatusRef = useRef<SignalStatus>('no_finger');
  const managerRef = useRef(new HeartRateManager());
  const liveBpmFilterRef = useRef(createLiveBpmPresentationFilter());
  const beatSchedulerRef = useRef(
    createBeatTickScheduler({ onBeat: () => setBeatTick((tick) => tick + 1) }),
  );
  const offlineCaptureActive = useSharedValue(false);

  const { device, format, hasPermission, requestPermission } = camera;

  useDeviceMotionFeed(managerRef);

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
    presentationBpmSamplesRef.current = [];
    goodSinceRef.current = null;
    lastBpmUpdateRef.current = 0;
    lastSignalGraphUpdateRef.current = 0;
    lastPublishedSignalTimestampRef.current = null;
    lastLiveProcessingTimestampRef.current = 0;
    measurementStartedAtRef.current = null;
    offlineCaptureActive.value = false;
    liveBpmFilterRef.current.reset();
    beatSchedulerRef.current.reset();
  }, [offlineCaptureActive]);

  const resetCaptureRefs = useCallback(() => {
    resetMeasurementRefs();
    lastFrameTimestampRef.current = null;
    currentBpmRef.current = null;
    managerRef.current.reset();
  }, [resetMeasurementRefs]);

  const updateProgress = useCallback((elapsedMs: number) => {
    const clampedElapsed = Math.max(0, Math.min(captureDurationMs, elapsedMs));
    const prog = clampedElapsed / captureDurationMs;
    const remaining = Math.max(0, Math.ceil((captureDurationMs - clampedElapsed) / 1000));
    setProgress(prog);
    setSecondsRemaining(remaining);
  }, [captureDurationMs]);

  const finishMeasurement = useCallback(() => {
    offlineCaptureActive.value = false;
    updateProgress(captureDurationMs);
    setCaptureStateAndRef('processing');

    const samples = [...samplesRef.current];
    const fallbackIbiSamples = managerRef.current.getIbiSamples();
    setCaptureSamples(samples);

    void runAfterNextPaint(() => {
      if (captureStateRef.current !== 'processing') return;

      const nextResult = buildCaptureResult(samples, modeRef.current, {
        fallbackIbiSamples,
        presentationBpmSamples: presentationBpmSamplesRef.current,
      });
      setResult(nextResult);
      setCaptureStateAndRef(nextResult.reading == null ? 'error' : 'done');
      if (nextResult.reading != null) {
        onCaptureCompleteRef.current?.(nextResult, samples);
      }
    });
  }, [captureDurationMs, offlineCaptureActive, setCaptureStateAndRef, updateProgress]);

  const {
    start: startMeasurementTimer,
    stop: stopMeasurementTimer,
  } = useMeasurementTimer({
    durationMs: captureDurationMs,
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
    // Start the hold with a fresh PPG trace instead of inheriting the
    // calibration-era signal the manager accumulated during camera_check.
    managerRef.current.clearLiveSignalSamples();
    currentBpmRef.current = null;
    liveBpmFilterRef.current.reset();
    setProgress(0);
    setSecondsRemaining(captureDurationSec);
    setBeatTick(0);
    setCurrentBpm(null);
    setLiveSignalSamples([]);
    offlineCaptureActive.value = true;
    setCaptureStateAndRef('measuring');
    startMeasurementTimer();
  }, [captureDurationSec, offlineCaptureActive, resetMeasurementRefs, setCaptureStateAndRef, startMeasurementTimer, stopMeasurementTimer]);

  const addSample = useRunOnJS(
    (frameSample: unknown) => {
      if (!isValidFrameSample(frameSample)) {
        return;
      }

      const timestamp = frameSample.timestamp;
      lastFrameTimestampRef.current = timestamp;
      const state = captureStateRef.current;
      if (state !== 'camera_check' && state !== 'measuring') return;

      if (state === 'measuring') {
        samplesRef.current.push(frameSample);
      }

      // Full capture stores every available 60 fps frame for offline HRV, but
      // keeps the existing live detector at its designed 30 Hz cadence.
      const shouldThrottleProcessing =
        state !== 'measuring' || modeRef.current === 'full';
      const liveProcessingIntervalMs =
        state === 'measuring' && modeRef.current === 'full'
          ? 1000 / 30
          : LIVE_PROCESSING_INTERVAL_MS;
      if (
        shouldThrottleProcessing &&
        timestamp - lastLiveProcessingTimestampRef.current <
          liveProcessingIntervalMs
      ) {
        return;
      }
      lastLiveProcessingTimestampRef.current = timestamp;

      const frameState = managerRef.current.processFrame(frameSample);
      if (frameState.fingerPlacement !== fingerPlacementRef.current) {
        fingerPlacementRef.current = frameState.fingerPlacement;
        setFingerPlacement(frameState.fingerPlacement);
      }
      if (frameState.signalStatus !== signalStatusRef.current) {
        signalStatusRef.current = frameState.signalStatus;
        setSignalStatus(frameState.signalStatus);
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

      if (timestamp - lastSignalGraphUpdateRef.current >= LIVE_SIGNAL_GRAPH_UPDATE_INTERVAL_MS) {
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

      if (frameState.beatDetected && frameState.beatPeakTs != null) {
        beatSchedulerRef.current.schedule(frameState.beatPeakTs, timestamp);
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
            presentationBpmSamplesRef.current.push({
              offsetMs: Math.max(0, Math.round(elapsedMs)),
              bpm: stabilizedBpm,
            });
            currentBpmRef.current = stabilizedBpm;
            setCurrentBpm(stabilizedBpm);
          }
        }
        // When the manager withholds a reading (motion / no pulse / weak signal)
        // the last number is intentionally held on screen — the top warning
        // banner already communicates the problem, so we show the stale BPM
        // rather than a second "keep still" cue in the number slot. A fully
        // removed finger (below) is the one case that still clears.
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
      if (offlineCaptureActive.value) {
        // Preserve every frame delivered by the camera during measurement.
        // Throttling at the nominal source rate can still drop frames due to
        // normal scheduling jitter; live Full-mode processing is limited to
        // 30 Hz separately in addSample after the frame has been recorded.
        const frameSample = heartRatePlugin(frame);
        if (frameSample != null) {
          addSample(frameSample);
        }
        return;
      }

      runAtTargetFps(LIVE_PROCESSING_FPS, () => {
        'worklet';
        const frameSample = heartRatePlugin(frame);
        if (frameSample != null) {
          addSample(frameSample);
        }
      });
    },
    [addSample, offlineCaptureActive],
  );

  const startCapture = useCallback(() => {
    stopMeasurementTimer();
    resetCaptureRefs();
    setProgress(0);
    setSecondsRemaining(captureDurationSec);
    setResult(null);
    setCaptureSamples([]);
    setBeatTick(0);
    setCurrentBpm(null);
    setLiveSignalSamples([]);
    fingerPlacementRef.current = 'no_finger';
    setFingerPlacement('no_finger');
    signalStatusRef.current = 'no_finger';
    setSignalStatus('no_finger');
    setCaptureStateAndRef('camera_check');
  }, [captureDurationSec, resetCaptureRefs, setCaptureStateAndRef, stopMeasurementTimer]);

  const cancel = useCallback(() => {
    stopMeasurementTimer();
    resetCaptureRefs();
    setProgress(0);
    setSecondsRemaining(captureDurationSec);
    setBeatTick(0);
    setCurrentBpm(null);
    setLiveSignalSamples([]);
    fingerPlacementRef.current = 'no_finger';
    setFingerPlacement('no_finger');
    signalStatusRef.current = 'no_finger';
    setSignalStatus('no_finger');
    setCaptureStateAndRef('idle');
  }, [captureDurationSec, resetCaptureRefs, setCaptureStateAndRef, stopMeasurementTimer]);

  const reset = useCallback(() => {
    cancel();
    setResult(null);
    setCaptureSamples([]);
  }, [cancel]);

  return {
    captureState,
    fingerPlacement,
    signalStatus,
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
    cameraFps,
    startCapture,
    startMeasuring,
    cancel,
    reset,
    hasPermission,
    requestPermission,
  };
}
