import { useCallback, useRef, useState } from 'react';
import { useFrameProcessor } from 'react-native-vision-camera';
import type {
  FingerPlacementState,
  IbiSample,
  LivePpgSignalSample,
  PpgFrameSample,
  SignalStatus,
} from '../lib/heartRate/types';
import { useHeartRateCamera } from './useHeartRateCamera';

/**
 * Screenshot-mode stand-in for the real camera-driven pulse hook. The
 * simulator has no PPG signal, so this fakes a believable declining BPM
 * readout on a timer instead of processing camera frames. Same public API
 * as the real hook — swap this file back for on-device HR capture.
 */

export interface LivePulseBpmSample {
  offsetMs: number;
  bpm: number;
  signalQuality: number | null;
}

interface UseLivePulseReturn {
  active: boolean;
  start: () => void;
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

const MOCK_BASELINE_BPM = 70;
const MOCK_READY_DELAY_MS = 1500;
const MOCK_BPM_TICK_MS = 1000;
const MOCK_BEAT_TICK_MS = 850;
const MOCK_SIGNAL_TICK_MS = 40;
const MOCK_SIGNAL_FLUSH_MS = 120;
const MOCK_SIGNAL_WINDOW_MS = 9000;

/** Synthetic PPG waveform: a smooth, uniform rolling wave. */
function mockPulseWaveValue(phase: number): number {
  return Math.sin(phase * Math.PI * 2);
}

export function useLivePulse(
  _options: UseLivePulseOptions = {},
): UseLivePulseReturn {
  const [active, setActive] = useState(false);
  const [fingerPlacement, setFingerPlacement] = useState<FingerPlacementState>('no_finger');
  const [signalStatus, setSignalStatus] = useState<SignalStatus>('no_finger');
  const [currentBpm, setCurrentBpm] = useState<number | null>(null);
  const [isBpmReady, setIsBpmReady] = useState(false);
  const [beatTick, setBeatTick] = useState(0);
  const [liveSignalSamples, setLiveSignalSamples] = useState<LivePpgSignalSample[]>([]);

  const { device, format, hasPermission, requestPermission } = useHeartRateCamera();

  const timersRef = useRef<Array<ReturnType<typeof setInterval>>>([]);
  const startedAtRef = useRef(0);
  const collectingRef = useRef(false);
  const collectStartRef = useRef(0);
  const samplesRef = useRef<LivePulseBpmSample[]>([]);
  const currentBpmRef = useRef(MOCK_BASELINE_BPM);
  const signalBufferRef = useRef<LivePpgSignalSample[]>([]);
  const lastSignalFlushRef = useRef(0);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearInterval);
    timersRef.current = [];
  }, []);

  const start = useCallback(() => {
    clearTimers();
    startedAtRef.current = Date.now();
    currentBpmRef.current = MOCK_BASELINE_BPM;
    signalBufferRef.current = [];
    lastSignalFlushRef.current = 0;
    setActive(true);
    setFingerPlacement('good');
    setSignalStatus('warming_up');
    setCurrentBpm(null);
    setIsBpmReady(false);
    setLiveSignalSamples([]);

    const readyTimer = setTimeout(() => {
      setSignalStatus('measuring');
      setIsBpmReady(true);
      setCurrentBpm(MOCK_BASELINE_BPM);
    }, MOCK_READY_DELAY_MS);

    const bpmTimer = setInterval(() => {
      const elapsedSec = (Date.now() - startedAtRef.current) / 1000;
      const drift = Math.max(-14, -elapsedSec * 0.35);
      const jitter = Math.round(Math.random() * 2 - 1);
      const bpm = Math.round(MOCK_BASELINE_BPM + drift + jitter);
      currentBpmRef.current = bpm;
      setCurrentBpm(bpm);
      if (collectingRef.current) {
        samplesRef.current.push({
          offsetMs: Date.now() - collectStartRef.current,
          bpm,
          signalQuality: 0.9,
        });
      }
    }, MOCK_BPM_TICK_MS);

    const beatTimer = setInterval(() => {
      setBeatTick((tick) => tick + 1);
    }, MOCK_BEAT_TICK_MS);

    const signalTimer = setInterval(() => {
      const now = Date.now();
      const periodMs = 60000 / currentBpmRef.current;
      const elapsedMs = now - startedAtRef.current;
      const phase = (elapsedMs % periodMs) / periodMs;
      const noise = (Math.random() - 0.5) * 0.005;
      const value = (mockPulseWaveValue(phase) + noise) * 0.01;

      signalBufferRef.current.push({ timestamp: now, value, quality: 1 });
      const cutoff = now - MOCK_SIGNAL_WINDOW_MS;
      while (
        signalBufferRef.current.length > 0 &&
        signalBufferRef.current[0].timestamp < cutoff
      ) {
        signalBufferRef.current.shift();
      }

      if (now - lastSignalFlushRef.current >= MOCK_SIGNAL_FLUSH_MS) {
        lastSignalFlushRef.current = now;
        setLiveSignalSamples(signalBufferRef.current.slice());
      }
    }, MOCK_SIGNAL_TICK_MS);

    timersRef.current = [readyTimer, bpmTimer, beatTimer, signalTimer];
  }, [clearTimers]);

  const stop = useCallback(() => {
    clearTimers();
    setActive(false);
    setFingerPlacement('no_finger');
    setSignalStatus('no_finger');
    setCurrentBpm(null);
    setIsBpmReady(false);
    setLiveSignalSamples([]);
  }, [clearTimers]);

  const beginMeasurementWindow = useCallback(() => {}, []);
  const getMeasurementSamples = useCallback(() => [] as PpgFrameSample[], []);
  const getIbiSamples = useCallback(() => [] as IbiSample[], []);

  const beginBpmSampleCollection = useCallback(() => {
    samplesRef.current = [];
    collectStartRef.current = Date.now();
    collectingRef.current = true;
  }, []);

  const getBpmSamples = useCallback(() => {
    collectingRef.current = false;
    return samplesRef.current.map((sample) => ({ ...sample }));
  }, []);

  const frameProcessor = useFrameProcessor(() => {
    'worklet';
  }, []);

  return {
    active,
    start,
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
    torchMode: 'off',
    hasPermission,
    requestPermission,
    beginMeasurementWindow,
    getMeasurementSamples,
    getIbiSamples,
    beginBpmSampleCollection,
    getBpmSamples,
  };
}
