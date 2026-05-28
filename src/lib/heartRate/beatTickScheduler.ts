type TimeoutHandle = ReturnType<typeof globalThis.setTimeout>;

// The detector confirms a beat one or more frames after the peak actually
// crests, and that lag varies with frame-quantization jitter. We know each
// beat's true peak time, so instead of emitting the live tick at detection
// time we delay it so every tick lands at a constant offset after its peak.
// The constant offset is imperceptible on a repeating pulse; the jitter is not.
const DEFAULT_TARGET_LATENCY_MS = 180;
// Beats are at least MIN_IBI_MS (320ms) apart, so a delay capped well below
// that can never cause one tick to overrun the next.
const DEFAULT_MAX_DELAY_MS = 220;

export interface BeatTickSchedulerOptions {
  onBeat: () => void;
  targetLatencyMs?: number;
  maxDelayMs?: number;
  setTimeout?: (callback: () => void, delayMs: number) => TimeoutHandle;
  clearTimeout?: (handle: TimeoutHandle) => void;
}

export interface BeatTickScheduler {
  // peakTs and frameNowTs must share the same clock (the camera frame clock),
  // so their difference is the beat's age regardless of any wall-clock offset.
  schedule: (peakTs: number, frameNowTs: number) => void;
  reset: () => void;
}

export function createBeatTickScheduler({
  onBeat,
  targetLatencyMs = DEFAULT_TARGET_LATENCY_MS,
  maxDelayMs = DEFAULT_MAX_DELAY_MS,
  setTimeout: schedule = globalThis.setTimeout,
  clearTimeout: cancel = globalThis.clearTimeout,
}: BeatTickSchedulerOptions): BeatTickScheduler {
  let pending: TimeoutHandle | null = null;

  const reset = () => {
    if (pending != null) {
      cancel(pending);
      pending = null;
    }
  };

  return {
    schedule: (peakTs, frameNowTs) => {
      if (pending != null) {
        // A previous tick is still queued (shouldn't happen given the delay cap
        // is below the minimum beat interval). Flush it so we never drop a beat.
        cancel(pending);
        pending = null;
        onBeat();
      }

      const beatAgeMs = frameNowTs - peakTs;
      let delayMs = targetLatencyMs - beatAgeMs;
      if (!Number.isFinite(delayMs) || delayMs < 0) {
        delayMs = 0;
      } else if (delayMs > maxDelayMs) {
        delayMs = maxDelayMs;
      }

      pending = schedule(() => {
        pending = null;
        onBeat();
      }, delayMs);
    },
    reset,
  };
}
