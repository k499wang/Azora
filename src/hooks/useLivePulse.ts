import { useCallback, useRef, useState } from 'react';
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
import { classifyFingerPlacementStateless } from '../lib/heartRate/fingerQuality';
import { detectLatestBeat, PREVIEW_BPM_OPTIONS } from '../lib/heartRate/signalProcessing';
import { computeRollingBPM } from '../lib/heartRate/rollingWindow';

// Shorter timing constants than the one-shot capture hook. Live mode prioritizes
// responsiveness over a final, locked-in reading.
const FINGER_QUALITY_WINDOW_MS = 1000;
const ROLLING_CLASSIFY_WINDOW_MS = 2000;
const ROLLING_BPM_WINDOW_MS = 10000;
const BPM_UPDATE_INTERVAL_MS = 1000;
const BEAT_DETECTION_INTERVAL_MS = 80;
const FRAME_PROCESSING_FPS = 20;
// Continuous stream — cap the sample buffer so memory doesn't grow unbounded.
const MAX_SAMPLE_AGE_MS = ROLLING_BPM_WINDOW_MS + 2000;
// Median-smooth the displayed BPM over the last N raw readings. At ~1 reading/sec
// this gives a 5-second smoothing window that eats single-sample outliers.
const BPM_SMOOTHING_WINDOW = 5;

function medianOf(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
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

export function useLivePulse(): UseLivePulseReturn {
  const [active, setActive] = useState(false);
  const [fingerPlacement, setFingerPlacement] = useState<FingerPlacementState>('no_finger');
  const [currentBpm, setCurrentBpm] = useState<number | null>(null);
  const [beatTick, setBeatTick] = useState(0);

  // Refs shadow state for the frame callback, which fires faster than React flushes.
  const activeRef = useRef(false);
  const samplesRef = useRef<PpgFrameSample[]>([]);
  const lastBpmUpdateRef = useRef(0);
  const lastBeatCheckRef = useRef(0);
  const lastBeatTimestampRef = useRef<number | null>(null);
  const currentBpmRef = useRef<number | null>(null);
  const bpmHistoryRef = useRef<number[]>([]);
  const fingerPlacementRef = useRef<FingerPlacementState>('no_finger');
  const fingerClassifyStateRef = useRef<{
    previousState?: FingerPlacementState;
    goodSinceMs?: number;
  }>({});

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
    samplesRef.current = [];
    lastBpmUpdateRef.current = 0;
    lastBeatCheckRef.current = 0;
    lastBeatTimestampRef.current = null;
    currentBpmRef.current = null;
    bpmHistoryRef.current = [];
    fingerPlacementRef.current = 'no_finger';
    fingerClassifyStateRef.current = {};
  }, []);

  const start = useCallback(() => {
    // Idempotent: if already streaming, don't wipe the sample buffer. Callers
    // (e.g. an effect that depends on frequently-changing state) may invoke
    // start() redundantly; dropping samples here would prevent BPM stabilizing.
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

  // Runs on JS thread via useRunOnJS. Hot path — ~20Hz while active.
  const addSample = useRunOnJS(
    (frameSample: unknown) => {
      if (!activeRef.current) return;

      if (!isValidFrameSample(frameSample)) {
        samplesRef.current = [];
        currentBpmRef.current = null;
        fingerPlacementRef.current = 'no_finger';
        lastBeatTimestampRef.current = null;
        fingerClassifyStateRef.current = {};
        setCurrentBpm(null);
        setFingerPlacement('no_finger');
        return;
      }

      const timestamp = frameSample.timestamp;
      samplesRef.current.push(frameSample);

      // Bound the buffer — we never need samples older than the BPM window.
      const ageCutoff = timestamp - MAX_SAMPLE_AGE_MS;
      if (samplesRef.current[0] != null && samplesRef.current[0].timestamp < ageCutoff) {
        samplesRef.current = samplesRef.current.filter((s) => s.timestamp >= ageCutoff);
      }

      const recentCutoff = timestamp - ROLLING_CLASSIFY_WINDOW_MS;
      const recentSamples = samplesRef.current.filter((s) => s.timestamp >= recentCutoff);
      const { placement, state: newClassifyState } = classifyFingerPlacementStateless(
        recentSamples,
        FINGER_QUALITY_WINDOW_MS,
        fingerClassifyStateRef.current,
      );
      fingerClassifyStateRef.current = newClassifyState;
      if (placement !== fingerPlacementRef.current) {
        fingerPlacementRef.current = placement;
        setFingerPlacement(placement);
      }

      // Keep beat detection on 'partial' (so the heart icon still pulses if the
      // finger shifts slightly) but require 'good' placement to update the
      // displayed BPM — partial placements produce genuinely noisier readings.
      const canDetectBeat = placement === 'good' || placement === 'partial';
      const canEstimateBpm = placement === 'good';

      if (!canDetectBeat) {
        if (currentBpmRef.current != null) {
          currentBpmRef.current = null;
          setCurrentBpm(null);
        }
        bpmHistoryRef.current = [];
        lastBeatTimestampRef.current = null;
        return;
      }

      if (timestamp - lastBeatCheckRef.current >= BEAT_DETECTION_INTERVAL_MS) {
        lastBeatCheckRef.current = timestamp;
        const beat = detectLatestBeat(samplesRef.current, lastBeatTimestampRef.current);
        if (beat != null) {
          lastBeatTimestampRef.current = beat.timestamp;
          setBeatTick((t) => t + 1);
        }
      }

      if (canEstimateBpm && timestamp - lastBpmUpdateRef.current >= BPM_UPDATE_INTERVAL_MS) {
        lastBpmUpdateRef.current = timestamp;
        const bpm = computeRollingBPM(
          samplesRef.current,
          ROLLING_BPM_WINDOW_MS,
          PREVIEW_BPM_OPTIONS,
        );
        if (bpm != null) {
          // Median-smooth raw readings. Pushes outliers to the tails where the
          // median ignores them — this is what makes the displayed BPM stop
          // bouncing between e.g. 72 and 81 each second.
          bpmHistoryRef.current.push(bpm.bpm);
          if (bpmHistoryRef.current.length > BPM_SMOOTHING_WINDOW) {
            bpmHistoryRef.current.shift();
          }
          const smoothed = medianOf(bpmHistoryRef.current);
          currentBpmRef.current = smoothed;
          setCurrentBpm(smoothed);
        }
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
