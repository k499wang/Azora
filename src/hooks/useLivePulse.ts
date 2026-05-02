import { useCallback, useRef, useState } from 'react';
import {
  useFrameProcessor,
  runAtTargetFps,
} from 'react-native-vision-camera';
import { useRunOnJS } from 'react-native-worklets-core';
import type { FingerPlacementState, PpgFrameSample } from '../lib/heartRate/types';
import { heartRatePlugin } from '../lib/heartRate/heartRatePlugin';
import { HeartRateManager } from '../lib/heartRate/heartRateManager';
import { stabilizeBpmUpdate } from '../lib/heartRate/bpmSmoothing';
import { useHeartRateCamera } from './useHeartRateCamera';

const FRAME_PROCESSING_FPS = 45;
const BPM_UPDATE_INTERVAL_MS = 1000;
const FINGER_LOST_TIMEOUT_MS = 1500;

function isValidFrameSample(value: unknown): value is PpgFrameSample {
  if (value == null || typeof value !== 'object') return false;
  const s = value as Partial<PpgFrameSample>;
  if (!Number.isFinite(s.timestamp) || !Array.isArray(s.rois)) return false;
  return s.rois.length > 0 && s.rois.every((roi) =>
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

interface UseLivePulseReturn {
  active: boolean;
  start: () => void;
  stop: () => void;
  fingerPlacement: FingerPlacementState;
  currentBpm: number | null;
  beatTick: number;
  device: ReturnType<typeof useHeartRateCamera>['device'];
  format: ReturnType<typeof useHeartRateCamera>['format'];
  frameProcessor: ReturnType<typeof useFrameProcessor>;
  torchMode: 'on' | 'off';
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

export function useLivePulse(): UseLivePulseReturn {
  const [active, setActive] = useState(false);
  const [fingerPlacement, setFingerPlacement] = useState<FingerPlacementState>('no_finger');
  const [currentBpm, setCurrentBpm] = useState<number | null>(null);
  const [beatTick, setBeatTick] = useState(0);

  const activeRef = useRef(false);
  const managerRef = useRef(new HeartRateManager());
  const lastBpmUpdateRef = useRef(0);
  const lastFingerSeenAtRef = useRef<number | null>(null);
  const publishedBpmRef = useRef<number | null>(null);

  const { device, format, hasPermission, requestPermission } = useHeartRateCamera();

  const torchMode: 'on' | 'off' =
    active && device?.hasTorch === true
      ? 'on'
      : 'off';

  const resetStreamState = useCallback(() => {
    managerRef.current.reset();
    lastBpmUpdateRef.current = 0;
    lastFingerSeenAtRef.current = null;
    publishedBpmRef.current = null;
  }, []);

  const start = useCallback(() => {
    if (activeRef.current) return;
    resetStreamState();
    activeRef.current = true;
    setActive(true);
    setCurrentBpm(null);
    setBeatTick(0);
    setFingerPlacement('no_finger');
  }, [resetStreamState]);

  const stop = useCallback(() => {
    activeRef.current = false;
    setActive(false);
    resetStreamState();
    setCurrentBpm(null);
    setFingerPlacement('no_finger');
  }, [resetStreamState]);

  const addSample = useRunOnJS(
    (frameSample: unknown) => {
      if (!activeRef.current) return;
      if (!isValidFrameSample(frameSample)) {
        managerRef.current.reset();
        lastFingerSeenAtRef.current = null;
        publishedBpmRef.current = null;
        setCurrentBpm(null);
        setFingerPlacement('no_finger');
        return;
      }

      const frameState = managerRef.current.processFrame(frameSample);
      lastFingerSeenAtRef.current = frameState.fingerPlacement === 'no_finger' ? lastFingerSeenAtRef.current : frameSample.timestamp;
      setFingerPlacement(frameState.fingerPlacement);

      const bpm = managerRef.current.getCurrentBpm();

      if (frameState.beatDetected && bpm != null) {
        setBeatTick((tick) => tick + 1);
      }

      if (bpm != null && frameSample.timestamp - lastBpmUpdateRef.current >= BPM_UPDATE_INTERVAL_MS) {
        lastBpmUpdateRef.current = frameSample.timestamp;
        const stabilizedBpm = stabilizeBpmUpdate(bpm, publishedBpmRef.current);
        publishedBpmRef.current = stabilizedBpm;
        setCurrentBpm(stabilizedBpm);
      }

      if (
        lastFingerSeenAtRef.current != null &&
        frameSample.timestamp - lastFingerSeenAtRef.current > FINGER_LOST_TIMEOUT_MS &&
        frameState.fingerPlacement === 'lost'
      ) {
        publishedBpmRef.current = null;
        setCurrentBpm(null);
      }
    },
    [],
  );

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      runAtTargetFps(FRAME_PROCESSING_FPS, () => {
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
    stop,
    fingerPlacement,
    currentBpm,
    beatTick,
    device,
    format,
    frameProcessor,
    torchMode,
    hasPermission,
    requestPermission,
  };
}
