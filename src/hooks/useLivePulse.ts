import { useCallback, useEffect, useRef, useState } from 'react';
import {
  runAtTargetFps,
  useFrameProcessor,
} from 'react-native-vision-camera';
import { useRunOnJS, useSharedValue } from 'react-native-worklets-core';
import type {
  FingerPlacementState,
  IbiSample,
  LivePpgSignalSample,
  PpgFrameSample,
} from '../lib/heartRate/types';
import { heartRatePlugin } from '../lib/heartRate/heartRatePlugin';
import { HeartRateManager } from '../lib/heartRate/heartRateManager';
import {
  createBreathExerciseBpmPresentationFilter,
  createLiveBpmPresentationFilter,
} from '../lib/heartRate/bpmSmoothing';
import { createBeatTickScheduler } from '../lib/heartRate/beatTickScheduler';
import { LIVE_SIGNAL_GRAPH_UPDATE_INTERVAL_MS } from '../lib/heartRate/liveSignalGraphConfig';
import {
  classifyFingerPlacementStateless,
  type FingerPlacementClassifyState,
} from '../lib/heartRate/fingerQuality';
import type { MotionStabilityState } from '../lib/heartRate/motionStability';
import { useHeartRateCamera } from './useHeartRateCamera';
import { useHeartRateMotionStability } from './useHeartRateMotionStability';

const BPM_UPDATE_INTERVAL_MS = 1000;
const FINGER_LOST_TIMEOUT_MS = 1500;
const OFFLINE_CAPTURE_FPS = 30;
const LIVE_PROCESSING_FPS = 20;
const LIVE_PROCESSING_INTERVAL_MS = 50;
const FINGER_QUALITY_WINDOW_MS = 1000;

function isValidFrameSample(value: unknown): value is PpgFrameSample {
  if (value == null || typeof value !== 'object') return false;
  const s = value as Partial<PpgFrameSample>;
  if (!Number.isFinite(s.timestamp) || !Array.isArray(s.rois)) return false;
  return (
    s.rois.length > 0 &&
    s.rois.every(
      (roi) =>
        roi != null &&
        typeof roi.id === 'string' &&
        Number.isFinite(roi.r) &&
        Number.isFinite(roi.g) &&
        Number.isFinite(roi.b) &&
        Number.isFinite(roi.saturatedPct) &&
        Number.isFinite(roi.darkPct) &&
        Number.isFinite(roi.variance),
    )
  );
}

interface UseLivePulseReturn {
  active: boolean;
  start: () => void;
  stop: () => void;
  fingerPlacement: FingerPlacementState;
  motionState: MotionStabilityState;
  currentBpm: number | null;
  beatTick: number;
  liveSignalSamples: LivePpgSignalSample[];
  device: ReturnType<typeof useHeartRateCamera>['device'];
  format: ReturnType<typeof useHeartRateCamera>['format'];
  frameProcessor: ReturnType<typeof useFrameProcessor>;
  torchMode: 'on' | 'off';
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  beginMeasurementWindow: () => void;
  getMeasurementSamples: () => PpgFrameSample[];
  getIbiSamples: () => IbiSample[];
}

type LivePulsePresentationMode = 'default' | 'breathExercise';

interface UseLivePulseOptions {
  presentationMode?: LivePulsePresentationMode;
}

function createLivePulseBpmFilter(mode: LivePulsePresentationMode) {
  return mode === 'breathExercise'
    ? createBreathExerciseBpmPresentationFilter()
    : createLiveBpmPresentationFilter();
}

export function useLivePulse(
  options: UseLivePulseOptions = {},
): UseLivePulseReturn {
  const presentationMode = options.presentationMode ?? 'default';
  const [active, setActive] = useState(false);
  const [fingerPlacement, setFingerPlacement] = useState<FingerPlacementState>('no_finger');
  const [currentBpm, setCurrentBpm] = useState<number | null>(null);
  const [beatTick, setBeatTick] = useState(0);
  const [liveSignalSamples, setLiveSignalSamples] = useState<LivePpgSignalSample[]>([]);
  const motion = useHeartRateMotionStability(active);

  const activeRef = useRef(false);
  const managerRef = useRef(new HeartRateManager());
  const fingerQualitySamplesRef = useRef<PpgFrameSample[]>([]);
  const fingerQualityStateRef = useRef<FingerPlacementClassifyState>({});
  const lastBpmUpdateRef = useRef(0);
  const lastFingerSeenAtRef = useRef<number | null>(null);
  const lastFrameTimestampRef = useRef<number | null>(null);
  const streamStartedAtRef = useRef<number | null>(null);
  const measurementActiveRef = useRef(false);
  const measurementSamplesRef = useRef<PpgFrameSample[]>([]);
  const publishedBpmRef = useRef<number | null>(null);
  const fingerPlacementRef = useRef<FingerPlacementState>('no_finger');
  const signalReadPausedRef = useRef(false);
  const motionStateRef = useRef<MotionStabilityState>('stable');
  const liveBpmFilterRef = useRef(createLivePulseBpmFilter(presentationMode));
  const beatSchedulerRef = useRef(
    createBeatTickScheduler({ onBeat: () => setBeatTick((tick) => tick + 1) }),
  );
  const lastSignalGraphUpdateRef = useRef<number>(0);
  const lastPublishedSignalTimestampRef = useRef<number | null>(null);
  const lastLiveProcessingTimestampRef = useRef<number>(0);
  const offlineCaptureActive = useSharedValue(false);

  const { device, format, hasPermission, requestPermission } = useHeartRateCamera();

  const torchMode: 'on' | 'off' =
    active && device?.hasTorch === true
      ? 'on'
      : 'off';

  useEffect(() => {
    motionStateRef.current = motion.state;
  }, [motion.state]);

  const updateFingerQuality = useCallback((frameSample: PpgFrameSample): FingerPlacementState => {
    const timestamp = frameSample.timestamp;
    fingerQualitySamplesRef.current.push(frameSample);
    const cutoff = timestamp - FINGER_QUALITY_WINDOW_MS;
    fingerQualitySamplesRef.current = fingerQualitySamplesRef.current.filter(
      (sample) => sample.timestamp >= cutoff,
    );

    const result = classifyFingerPlacementStateless(
      fingerQualitySamplesRef.current,
      FINGER_QUALITY_WINDOW_MS,
      fingerQualityStateRef.current,
    );
    fingerQualityStateRef.current = result.state;
    return result.placement;
  }, []);

  const resetStreamState = useCallback(() => {
    managerRef.current.reset();
    fingerQualitySamplesRef.current = [];
    fingerQualityStateRef.current = {};
    lastBpmUpdateRef.current = 0;
    lastFingerSeenAtRef.current = null;
    lastFrameTimestampRef.current = null;
    streamStartedAtRef.current = null;
    measurementActiveRef.current = false;
    measurementSamplesRef.current = [];
    publishedBpmRef.current = null;
    fingerPlacementRef.current = 'no_finger';
    signalReadPausedRef.current = false;
    liveBpmFilterRef.current.reset();
    beatSchedulerRef.current.reset();
    lastSignalGraphUpdateRef.current = 0;
    lastPublishedSignalTimestampRef.current = null;
    lastLiveProcessingTimestampRef.current = 0;
    offlineCaptureActive.value = false;
    managerRef.current.clearLiveSignalSamples();
  }, [offlineCaptureActive]);

  const start = useCallback(() => {
    if (activeRef.current) return;
    resetStreamState();
    activeRef.current = true;
    setActive(true);
    setCurrentBpm(null);
    setBeatTick(0);
    setLiveSignalSamples([]);
    fingerPlacementRef.current = 'no_finger';
    setFingerPlacement('no_finger');
  }, [resetStreamState]);

  const stop = useCallback(() => {
    activeRef.current = false;
    setActive(false);
    resetStreamState();
    setCurrentBpm(null);
    setLiveSignalSamples([]);
    fingerPlacementRef.current = 'no_finger';
    setFingerPlacement('no_finger');
  }, [resetStreamState]);

  const addSample = useRunOnJS(
    (frameSample: unknown) => {
      if (!activeRef.current) return;
      if (!isValidFrameSample(frameSample)) {
        return;
      }

      if (
        streamStartedAtRef.current == null ||
        frameSample.timestamp < streamStartedAtRef.current - 1_000
      ) {
        streamStartedAtRef.current = frameSample.timestamp;
      }
      lastFrameTimestampRef.current = frameSample.timestamp;

      const shouldThrottleProcessing = !measurementActiveRef.current;
      if (
        shouldThrottleProcessing &&
        frameSample.timestamp - lastLiveProcessingTimestampRef.current <
          LIVE_PROCESSING_INTERVAL_MS
      ) {
        return;
      }
      lastLiveProcessingTimestampRef.current = frameSample.timestamp;

      const qualityPlacement = updateFingerQuality(frameSample);
      const isMotionMoving = motionStateRef.current === 'moving';

      if (isMotionMoving) {
        lastFingerSeenAtRef.current =
          qualityPlacement === 'no_finger'
            ? lastFingerSeenAtRef.current
            : frameSample.timestamp;
        if (qualityPlacement !== fingerPlacementRef.current) {
          fingerPlacementRef.current = qualityPlacement;
          setFingerPlacement(qualityPlacement);
        }
        if (!signalReadPausedRef.current) {
          signalReadPausedRef.current = true;
          publishedBpmRef.current = null;
          lastPublishedSignalTimestampRef.current = null;
          liveBpmFilterRef.current.reset();
          beatSchedulerRef.current.reset();
          managerRef.current.clearLiveSignalSamples();
          setCurrentBpm(null);
          setLiveSignalSamples([]);
        }
        return;
      }

      signalReadPausedRef.current = false;

      if (measurementActiveRef.current) {
        measurementSamplesRef.current.push(frameSample);
      }

      const frameState = managerRef.current.processFrame(frameSample);
      const placement = frameState.fingerPlacement === 'too_much_pressure'
        ? 'too_much_pressure'
        : qualityPlacement;
      lastFingerSeenAtRef.current =
        placement === 'no_finger'
          ? lastFingerSeenAtRef.current
          : frameSample.timestamp;
      if (placement !== fingerPlacementRef.current) {
        fingerPlacementRef.current = placement;
        setFingerPlacement(placement);
      }

      const bpm = managerRef.current.getCurrentBpm();

      if (frameState.beatDetected && frameState.beatPeakTs != null) {
        beatSchedulerRef.current.schedule(frameState.beatPeakTs, frameSample.timestamp);
      }

      if (
        placement === 'good' &&
        bpm != null &&
        frameSample.timestamp - lastBpmUpdateRef.current >= BPM_UPDATE_INTERVAL_MS
      ) {
        lastBpmUpdateRef.current = frameSample.timestamp;
        const elapsedMs =
          streamStartedAtRef.current == null
            ? 0
            : frameSample.timestamp - streamStartedAtRef.current;
        const stabilizedBpm = liveBpmFilterRef.current.update({ elapsedMs, bpm });
        if (stabilizedBpm != null) {
          publishedBpmRef.current = stabilizedBpm;
          setCurrentBpm(stabilizedBpm);
        }
      }

      if (placement !== 'good') {
        publishedBpmRef.current = null;
        liveBpmFilterRef.current.reset();
        setCurrentBpm(null);
      }

      if (
        frameSample.timestamp - lastSignalGraphUpdateRef.current >=
        LIVE_SIGNAL_GRAPH_UPDATE_INTERVAL_MS
      ) {
        lastSignalGraphUpdateRef.current = frameSample.timestamp;
        const latestSignalTimestamp = managerRef.current.getLatestLiveSignalTimestamp();
        if (
          latestSignalTimestamp != null &&
          latestSignalTimestamp !== lastPublishedSignalTimestampRef.current
        ) {
          lastPublishedSignalTimestampRef.current = latestSignalTimestamp;
          setLiveSignalSamples(managerRef.current.getLiveSignalSamples());
        }
      }

      if (
        lastFingerSeenAtRef.current != null &&
        frameSample.timestamp - lastFingerSeenAtRef.current > FINGER_LOST_TIMEOUT_MS &&
        placement === 'lost'
      ) {
        publishedBpmRef.current = null;
        liveBpmFilterRef.current.reset();
        setCurrentBpm(null);
      }
    },
    [updateFingerQuality],
  );

  const beginMeasurementWindow = useCallback(() => {
    measurementSamplesRef.current = [];
    measurementActiveRef.current = true;
    offlineCaptureActive.value = true;
    lastBpmUpdateRef.current = 0;
    publishedBpmRef.current = null;
    streamStartedAtRef.current = lastFrameTimestampRef.current;
    liveBpmFilterRef.current.reset();
    beatSchedulerRef.current.reset();
    setCurrentBpm(null);
    setBeatTick(0);
    managerRef.current.beginMeasurementWindow(lastFrameTimestampRef.current ?? Date.now());
  }, [offlineCaptureActive]);

  const getMeasurementSamples = useCallback(() => {
    measurementActiveRef.current = false;
    offlineCaptureActive.value = false;
    return measurementSamplesRef.current.map((sample) => ({
      timestamp: sample.timestamp,
      rois: sample.rois.map((roi) => ({ ...roi })),
    }));
  }, [offlineCaptureActive]);

  const getIbiSamples = useCallback(() => managerRef.current.getIbiSamples(), []);

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      const targetFps = offlineCaptureActive.value ? OFFLINE_CAPTURE_FPS : LIVE_PROCESSING_FPS;
      runAtTargetFps(targetFps, () => {
        'worklet';
        const sample = heartRatePlugin(frame);
        if (sample != null) {
          addSample(sample);
        }
      });
    },
    [addSample, offlineCaptureActive],
  );

  return {
    active,
    start,
    stop,
    fingerPlacement,
    motionState: motion.state,
    currentBpm,
    beatTick,
    liveSignalSamples,
    device,
    format,
    frameProcessor,
    torchMode,
    hasPermission,
    requestPermission,
    beginMeasurementWindow,
    getMeasurementSamples,
    getIbiSamples,
  };
}
