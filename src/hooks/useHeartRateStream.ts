import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useFrameProcessor,
  runAtTargetFps,
} from 'react-native-vision-camera';
import { useRunOnJS } from 'react-native-worklets-core';
import type {
  StreamState,
  PpgFrameSample,
  FingerPlacementState,
  HeartRateStreamSummary,
  LivePpgSignalSample,
} from '../lib/heartRate/types';
import { heartRatePlugin } from '../lib/heartRate/heartRatePlugin';
import { HeartRateManager } from '../lib/heartRate/heartRateManager';
import { createLiveBpmPresentationFilter } from '../lib/heartRate/bpmSmoothing';
import { createBeatTickScheduler } from '../lib/heartRate/beatTickScheduler';
import { LIVE_SIGNAL_GRAPH_UPDATE_INTERVAL_MS } from '../lib/heartRate/liveSignalGraphConfig';
import {
  classifyFingerPlacementStateless,
  type FingerPlacementClassifyState,
} from '../lib/heartRate/fingerQuality';
import type { MotionStabilityState } from '../lib/heartRate/motionStability';
import { useHeartRateCamera } from './useHeartRateCamera';
import { useHeartRateMotionStability } from './useHeartRateMotionStability';

const ROLLING_WINDOW_MS = 15000;
const BPM_UPDATE_INTERVAL_MS = 1000;
const FINGER_LOST_TIMEOUT_MS = 30000;
const WARMUP_DURATION_MS = 5000;
const FRAME_PROCESSING_FPS = 20;
const FINGER_QUALITY_WINDOW_MS = 1000;

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

interface UseHeartRateStreamReturn {
  streamState: StreamState;
  fingerPlacement: FingerPlacementState;
  motionState: MotionStabilityState;
  currentBpm: number | null;
  beatTick: number;
  bpmHistory: number[];
  liveSignalSamples: LivePpgSignalSample[];
  sessionSummary: HeartRateStreamSummary | null;
  device: ReturnType<typeof useHeartRateCamera>['device'];
  format: ReturnType<typeof useHeartRateCamera>['format'];
  frameProcessor: ReturnType<typeof useFrameProcessor>;
  torchMode: 'on' | 'off';
  startStream: () => void;
  startStreaming: () => void;
  stopStream: () => void;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

export function useHeartRateStream(): UseHeartRateStreamReturn {
  const [streamState, setStreamState] = useState<StreamState>('idle');
  const [fingerPlacement, setFingerPlacement] = useState<FingerPlacementState>('no_finger');
  const [currentBpm, setCurrentBpm] = useState<number | null>(null);
  const [beatTick, setBeatTick] = useState(0);
  const [bpmHistory, setBpmHistory] = useState<number[]>([]);
  const [liveSignalSamples, setLiveSignalSamples] = useState<LivePpgSignalSample[]>([]);
  const [sessionSummary, setSessionSummary] = useState<HeartRateStreamSummary | null>(null);
  const motion = useHeartRateMotionStability(streamState !== 'idle' && streamState !== 'stopped');

  const bufferRef = useRef<PpgFrameSample[]>([]);
  const fingerQualitySamplesRef = useRef<PpgFrameSample[]>([]);
  const fingerQualityStateRef = useRef<FingerPlacementClassifyState>({});
  const streamStartRef = useRef<number | null>(null);
  const lastBpmUpdateRef = useRef<number>(0);
  const lastSignalGraphUpdateRef = useRef<number>(0);
  const lastPublishedSignalTimestampRef = useRef<number | null>(null);
  const liveBpmStartedAtRef = useRef<number | null>(null);
  const fingerLostSinceRef = useRef<number | null>(null);
  const goodSinceRef = useRef<number | null>(null);
  const warmupStartRef = useRef<number | null>(null);
  const bpmHistoryRef = useRef<number[]>([]);
  const publishedBpmRef = useRef<number | null>(null);
  const fingerPlacementRef = useRef<FingerPlacementState>('no_finger');
  const signalReadPausedRef = useRef(false);
  const motionStateRef = useRef<MotionStabilityState>('stable');
  const streamStateRef = useRef<StreamState>('idle');
  const managerRef = useRef(new HeartRateManager());
  const liveBpmFilterRef = useRef(createLiveBpmPresentationFilter());
  const beatSchedulerRef = useRef(
    createBeatTickScheduler({ onBeat: () => setBeatTick((tick) => tick + 1) }),
  );

  const { device, format, hasPermission, requestPermission } = useHeartRateCamera();

  const needsIllumination = streamState !== 'idle' && streamState !== 'stopped';
  const torchMode: 'on' | 'off' =
    needsIllumination && device?.hasTorch === true
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

  const startStreaming = useCallback((startTimestamp?: number) => {
    warmupStartRef.current = startTimestamp ?? null;
    goodSinceRef.current = null;
    lastSignalGraphUpdateRef.current = 0;
    lastPublishedSignalTimestampRef.current = null;
    managerRef.current.clearLiveSignalSamples();
    setLiveSignalSamples([]);
    setStreamState('warming_up');
    streamStateRef.current = 'warming_up';
  }, []);

  const finishStream = useCallback(() => {
    const history = bpmHistoryRef.current;
    const startTs = streamStartRef.current ?? Date.now();
    const durationMs = Date.now() - startTs;

    if (history.length > 0) {
      const avgBpm = Math.round(history.reduce((s, b) => s + b, 0) / history.length);
      const minBpm = Math.min(...history);
      const maxBpm = Math.max(...history);
      setSessionSummary({
        avgBpm,
        minBpm,
        maxBpm,
        readings: [...history],
        durationMs,
        recordedAt: new Date().toISOString(),
      });
    }

    bufferRef.current = [];
    streamStartRef.current = null;
    lastBpmUpdateRef.current = 0;
    lastSignalGraphUpdateRef.current = 0;
    lastPublishedSignalTimestampRef.current = null;
    liveBpmStartedAtRef.current = null;
    fingerLostSinceRef.current = null;
    goodSinceRef.current = null;
    warmupStartRef.current = null;
    fingerQualitySamplesRef.current = [];
    fingerQualityStateRef.current = {};
    bpmHistoryRef.current = [];
    publishedBpmRef.current = null;
    fingerPlacementRef.current = 'no_finger';
    signalReadPausedRef.current = false;
    liveBpmFilterRef.current.reset();
    managerRef.current.reset();
    beatSchedulerRef.current.reset();

    setStreamState('stopped');
    setLiveSignalSamples([]);
    streamStateRef.current = 'stopped';
  }, []);

  const addSample = useRunOnJS(
    (frameSample: unknown) => {
      if (!isValidFrameSample(frameSample)) {
        return;
      }

      const timestamp = frameSample.timestamp;
      const state = streamStateRef.current;
      if (state === 'idle' || state === 'stopped') return;

      const qualityPlacement = updateFingerQuality(frameSample);
      const isMotionMoving = motionStateRef.current === 'moving';

      if (isMotionMoving) {
        if (qualityPlacement !== fingerPlacementRef.current) {
          fingerPlacementRef.current = qualityPlacement;
          setFingerPlacement(qualityPlacement);
        }
        goodSinceRef.current = null;
        if (!signalReadPausedRef.current) {
          signalReadPausedRef.current = true;
          publishedBpmRef.current = null;
          liveBpmStartedAtRef.current = null;
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

      bufferRef.current.push(frameSample);
      const cutoff60 = timestamp - 60000;
      bufferRef.current = bufferRef.current.filter((s) => s.timestamp >= cutoff60);

      const frameState = managerRef.current.processFrame(frameSample);
      const placement = frameState.fingerPlacement === 'too_much_pressure'
        ? 'too_much_pressure'
        : qualityPlacement;

      if (placement !== fingerPlacementRef.current) {
        fingerPlacementRef.current = placement;
        setFingerPlacement(placement);
      }

      if (state === 'camera_check') {
        if (placement === 'good' && motionStateRef.current === 'stable') {
          if (goodSinceRef.current == null) {
            goodSinceRef.current = timestamp;
          } else if (timestamp - goodSinceRef.current >= 1500) {
            startStreaming(timestamp);
          }
        } else {
          goodSinceRef.current = null;
        }
        return;
      }

      if (state === 'warming_up') {
        if (warmupStartRef.current == null) {
          warmupStartRef.current = timestamp;
        }
        if (warmupStartRef.current != null && timestamp - warmupStartRef.current >= WARMUP_DURATION_MS) {
          setStreamState('streaming');
          streamStateRef.current = 'streaming';
        }
      }

      if (state === 'streaming' || state === 'warming_up' || state === 'finger_lost') {
        if (placement === 'lost' || (placement !== 'good' && placement !== 'partial')) {
          if (state !== 'finger_lost') {
            fingerLostSinceRef.current = timestamp;
            publishedBpmRef.current = null;
            liveBpmStartedAtRef.current = null;
            liveBpmFilterRef.current.reset();
            setCurrentBpm(null);
            setStreamState('finger_lost');
            streamStateRef.current = 'finger_lost';
          } else if (fingerLostSinceRef.current != null && timestamp - fingerLostSinceRef.current > FINGER_LOST_TIMEOUT_MS) {
            finishStream();
          }
        } else if (state === 'finger_lost') {
          fingerLostSinceRef.current = null;
          setStreamState('streaming');
          streamStateRef.current = 'streaming';
        }
      }

      if (
        (state === 'streaming' || state === 'warming_up') &&
        frameState.beatDetected &&
        frameState.beatPeakTs != null
      ) {
        beatSchedulerRef.current.schedule(frameState.beatPeakTs, timestamp);
      }

      if (
        (state === 'streaming' || state === 'warming_up') &&
        timestamp - lastSignalGraphUpdateRef.current >= LIVE_SIGNAL_GRAPH_UPDATE_INTERVAL_MS
      ) {
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

      if (placement !== 'good') {
        if (publishedBpmRef.current != null) {
          publishedBpmRef.current = null;
          setCurrentBpm(null);
        }
        liveBpmStartedAtRef.current = null;
        liveBpmFilterRef.current.reset();
        return;
      }

      if ((state === 'streaming' || state === 'warming_up') && timestamp - lastBpmUpdateRef.current >= BPM_UPDATE_INTERVAL_MS) {
        lastBpmUpdateRef.current = timestamp;
        const bpm = managerRef.current.getCurrentBpm();
        if (bpm != null) {
          if (liveBpmStartedAtRef.current == null) {
            liveBpmStartedAtRef.current = timestamp;
          }
          const elapsedMs =
            liveBpmStartedAtRef.current == null
              ? 0
              : timestamp - liveBpmStartedAtRef.current;
          const stabilizedBpm = liveBpmFilterRef.current.update({ elapsedMs, bpm });
          if (stabilizedBpm == null) return;
          publishedBpmRef.current = stabilizedBpm;
          setCurrentBpm(stabilizedBpm);
          if (state === 'streaming') {
            setBpmHistory((history) => {
              const next = [...history, stabilizedBpm].slice(-15);
              bpmHistoryRef.current = next;
              return next;
            });
          }
        }
      }
    },
    [finishStream, startStreaming, updateFingerQuality],
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

  const startStream = useCallback(() => {
    bufferRef.current = [];
    streamStartRef.current = Date.now();
    lastBpmUpdateRef.current = 0;
    lastSignalGraphUpdateRef.current = 0;
    lastPublishedSignalTimestampRef.current = null;
    liveBpmStartedAtRef.current = null;
    fingerLostSinceRef.current = null;
    goodSinceRef.current = null;
    warmupStartRef.current = null;
    fingerPlacementRef.current = 'no_finger';
    signalReadPausedRef.current = false;
    fingerQualitySamplesRef.current = [];
    fingerQualityStateRef.current = {};
    managerRef.current.reset();
    beatSchedulerRef.current.reset();

    setCurrentBpm(null);
    setBeatTick(0);
    bpmHistoryRef.current = [];
    publishedBpmRef.current = null;
    liveBpmFilterRef.current.reset();
    setBpmHistory([]);
    setLiveSignalSamples([]);
    setSessionSummary(null);
    setFingerPlacement('no_finger');
    setStreamState('camera_check');
    streamStateRef.current = 'camera_check';
  }, []);

  const stopStream = useCallback(() => {
    finishStream();
  }, [finishStream]);

  return {
    streamState,
    fingerPlacement,
    motionState: motion.state,
    currentBpm,
    beatTick,
    bpmHistory,
    liveSignalSamples,
    sessionSummary,
    device,
    format,
    frameProcessor,
    torchMode,
    startStream,
    startStreaming,
    stopStream,
    hasPermission,
    requestPermission,
  };
}
