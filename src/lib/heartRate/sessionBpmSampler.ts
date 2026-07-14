export interface SessionBpmReading {
  bpm: number;
  signalQuality: number | null;
}

export interface SessionBpmSample extends SessionBpmReading {
  offsetMs: number;
}

const DEFAULT_SAMPLE_INTERVAL_MS = 1_000;

function isValidReading(reading: SessionBpmReading | null): reading is SessionBpmReading {
  return (
    reading != null &&
    Number.isFinite(reading.bpm) &&
    (reading.signalQuality == null || Number.isFinite(reading.signalQuality))
  );
}

/**
 * Samples the latest published BPM on a frame-timestamp cadence. Missed or
 * ineligible slots are advanced without later backfill, so graph offsets stay
 * tied to when the exercise actually displayed each value.
 */
export class SessionBpmSampler {
  private readonly intervalMs: number;
  private startedAtMs: number | null = null;
  private nextOffsetMs = 0;
  private samples: SessionBpmSample[] = [];

  constructor(intervalMs = DEFAULT_SAMPLE_INTERVAL_MS) {
    this.intervalMs = Number.isFinite(intervalMs) && intervalMs > 0
      ? intervalMs
      : DEFAULT_SAMPLE_INTERVAL_MS;
  }

  start(timestampMs: number, initialReading: SessionBpmReading | null): void {
    this.samples = [];
    this.startedAtMs = Number.isFinite(timestampMs) ? timestampMs : null;
    this.nextOffsetMs = this.intervalMs;

    if (this.startedAtMs != null && isValidReading(initialReading)) {
      this.samples.push({ offsetMs: 0, ...initialReading });
    }
  }

  observe(timestampMs: number, reading: SessionBpmReading | null): void {
    if (
      this.startedAtMs == null ||
      !Number.isFinite(timestampMs) ||
      timestampMs < this.startedAtMs
    ) {
      return;
    }

    const elapsedMs = timestampMs - this.startedAtMs;
    if (elapsedMs < this.nextOffsetMs) return;

    const latestDueOffset =
      Math.floor(elapsedMs / this.intervalMs) * this.intervalMs;
    this.nextOffsetMs = latestDueOffset + this.intervalMs;

    if (isValidReading(reading)) {
      this.samples.push({ offsetMs: latestDueOffset, ...reading });
    }
  }

  finish(): SessionBpmSample[] {
    const result = this.samples.map((sample) => ({ ...sample }));
    this.reset();
    return result;
  }

  reset(): void {
    this.startedAtMs = null;
    this.nextOffsetMs = 0;
    this.samples = [];
  }
}

export function createSessionBpmSampler(intervalMs = DEFAULT_SAMPLE_INTERVAL_MS): SessionBpmSampler {
  return new SessionBpmSampler(intervalMs);
}
