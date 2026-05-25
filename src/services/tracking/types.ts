import type { HeartRateCaptureMode } from '../../lib/heartRate/captureModes';

export interface HeartRatePoint {
  offsetMs: number;
  bpm: number;
  signalQuality: number | null;
}

export interface HeartRateIbiPoint {
  offsetMs: number;
  ibiMs: number;
  signalQuality: number | null;
}

export interface DailyActivitySummary {
  activityDate: string;
  timezone: string;
  dailyBreathHoldCompleted: boolean;
  breathHoldCount: number;
  bestHoldSeconds: number | null;
  breathingSessionCount: number;
  breathingSeconds: number;
  heartRateCaptureCount: number;
  qualifiesForStreak: boolean;
}

export interface TodayHeartRateSummary {
  sessionId: string;
  startedAt: string;
  endedAt: string | null;
  localDate: string;
  timezone: string;
  durationSeconds: number;
  avgBpm: number | null;
  minBpm: number | null;
  maxBpm: number | null;
  rmssd: number | null;
  sdnn: number | null;
  pnn50: number | null;
  hrDrop: number | null;
  beatCount: number | null;
  stress: number | null;
  mode: HeartRateCaptureMode;
}

export interface HeartRateSessionDetail extends TodayHeartRateSummary {
  bpmSeries: HeartRatePoint[];
  ibiSeries: HeartRateIbiPoint[];
}

export interface BreathHoldSummary {
  sessionId: string;
  startedAt: string;
  endedAt: string | null;
  localDate: string;
  timezone: string;
  holdSeconds: number;
  avgBpm: number | null;
  minBpm: number | null;
  maxBpm: number | null;
  rmssd: number | null;
  sdnn: number | null;
  pnn50: number | null;
  hrDrop: number | null;
  beatCount: number | null;
  stress: number | null;
}

export interface BreathingSessionSummary {
  sessionId: string;
  techniqueId: string;
  startedAt: string;
  endedAt: string | null;
  localDate: string;
  timezone: string;
  durationSeconds: number;
  targetRounds: number | null;
  roundsCompleted: number | null;
  completed: boolean;
}
