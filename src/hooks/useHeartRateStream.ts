import { useCallback, useRef, useState, useEffect } from 'react';
import {
  useFrameProcessor,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { useRunOnJS } from 'react-native-worklets-core';
import type {
  StreamState,
  BrightnessSample,
  FingerPlacementState,
  HeartRateStreamSummary,
} from '../lib/heartRate/types';
import { heartRatePlugin } from '../lib/heartRate/heartRatePlugin';
import { classifyFingerPlacementStateless } from '../lib/heartRate/fingerQuality';
import { computeRollingBPM } from '../lib/heartRate/rollingWindow';

const ROLLING_WINDOW_MS = 15000;
const BPM_UPDATE_INTERVAL_MS = 4000;
const FINGER_LOST_TIMEOUT_MS = 30000;
const FINGER_CLASSIFY_WINDOW_MS = 1000;
const ROLLING_CLASSIFY_WINDOW_MS = 2000;
const WARMUP_DURATION_MS = 5000;

interface UseHeartRateStreamReturn {
  streamState: StreamState;
  fingerPlacement: FingerPlacementState;
  currentBpm: number | null;
  bpmHistory: number[];
  sessionSummary: HeartRateStreamSummary | null;
  device: ReturnType<typeof useCameraDevice>;
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
  const [bpmHistory, setBpmHistory] = useState<number[]>([]);
  const [sessionSummary, setSessionSummary] = useState<HeartRateStreamSummary | null>(null);

  const bufferRef = useRef<BrightnessSample[]>([]);
  const streamStartRef = useRef<number | null>(null);
  const lastBpmUpdateRef = useRef<number>(0);
  const fingerLostSinceRef = useRef<number | null>(null);
  const goodSinceRef = useRef<number | null>(null);
  const warmupStartRef = useRef<number | null>(null);
  const streamStateRef = useRef<StreamState>('idle');
  const fingerClassifyStateRef = useRef<{
    previousState?: FingerPlacementState;
    goodSinceMs?: number;
  }>({});
  const bpmHistoryRef = useRef<number[]>([]);

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  useEffect(() => {
    streamStateRef.current = streamState;
  }, [streamState]);

  const torchMode: 'on' | 'off' =
    streamState !== 'idle' && streamState !== 'stopped' ? 'on' : 'off';

  const startStreaming = useCallback(() => {
    warmupStartRef.current = Date.now();
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
    fingerLostSinceRef.current = null;
    goodSinceRef.current = null;
    warmupStartRef.current = null;
    fingerClassifyStateRef.current = {};

    setStreamState('stopped');
    streamStateRef.current = 'stopped';
  }, []);

  const addSample = useRunOnJS(
    (brightness: number) => {
      const timestamp = Date.now();
      const state = streamStateRef.current;
      if (state === 'idle' || state === 'stopped') return;

      const sample: BrightnessSample = { value: brightness, timestamp };
      bufferRef.current.push(sample);

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
      setFingerPlacement(placement);

      if (state === 'camera_check') {
        if (placement === 'good') {
          if (goodSinceRef.current == null) {
            goodSinceRef.current = timestamp;
          } else if (timestamp - goodSinceRef.current >= 1500) {
            startStreaming();
          }
        } else {
          goodSinceRef.current = null;
        }
        return;
      }

      if (state === 'warming_up') {
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
          setStreamState('streaming');
          streamStateRef.current = 'streaming';
        }
      }

      // Rolling BPM update every 4s
      if (
        (state === 'streaming' || state === 'warming_up') &&
        timestamp - lastBpmUpdateRef.current >= BPM_UPDATE_INTERVAL_MS
      ) {
        lastBpmUpdateRef.current = timestamp;
        const bpmResult = computeRollingBPM(bufferRef.current, ROLLING_WINDOW_MS);
        if (bpmResult != null) {
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
      const brightness = heartRatePlugin(frame);
      if (brightness != null) {
        addSample(brightness);
      }
    },
    [addSample],
  );

  const startStream = useCallback(() => {
    bufferRef.current = [];
    bpmHistoryRef.current = [];
    streamStartRef.current = Date.now();
    lastBpmUpdateRef.current = 0;
    fingerLostSinceRef.current = null;
    goodSinceRef.current = null;
    warmupStartRef.current = null;
    fingerClassifyStateRef.current = {};

    setCurrentBpm(null);
    setBpmHistory([]);
    setSessionSummary(null);
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
    bpmHistory,
    sessionSummary,
    device,
    frameProcessor,
    torchMode,
    startStream,
    startStreaming,
    stopStream,
    hasPermission,
    requestPermission,
  };
}
