import type { PpgFrameSample } from './types';

export interface FrameRecording {
  version: 1;
  recordedAt: string;
  frames: PpgFrameSample[];
}

const MAX_RECORDING_MS = 120_000;
// A timestamp jumping backwards means the camera clock restarted (new
// session); mixing sessions in one recording would corrupt replay timing.
const CLOCK_RESET_TOLERANCE_MS = 1_000;

export interface FrameRecorder {
  push(frame: PpgFrameSample): void;
  clear(): void;
  frameCount(): number;
  durationMs(): number;
  serialize(recordedAt?: Date): string;
}

export function createFrameRecorder(
  maxDurationMs: number = MAX_RECORDING_MS,
): FrameRecorder {
  let frames: PpgFrameSample[] = [];

  return {
    push(frame: PpgFrameSample): void {
      if (!Number.isFinite(frame.timestamp) || !Array.isArray(frame.rois)) {
        return;
      }
      const last = frames[frames.length - 1];
      if (last != null && frame.timestamp < last.timestamp - CLOCK_RESET_TOLERANCE_MS) {
        frames = [];
      }
      frames.push({
        timestamp: frame.timestamp,
        rois: frame.rois.map((roi) => ({ ...roi })),
      });
      const cutoff = frame.timestamp - maxDurationMs;
      let firstKept = 0;
      while (firstKept < frames.length && frames[firstKept].timestamp < cutoff) {
        firstKept += 1;
      }
      if (firstKept > 0) {
        frames = frames.slice(firstKept);
      }
    },
    clear(): void {
      frames = [];
    },
    frameCount(): number {
      return frames.length;
    },
    durationMs(): number {
      if (frames.length < 2) return 0;
      return frames[frames.length - 1].timestamp - frames[0].timestamp;
    },
    serialize(recordedAt: Date = new Date()): string {
      const recording: FrameRecording = {
        version: 1,
        recordedAt: recordedAt.toISOString(),
        frames,
      };
      return JSON.stringify(recording);
    },
  };
}

export function parseFrameRecording(json: string): FrameRecording {
  const parsed: unknown = JSON.parse(json);
  if (parsed == null || typeof parsed !== 'object') {
    throw new Error('Recording is not an object');
  }
  const recording = parsed as Partial<FrameRecording>;
  if (recording.version !== 1) {
    throw new Error(`Unsupported recording version: ${String(recording.version)}`);
  }
  if (!Array.isArray(recording.frames)) {
    throw new Error('Recording has no frames array');
  }
  for (const frame of recording.frames) {
    if (
      frame == null ||
      !Number.isFinite(frame.timestamp) ||
      !Array.isArray(frame.rois)
    ) {
      throw new Error('Recording contains an invalid frame');
    }
  }
  return {
    version: 1,
    recordedAt: typeof recording.recordedAt === 'string' ? recording.recordedAt : '',
    frames: recording.frames,
  };
}
