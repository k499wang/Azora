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

export interface BrightnessSample {
  value: number;       // red channel average 0-255
  timestamp: number;   // ms since capture started
}

export interface HeartRateReading {
  bpm: number;
  confidence: number;
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
