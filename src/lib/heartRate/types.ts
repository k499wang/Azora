export type CaptureState =
  | 'idle'
  | 'setup'
  | 'camera_check'
  | 'measuring'
  | 'processing'
  | 'done'
  | 'error';

export type StreamState =
  | 'idle'
  | 'camera_check'
  | 'warming_up'
  | 'streaming'
  | 'finger_lost'
  | 'stopped';

export type FingerPlacementState =
  | 'no_finger'
  | 'partial'
  | 'too_much_pressure'
  | 'good'
  | 'lost';

export type PpgQuality = 'good' | 'fair' | 'poor';

export type PpgChannel = 'weighted' | 'red' | 'green' | 'blue' | 'redRatio' | 'hue';

export interface PpgRoiSample {
  id: string;
  r: number;
  g: number;
  b: number;
  saturatedPct: number;
  darkPct: number;
  variance: number;
}

export interface PpgFrameSample {
  timestamp: number;
  rois: PpgRoiSample[];
}

export interface HeartRateEstimate {
  bpm: number;
  confidence: number;
  quality: PpgQuality;
  sampleCount: number;
  durationMs: number;
  roiId: string;
  channel: PpgChannel;
  snrDb: number;
  frequencyBpm: number;
  peakBpm: number | null;
}

export interface HeartRateReading {
  bpm: number;
  confidence: number;
  quality?: PpgQuality;
  roiId?: string;
  channel?: PpgChannel;
  snrDb?: number;
  frequencyBpm?: number;
  peakBpm?: number | null;
  sampleCount: number;
  durationMs: number;
  recordedAt: string;
  source: 'camera-flash';
}

export interface CaptureResult {
  reading: HeartRateReading | null;
  error: 'low_confidence' | 'too_few_samples' | 'signal_lost' | 'camera_error' | null;
}

export interface HeartRateStreamSummary {
  avgBpm: number;
  minBpm: number;
  maxBpm: number;
  readings: number[];
  durationMs: number;
  recordedAt: string;
}

export interface SetupScreenProps {
  onNext: () => void;
  onCancel: () => void;
}
