import { useCallback, useRef, useState, useEffect } from 'react';
import {
  useFrameProcessor,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
} from 'react-native-vision-camera';
import { useRunOnJS } from 'react-native-worklets-core';
import type {
  StreamState,
  PpgFrameSample,
  FingerPlacementState,
  HeartRateStreamSummary,
} from '../lib/heartRate/types';
import { heartRatePlugin } from '../lib/heartRate/heartRatePlugin';
import { classifyFingerPlacementStateless } from '../lib/heartRate/fingerQuality';
import { computeRollingBPMComparison } from '../lib/heartRate/rollingWindow';
import {
  detectLatestBeat,
  PREVIEW_BPM_OPTIONS,
  type BeatSignal,
} from '../lib/heartRate/signalProcessing';
import { logHeartRateComparison } from '../lib/heartRate/debug';
import {
  scheduledBeatIntervalMs,
  shouldEmitScheduledBeat,
  shouldEmitVisualBeat,
} from '../lib/heartRate/beatGate';

const ROLLING_WINDOW_MS = 15000;
const BPM_UPDATE_INTERVAL_MS = 1000;
const FINGER_LOST_TIMEOUT_MS = 30000;
const FINGER_CLASSIFY_WINDOW_MS = 1000;
const ROLLING_CLASSIFY_WINDOW_MS = 2000;
const WARMUP_DURATION_MS = 5000;
const BEAT_DETECTION_INTERVAL_MS = 80;
const VISUAL_BEAT_SCHEDULER_INTERVAL_MS = 80;
const RAW_BEAT_PHASE_LOCK_FRACTION = 0.75;

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
  currentBpm: number | null;
  beatTick: number;
  bpmHistory: number[];
  sessionSummary: HeartRateStreamSummary | null;
  device: ReturnType<typeof useCameraDevice>;
  format: ReturnType<typeof useCameraFormat>;
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
  const [sessionSummary, setSessionSummary] = useState<HeartRateStreamSummary | null>(null);

  const bufferRef = useRef<PpgFrameSample[]>([]);
  const streamStartRef = useRef<number | null>(null);
  const lastBpmUpdateRef = useRef<number>(0);
  const lastBeatCheckTimestampRef = useRef<number>(0);
  const lastVisualBeatTimestampRef = useRef<number | null>(null);
  const lastVisualBeatWallClockRef = useRef<number | null>(null);
  const preferredBeatSignalRef = useRef<BeatSignal | null>(null);
  const fingerLostSinceRef = useRef<number | null>(null);
  const goodSinceRef = useRef<number | null>(null);
  const warmupStartRef = useRef<number | null>(null);
  const fingerPlacementRef = useRef<FingerPlacementState>('no_finger');
  const streamStateRef = useRef<StreamState>('idle');
  const fingerClassifyStateRef = useRef<{
    previousState?: FingerPlacementState;
    goodSinceMs?: number;
  }>({});
  const bpmHistoryRef = useRef<number[]>([]);

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back', {
    physicalDevices: ['wide-angle-camera'],
  });
  const format = useCameraFormat(device, [
    { fps: 30 },
    { videoResolution: { width: 640, height: 480 } },
  ]);

  useEffect(() => {
    streamStateRef.current = streamState;
  }, [streamState]);

  const torchMode: 'on' | 'off' =
    streamState !== 'idle' && streamState !== 'stopped' ? 'on' : 'off';

  useEffect(() => {
    const timer = setInterval(() => {
      const state = streamStateRef.current;
      if (state !== 'streaming' && state !== 'warming_up') return;
      if (fingerPlacementRef.current !== 'good' && fingerPlacementRef.current !== 'partial') {
        return;
      }

      const latestBpm = bpmHistoryRef.current[bpmHistoryRef.current.length - 1] ?? null;
      const nowMs = Date.now();
      if (!shouldEmitScheduledBeat(nowMs, lastVisualBeatWallClockRef.current, latestBpm)) return;

      lastVisualBeatWallClockRef.current = nowMs;
      const latestSample = bufferRef.current[bufferRef.current.length - 1];
      if (latestSample != null) {
        lastVisualBeatTimestampRef.current = latestSample.timestamp;
      }
      setBeatTick((tick) => tick + 1);
    }, VISUAL_BEAT_SCHEDULER_INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);

  const startStreaming = useCallback((startTimestamp?: number) => {
    warmupStartRef.current = startTimestamp ?? null;
    goodSinceRef.current = null;
    setStreamState('warming_up');
    streamStateRef.current = 'warming_up';
  }, []);

  const _finishStream = useCallback(() => {
    const history = bpmHistoryRef.current;
    const startTs = streamStartRef.current ?? Date.now();
    const durationMs = Date.now() - startTs;

    if (history.length > 0) {
      const avgBpm = Math.round(history.reduce((s, b) => s + b, 0) / history.length);
      const minBpm = Math.min(...history);
      const maxBpm = Math.max(...history);
      const summary: HeartRateStreamSummary = {
        avgBpm,
        minBpm,
        maxBpm,
        readings: [...history],
        durationMs,
        recordedAt: new Date().toISOString(),
      };
      setSessionSummary(summary);
    }

    bufferRef.current = [];
    bpmHistoryRef.current = [];
    streamStartRef.current = null;
    lastBpmUpdateRef.current = 0;
    lastBeatCheckTimestampRef.current = 0;
    lastVisualBeatTimestampRef.current = null;
    lastVisualBeatWallClockRef.current = null;
    preferredBeatSignalRef.current = null;
    fingerLostSinceRef.current = null;
    goodSinceRef.current = null;
    warmupStartRef.current = null;
    fingerPlacementRef.current = 'no_finger';
    fingerClassifyStateRef.current = {};

    setStreamState('stopped');
    streamStateRef.current = 'stopped';
  }, []);

  const addSample = useRunOnJS(
    (frameSample: unknown) => {
      if (!isValidFrameSample(frameSample)) {
        bufferRef.current = [];
        goodSinceRef.current = null;
        fingerLostSinceRef.current = null;
        fingerClassifyStateRef.current = {};
        fingerPlacementRef.current = 'no_finger';
        lastVisualBeatTimestampRef.current = null;
        lastVisualBeatWallClockRef.current = null;
        preferredBeatSignalRef.current = null;
        setCurrentBpm(null);
        setFingerPlacement('no_finger');
        return;
      }

      const timestamp = frameSample.timestamp;
      const state = streamStateRef.current;
      if (state === 'idle' || state === 'stopped') return;

      bufferRef.current.push(frameSample);

      // Keep buffer from growing unbounded — keep last 60s
      const cutoff60 = timestamp - 60000;
      bufferRef.current = bufferRef.current.filter((s) => s.timestamp >= cutoff60);

      // Classify finger placement
      const recentCutoff = timestamp - ROLLING_CLASSIFY_WINDOW_MS;
      const recentSamples = bufferRef.current.filter((s) => s.timestamp >= recentCutoff);
      const { placement, state: newClassifyState } = classifyFingerPlacementStateless(
        recentSamples,
        FINGER_CLASSIFY_WINDOW_MS,
        fingerClassifyStateRef.current,
      );
      fingerClassifyStateRef.current = newClassifyState;
      if (placement !== fingerPlacementRef.current) {
        fingerPlacementRef.current = placement;
        setFingerPlacement(placement);
      }

      if (state === 'camera_check') {
        if (placement === 'good') {
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
        if (warmupStartRef.current != null) {
          if (timestamp - warmupStartRef.current >= WARMUP_DURATION_MS) {
            setStreamState('streaming');
            streamStateRef.current = 'streaming';
          }
        }
      }

      // Handle finger lost/restored during streaming or warming_up
      if (state === 'streaming' || state === 'warming_up' || state === 'finger_lost') {
        if (placement === 'lost' || (placement !== 'good' && placement !== 'partial')) {
          if (state !== 'finger_lost') {
            fingerLostSinceRef.current = timestamp;
            lastVisualBeatTimestampRef.current = null;
            lastVisualBeatWallClockRef.current = null;
            preferredBeatSignalRef.current = null;
            setCurrentBpm(null);
            setStreamState('finger_lost');
            streamStateRef.current = 'finger_lost';
          } else if (fingerLostSinceRef.current != null) {
            const lostDuration = timestamp - fingerLostSinceRef.current;
            if (lostDuration > FINGER_LOST_TIMEOUT_MS) {
              _finishStream();
            }
          }
        } else if (state === 'finger_lost') {
          fingerLostSinceRef.current = null;
          lastVisualBeatTimestampRef.current = null;
          lastVisualBeatWallClockRef.current = null;
          preferredBeatSignalRef.current = null;
          setStreamState('streaming');
          streamStateRef.current = 'streaming';
        }
      }

      if (
        (state === 'streaming' || state === 'warming_up') &&
        (placement === 'good' || placement === 'partial') &&
        timestamp - lastBeatCheckTimestampRef.current >= BEAT_DETECTION_INTERVAL_MS
      ) {
        lastBeatCheckTimestampRef.current = timestamp;
        const beat = detectLatestBeat(bufferRef.current, {
          previousBeatTimestamp: lastVisualBeatTimestampRef.current,
          preferredSignal: preferredBeatSignalRef.current,
        });
        if (beat != null) {
          const latestBpm = bpmHistoryRef.current[bpmHistoryRef.current.length - 1] ?? null;
          const nowMs = Date.now();
          const lastVisualBeatMs = lastVisualBeatWallClockRef.current;
          const canPhaseLock =
            latestBpm == null ||
            lastVisualBeatMs == null ||
            nowMs - lastVisualBeatMs >=
              scheduledBeatIntervalMs(latestBpm) * RAW_BEAT_PHASE_LOCK_FRACTION;

          if (
            canPhaseLock &&
            shouldEmitVisualBeat(
              beat.timestamp,
              lastVisualBeatTimestampRef.current,
              latestBpm,
            )
          ) {
            lastVisualBeatTimestampRef.current = beat.timestamp;
            lastVisualBeatWallClockRef.current = nowMs;
            setBeatTick((tick) => tick + 1);
          }
        }
      }

      // Rolling BPM update every second
      if (
        (state === 'streaming' || state === 'warming_up') &&
        timestamp - lastBpmUpdateRef.current >= BPM_UPDATE_INTERVAL_MS
      ) {
        lastBpmUpdateRef.current = timestamp;
        const bpmComparison = computeRollingBPMComparison(
          bufferRef.current,
          ROLLING_WINDOW_MS,
          PREVIEW_BPM_OPTIONS,
        );
        logHeartRateComparison('stream', bpmComparison);
        const bpmResult = bpmComparison.consensus;
        if (bpmResult != null) {
          preferredBeatSignalRef.current = {
            roiId: bpmResult.roiId,
            channel: bpmResult.channel,
          };
          setCurrentBpm(bpmResult.bpm);
          bpmHistoryRef.current = [...bpmHistoryRef.current, bpmResult.bpm];
          setBpmHistory([...bpmHistoryRef.current]);
        }
      }
    },
    [_finishStream, startStreaming],
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

  const startStream = useCallback(() => {
    bufferRef.current = [];
    bpmHistoryRef.current = [];
    streamStartRef.current = Date.now();
    lastBpmUpdateRef.current = 0;
    lastBeatCheckTimestampRef.current = 0;
    lastVisualBeatTimestampRef.current = null;
    lastVisualBeatWallClockRef.current = null;
    preferredBeatSignalRef.current = null;
    fingerLostSinceRef.current = null;
    goodSinceRef.current = null;
    warmupStartRef.current = null;
    fingerPlacementRef.current = 'no_finger';
    fingerClassifyStateRef.current = {};

    setCurrentBpm(null);
    setBeatTick(0);
    setBpmHistory([]);
    setSessionSummary(null);
    fingerPlacementRef.current = 'no_finger';
    setFingerPlacement('no_finger');
    setStreamState('camera_check');
    streamStateRef.current = 'camera_check';
  }, []);

  const stopStream = useCallback(() => {
    _finishStream();
  }, [_finishStream]);

  return {
    streamState,
    fingerPlacement,
    currentBpm,
    beatTick,
    bpmHistory,
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
