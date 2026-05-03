import { useCallback, useRef, useState } from 'react';
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
} from '../lib/heartRate/types';
import { heartRatePlugin } from '../lib/heartRate/heartRatePlugin';
import { HeartRateManager } from '../lib/heartRate/heartRateManager';
import { stabilizeBpmUpdate } from '../lib/heartRate/bpmSmoothing';
import { useHeartRateCamera } from './useHeartRateCamera';

const ROLLING_WINDOW_MS = 15000;
const BPM_UPDATE_INTERVAL_MS = 1000;
const FINGER_LOST_TIMEOUT_MS = 30000;
const WARMUP_DURATION_MS = 5000;
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

interface UseHeartRateStreamReturn {
  streamState: StreamState;
  fingerPlacement: FingerPlacementState;
  currentBpm: number | null;
  beatTick: number;
  bpmHistory: number[];
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
  const [sessionSummary, setSessionSummary] = useState<HeartRateStreamSummary | null>(null);

  const bufferRef = useRef<PpgFrameSample[]>([]);
  const streamStartRef = useRef<number | null>(null);
  const lastBpmUpdateRef = useRef<number>(0);
  const fingerLostSinceRef = useRef<number | null>(null);
  const goodSinceRef = useRef<number | null>(null);
  const warmupStartRef = useRef<number | null>(null);
  const bpmHistoryRef = useRef<number[]>([]);
  const publishedBpmRef = useRef<number | null>(null);
  const fingerPlacementRef = useRef<FingerPlacementState>('no_finger');
  const streamStateRef = useRef<StreamState>('idle');
  const managerRef = useRef(new HeartRateManager());

  const { device, format, hasPermission, requestPermission } = useHeartRateCamera();

  const needsIllumination = streamState !== 'idle' && streamState !== 'stopped';
  const torchMode: 'on' | 'off' =
    needsIllumination && device?.hasTorch === true
      ? 'on'
      : 'off';

  const startStreaming = useCallback((startTimestamp?: number) => {
    warmupStartRef.current = startTimestamp ?? null;
    goodSinceRef.current = null;
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
    fingerLostSinceRef.current = null;
    goodSinceRef.current = null;
    warmupStartRef.current = null;
    bpmHistoryRef.current = [];
    publishedBpmRef.current = null;
    fingerPlacementRef.current = 'no_finger';
    managerRef.current.reset();

    setStreamState('stopped');
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

      bufferRef.current.push(frameSample);
      const cutoff60 = timestamp - 60000;
      bufferRef.current = bufferRef.current.filter((s) => s.timestamp >= cutoff60);

      const frameState = managerRef.current.processFrame(frameSample);
      if (frameState.fingerPlacement !== fingerPlacementRef.current) {
        fingerPlacementRef.current = frameState.fingerPlacement;
        setFingerPlacement(frameState.fingerPlacement);
      }

      if (state === 'camera_check') {
        if (frameState.fingerPlacement === 'good') {
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
        if (frameState.fingerPlacement === 'lost' || (frameState.fingerPlacement !== 'good' && frameState.fingerPlacement !== 'partial')) {
          if (state !== 'finger_lost') {
            fingerLostSinceRef.current = timestamp;
            publishedBpmRef.current = null;
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

      if ((state === 'streaming' || state === 'warming_up') && frameState.beatDetected) {
        setBeatTick((tick) => tick + 1);
      }

      if ((state === 'streaming' || state === 'warming_up') && timestamp - lastBpmUpdateRef.current >= BPM_UPDATE_INTERVAL_MS) {
        lastBpmUpdateRef.current = timestamp;
        const bpm = managerRef.current.getCurrentBpm();
        if (bpm != null) {
          const stabilizedBpm = stabilizeBpmUpdate(bpm, publishedBpmRef.current);
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
    [finishStream, startStreaming],
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
    fingerLostSinceRef.current = null;
    goodSinceRef.current = null;
    warmupStartRef.current = null;
    fingerPlacementRef.current = 'no_finger';
    managerRef.current.reset();

    setCurrentBpm(null);
    setBeatTick(0);
    bpmHistoryRef.current = [];
    publishedBpmRef.current = null;
    setBpmHistory([]);
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
