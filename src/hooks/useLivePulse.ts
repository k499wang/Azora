import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useFrameProcessor,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
  runAtTargetFps,
} from 'react-native-vision-camera';
import { useRunOnJS } from 'react-native-worklets-core';
import type { FingerPlacementState, PpgFrameSample } from '../lib/heartRate/types';
import { heartRatePlugin } from '../lib/heartRate/heartRatePlugin';
import { HeartRateManager } from '../lib/heartRate/heartRateManager';
import { CameraSettingsLock } from '../native/cameraSettingsLock';

const FRAME_PROCESSING_FPS = 20;
const BPM_UPDATE_INTERVAL_MS = 1000;
const FINGER_LOST_TIMEOUT_MS = 1500;
const CAMERA_SETTLE_MS = 1500;

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
  device: ReturnType<typeof useCameraDevice>;
  format: ReturnType<typeof useCameraFormat>;
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
  const settledRef = useRef(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const managerRef = useRef(new HeartRateManager());
  const lastBpmUpdateRef = useRef(0);
  const lastFingerSeenAtRef = useRef<number | null>(null);

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back', {
    physicalDevices: ['wide-angle-camera'],
  });
  const format = useCameraFormat(device, [
    { fps: 30 },
    { videoResolution: { width: 640, height: 480 } },
  ]);

  const torchMode: 'on' | 'off' = active ? 'on' : 'off';

  const resetStreamState = useCallback(() => {
    managerRef.current.reset();
    lastBpmUpdateRef.current = 0;
    lastFingerSeenAtRef.current = null;
  }, []);

  const clearSettleTimer = useCallback(() => {
    if (settleTimerRef.current != null) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (activeRef.current) return;
    resetStreamState();
    activeRef.current = true;
    settledRef.current = false;
    setActive(true);
    setCurrentBpm(null);
    setBeatTick(0);
    setFingerPlacement('no_finger');
    clearSettleTimer();
    settleTimerRef.current = setTimeout(() => {
      settleTimerRef.current = null;
      if (!activeRef.current) return;
      void CameraSettingsLock.lock().finally(() => {
        if (activeRef.current) {
          settledRef.current = true;
          managerRef.current.reset();
          lastBpmUpdateRef.current = 0;
        }
      });
    }, CAMERA_SETTLE_MS);
  }, [clearSettleTimer, resetStreamState]);

  const stop = useCallback(() => {
    activeRef.current = false;
    settledRef.current = false;
    clearSettleTimer();
    void CameraSettingsLock.unlock();
    setActive(false);
    resetStreamState();
    setCurrentBpm(null);
    setFingerPlacement('no_finger');
  }, [clearSettleTimer, resetStreamState]);

  useEffect(
    () => () => {
      clearSettleTimer();
      if (activeRef.current) {
        void CameraSettingsLock.unlock();
      }
    },
    [clearSettleTimer],
  );

  const addSample = useRunOnJS(
    (frameSample: unknown) => {
      if (!activeRef.current) return;
      if (!settledRef.current) return;
      if (!isValidFrameSample(frameSample)) {
        managerRef.current.reset();
        lastFingerSeenAtRef.current = null;
        setCurrentBpm(null);
        setFingerPlacement('no_finger');
        return;
      }

      const frameState = managerRef.current.processFrame(frameSample);
      lastFingerSeenAtRef.current = frameState.fingerPlacement === 'no_finger' ? lastFingerSeenAtRef.current : frameSample.timestamp;
      setFingerPlacement(frameState.fingerPlacement);

      if (frameState.beatDetected) {
        setBeatTick((tick) => tick + 1);
      }

      const bpm = managerRef.current.getCurrentBpm();
      if (bpm != null && frameSample.timestamp - lastBpmUpdateRef.current >= BPM_UPDATE_INTERVAL_MS) {
        lastBpmUpdateRef.current = frameSample.timestamp;
        setCurrentBpm(bpm);
      }

      if (
        lastFingerSeenAtRef.current != null &&
        frameSample.timestamp - lastFingerSeenAtRef.current > FINGER_LOST_TIMEOUT_MS &&
        frameState.fingerPlacement === 'lost'
      ) {
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
