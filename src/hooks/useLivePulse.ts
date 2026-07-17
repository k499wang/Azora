import { useCallback, useRef, useState } from 'react';
import {
  runAtTargetFps,
  useFrameProcessor,
} from 'react-native-vision-camera';
import { useRunOnJS } from 'react-native-worklets-core';
import type {
  FingerPlacementState,
  IbiSample,
  LivePpgSignalSample,
  PpgFrameSample,
  SignalStatus,
} from '../lib/heartRate/types';
import { heartRatePlugin } from '../lib/heartRate/heartRatePlugin';
import { HeartRateManager } from '../lib/heartRate/heartRateManager';
import {
  EXERCISE_BPM_MIN_SIGNAL_QUALITY,
  createBreathExerciseBpmPresentationFilter,
  createLiveBpmPresentationFilter,
  isExerciseBpmSnapshotReady,
} from '../lib/heartRate/bpmSmoothing';
import { createBeatTickScheduler } from '../lib/heartRate/beatTickScheduler';
import { createSessionBpmSampler } from '../lib/heartRate/sessionBpmSampler';
import { recordDevFrame } from '../services/dev/heartRateFrameRecorder';
import { LIVE_SIGNAL_GRAPH_UPDATE_INTERVAL_MS } from '../lib/heartRate/liveSignalGraphConfig';
import { useHeartRateCamera } from './useHeartRateCamera';
import { useDeviceMotionFeed } from './useDeviceMotionFeed';

const BPM_UPDATE_INTERVAL_MS = 1000;
const FINGER_LOST_TIMEOUT_MS = 1500;
const HEART_RATE_PROCESSING_FPS = 30;

export interface LivePulseBpmSample {
  offsetMs: number;
  bpm: number;
  signalQuality: number | null;
}

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
  restartCalibration: () => void;
  stop: () => void;
  fingerPlacement: FingerPlacementState;
  signalStatus: SignalStatus;
  currentBpm: number | null;
  isBpmReady: boolean;
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
  beginBpmSampleCollection: () => void;
  getBpmSamples: () => LivePulseBpmSample[];
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
  const [signalStatus, setSignalStatus] = useState<SignalStatus>('no_finger');
  const [currentBpm, setCurrentBpm] = useState<number | null>(null);
  const [isBpmReady, setIsBpmReady] = useState(false);
  const [beatTick, setBeatTick] = useState(0);
  const [liveSignalSamples, setLiveSignalSamples] = useState<LivePpgSignalSample[]>([]);

  const activeRef = useRef(false);
  const managerRef = useRef(new HeartRateManager({
    liveBpmProfile: presentationMode === 'breathExercise' ? 'responsive' : 'stable',
  }));
  const lastBpmUpdateRef = useRef(0);
  const lastFingerSeenAtRef = useRef<number | null>(null);
  const lastFrameTimestampRef = useRef<number | null>(null);
  const streamStartedAtRef = useRef<number | null>(null);
  const measurementActiveRef = useRef(false);
  const measurementSamplesRef = useRef<PpgFrameSample[]>([]);
  const publishedBpmRef = useRef<number | null>(null);
  const fingerPlacementRef = useRef<FingerPlacementState>('no_finger');
  const signalStatusRef = useRef<SignalStatus>('no_finger');
  const liveBpmFilterRef = useRef(createLivePulseBpmFilter(presentationMode));
  const beatSchedulerRef = useRef(
    createBeatTickScheduler({ onBeat: () => setBeatTick((tick) => tick + 1) }),
  );
  const lastSignalGraphUpdateRef = useRef<number>(0);
  const lastPublishedSignalTimestampRef = useRef<number | null>(null);
  const sessionBpmSamplerRef = useRef(createSessionBpmSampler());
  const bpmReadyRef = useRef(false);

  const { device, format, hasPermission, requestPermission } = useHeartRateCamera();

  useDeviceMotionFeed(managerRef);

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
    signalStatusRef.current = 'no_finger';
    liveBpmFilterRef.current.reset();
    beatSchedulerRef.current.reset();
    lastSignalGraphUpdateRef.current = 0;
    lastPublishedSignalTimestampRef.current = null;
    sessionBpmSamplerRef.current.reset();
    bpmReadyRef.current = false;
    managerRef.current.clearLiveSignalSamples();
  }, []);

  const start = useCallback(() => {
    if (activeRef.current) return;
    resetStreamState();
    activeRef.current = true;
    setActive(true);
    setCurrentBpm(null);
    setIsBpmReady(false);
    setBeatTick(0);
    setLiveSignalSamples([]);
    fingerPlacementRef.current = 'no_finger';
    setFingerPlacement('no_finger');
    signalStatusRef.current = 'no_finger';
    setSignalStatus('no_finger');
  }, [resetStreamState]);

  const stop = useCallback(() => {
    activeRef.current = false;
    setActive(false);
    resetStreamState();
    setCurrentBpm(null);
    setIsBpmReady(false);
    setLiveSignalSamples([]);
    fingerPlacementRef.current = 'no_finger';
    setFingerPlacement('no_finger');
    signalStatusRef.current = 'no_finger';
    setSignalStatus('no_finger');
  }, [resetStreamState]);

  // Keep the camera mounted while throwing away the current calibration. This
  // lets placement failures restart the calibration tier without restarting
  // the surrounding breathing flow or toggling the preview.
  const restartCalibration = useCallback(() => {
    if (!activeRef.current) return;
    resetStreamState();
    setCurrentBpm(null);
    setIsBpmReady(false);
    setLiveSignalSamples([]);
    fingerPlacementRef.current = 'no_finger';
    setFingerPlacement('no_finger');
    signalStatusRef.current = 'no_finger';
    setSignalStatus('no_finger');
  }, [resetStreamState]);

  const addSample = useRunOnJS(
    (frameSample: unknown) => {
      if (!activeRef.current) return;
      if (!isValidFrameSample(frameSample)) {
        return;
      }
      if (__DEV__) recordDevFrame(frameSample);

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

      const frameState = managerRef.current.processFrame(frameSample);
      lastFingerSeenAtRef.current =
        frameState.fingerPlacement === 'no_finger' ||
        frameState.fingerPlacement === 'lost'
          ? lastFingerSeenAtRef.current
          : frameSample.timestamp;
      if (frameState.fingerPlacement !== fingerPlacementRef.current) {
        fingerPlacementRef.current = frameState.fingerPlacement;
        setFingerPlacement(frameState.fingerPlacement);
      }
      if (frameState.signalStatus !== signalStatusRef.current) {
        signalStatusRef.current = frameState.signalStatus;
        setSignalStatus(frameState.signalStatus);
      }

      const managerBpmSnapshot = managerRef.current.getCurrentBpmSnapshot();
      const isEligibleExerciseStartupSnapshot =
        presentationMode === 'breathExercise' &&
        managerBpmSnapshot != null &&
        frameState.fingerPlacement === 'good' &&
        frameState.signalStatus === 'measuring' &&
        isExerciseBpmSnapshotReady(managerBpmSnapshot);

      const bpmSnapshot =
        presentationMode === 'breathExercise' && !bpmReadyRef.current
          ? isEligibleExerciseStartupSnapshot
            ? managerBpmSnapshot
            : null
          : managerBpmSnapshot;
      const bpm = bpmSnapshot?.bpm ?? null;

      if (frameState.beatDetected && frameState.beatPeakTs != null) {
        beatSchedulerRef.current.schedule(frameState.beatPeakTs, frameSample.timestamp);
      }

      const hasFreshExerciseEstimate =
        presentationMode === 'breathExercise' &&
        bpmSnapshot != null &&
        bpmSnapshot.timestamp > lastBpmUpdateRef.current;
      const shouldPublishBpm = presentationMode === 'breathExercise'
        ? hasFreshExerciseEstimate
        : frameSample.timestamp - lastBpmUpdateRef.current >= BPM_UPDATE_INTERVAL_MS;

      if (bpm != null && shouldPublishBpm) {
        lastBpmUpdateRef.current = frameSample.timestamp;
        const elapsedMs =
          streamStartedAtRef.current == null
            ? 0
            : frameSample.timestamp - streamStartedAtRef.current;
        const stabilizedBpm = liveBpmFilterRef.current.update({ elapsedMs, bpm });
        if (stabilizedBpm != null) {
          publishedBpmRef.current = stabilizedBpm;
          setCurrentBpm(stabilizedBpm);
          if (
            presentationMode === 'breathExercise' &&
            !bpmReadyRef.current
          ) {
            // Only expose readiness once the presentation filter has observed
            // enough consistent manager estimates to choose a trustworthy
            // first number. Until then it returns null and the UI keeps finding
            // the pulse rather than anchoring to a settling artifact.
            bpmReadyRef.current = true;
            setIsBpmReady(true);
          }
        }

      }

      const sampleReadingEligible =
        frameState.fingerPlacement === 'good' &&
        frameState.signalStatus === 'measuring' &&
        managerBpmSnapshot != null &&
        managerBpmSnapshot.signalQuality >= EXERCISE_BPM_MIN_SIGNAL_QUALITY &&
        publishedBpmRef.current != null;
      sessionBpmSamplerRef.current.observe(
        frameSample.timestamp,
        sampleReadingEligible
          ? {
              bpm: publishedBpmRef.current!,
              signalQuality: managerBpmSnapshot!.signalQuality,
            }
          : null,
      );

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
        bpmReadyRef.current = false;
        setIsBpmReady(false);
      }
    },
    [presentationMode],
  );

  const beginMeasurementWindow = useCallback(() => {
    measurementSamplesRef.current = [];
    measurementActiveRef.current = true;
    lastBpmUpdateRef.current = 0;
    streamStartedAtRef.current = lastFrameTimestampRef.current;
    // The displayed BPM and its presentation filter deliberately survive this
    // boundary: the manager restarts its measurement fresh, but the shown
    // number glides from its current value to the new reading instead of
    // blanking and re-seeding with a visible jump.
    beatSchedulerRef.current.reset();
    setBeatTick(0);
    managerRef.current.beginMeasurementWindow(lastFrameTimestampRef.current ?? Date.now());
  }, []);

  const getMeasurementSamples = useCallback(() => {
    measurementActiveRef.current = false;
    return measurementSamplesRef.current.map((sample) => ({
      timestamp: sample.timestamp,
      rois: sample.rois.map((roi) => ({ ...roi })),
    }));
  }, []);

  const getIbiSamples = useCallback(() => managerRef.current.getIbiSamples(), []);

  const beginBpmSampleCollection = useCallback(() => {
    const lockedSnapshot = managerRef.current.getCurrentBpmSnapshot();
    const canSeedLockedBaseline =
      bpmReadyRef.current &&
      fingerPlacementRef.current === 'good' &&
      signalStatusRef.current === 'measuring' &&
      lockedSnapshot != null &&
      lockedSnapshot.signalQuality >= EXERCISE_BPM_MIN_SIGNAL_QUALITY &&
      publishedBpmRef.current != null;

    sessionBpmSamplerRef.current.start(
      lastFrameTimestampRef.current ?? Number.NaN,
      canSeedLockedBaseline
        ? {
            bpm: publishedBpmRef.current!,
            signalQuality: lockedSnapshot!.signalQuality,
          }
        : null,
    );
  }, []);

  const getBpmSamples = useCallback(() => {
    return sessionBpmSamplerRef.current.finish();
  }, []);

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      runAtTargetFps(HEART_RATE_PROCESSING_FPS, () => {
        'worklet';
        const sample = heartRatePlugin(frame);
        if (sample != null) {
          addSample(sample);
        }
      });
    },
    [addSample],
  );

  return {
    active,
    start,
    restartCalibration,
    stop,
    fingerPlacement,
    signalStatus,
    currentBpm,
    isBpmReady,
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
    beginBpmSampleCollection,
    getBpmSamples,
  };
}
