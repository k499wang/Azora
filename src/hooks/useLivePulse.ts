import { useCallback, useRef, useState } from 'react';
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
import { createLiveBpmPresentationFilter } from '../lib/heartRate/bpmSmoothing';
import { LIVE_SIGNAL_GRAPH_UPDATE_INTERVAL_MS } from '../lib/heartRate/liveSignalGraphConfig';
import { useHeartRateCamera } from './useHeartRateCamera';

const BPM_UPDATE_INTERVAL_MS = 1000;
const FINGER_LOST_TIMEOUT_MS = 1500;
const OFFLINE_CAPTURE_FPS = 30;
const LIVE_PROCESSING_FPS = 20;
const LIVE_PROCESSING_INTERVAL_MS = 50;

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

export function useLivePulse(): UseLivePulseReturn {
  const [active, setActive] = useState(false);
  const [fingerPlacement, setFingerPlacement] = useState<FingerPlacementState>('no_finger');
  const [currentBpm, setCurrentBpm] = useState<number | null>(null);
  const [beatTick, setBeatTick] = useState(0);
  const [liveSignalSamples, setLiveSignalSamples] = useState<LivePpgSignalSample[]>([]);

  const activeRef = useRef(false);
  const managerRef = useRef(new HeartRateManager());
  const lastBpmUpdateRef = useRef(0);
  const lastFingerSeenAtRef = useRef<number | null>(null);
  const lastFrameTimestampRef = useRef<number | null>(null);
  const streamStartedAtRef = useRef<number | null>(null);
  const measurementActiveRef = useRef(false);
  const measurementSamplesRef = useRef<PpgFrameSample[]>([]);
  const publishedBpmRef = useRef<number | null>(null);
  const fingerPlacementRef = useRef<FingerPlacementState>('no_finger');
  const liveBpmFilterRef = useRef(createLiveBpmPresentationFilter());
  const lastSignalGraphUpdateRef = useRef<number>(0);
  const lastPublishedSignalTimestampRef = useRef<number | null>(null);
  const lastLiveProcessingTimestampRef = useRef<number>(0);
  const offlineCaptureActive = useSharedValue(false);

  const { device, format, hasPermission, requestPermission } = useHeartRateCamera();

  const torchMode: 'on' | 'off' =
    active && device?.hasTorch === true
      ? 'on'
      : 'off';

  const resetStreamState = useCallback(() => {
    managerRef.current.reset();
    lastBpmUpdateRef.current = 0;
    lastFingerSeenAtRef.current = null;
    lastFrameTimestampRef.current = null;
    streamStartedAtRef.current = null;
    measurementActiveRef.current = false;
    measurementSamplesRef.current = [];
    publishedBpmRef.current = null;
    fingerPlacementRef.current = 'no_finger';
    liveBpmFilterRef.current.reset();
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
      if (measurementActiveRef.current) {
        measurementSamplesRef.current.push(frameSample);
      }

      if (
        frameSample.timestamp - lastLiveProcessingTimestampRef.current <
        LIVE_PROCESSING_INTERVAL_MS
      ) {
        return;
      }
      lastLiveProcessingTimestampRef.current = frameSample.timestamp;

      const frameState = managerRef.current.processFrame(frameSample);
      lastFingerSeenAtRef.current =
        frameState.fingerPlacement === 'no_finger'
          ? lastFingerSeenAtRef.current
          : frameSample.timestamp;
      if (frameState.fingerPlacement !== fingerPlacementRef.current) {
        fingerPlacementRef.current = frameState.fingerPlacement;
        setFingerPlacement(frameState.fingerPlacement);
      }

      const bpm = managerRef.current.getCurrentBpm();

      if (frameState.beatDetected) {
        setBeatTick((tick) => tick + 1);
      }

      if (
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
        frameState.fingerPlacement === 'lost'
      ) {
        publishedBpmRef.current = null;
        liveBpmFilterRef.current.reset();
        setCurrentBpm(null);
      }
    },
    [],
  );

  const beginMeasurementWindow = useCallback(() => {
    measurementSamplesRef.current = [];
    measurementActiveRef.current = true;
    offlineCaptureActive.value = true;
    lastBpmUpdateRef.current = 0;
    publishedBpmRef.current = null;
    streamStartedAtRef.current = lastFrameTimestampRef.current;
    liveBpmFilterRef.current.reset();
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
