import type {
  FingerPlacementState,
  IbiSample,
  PpgFrameSample,
  PpgRoiSample,
} from './types';

export interface HeartRateFrameState {
  fingerPlacement: FingerPlacementState;
  beatDetected: boolean;
  readyForMeasurement: boolean;
  signalText: string;
}

const BASELINE_ALPHA = 0.02;
const AMPLITUDE_ALPHA = 0.10;
const INITIAL_PEAK_THRESHOLD_FACTOR = 0.3;
const ADAPTIVE_THRESHOLD_BASE_FACTOR = 0.2;
const ADAPTIVE_THRESHOLD_DECAY_FACTOR = 0.2;
const ADAPTIVE_THRESHOLD_DECAY_START_FRACTION = 0.85;
const POLARITY_LOCK_DOMINANCE = 1.35;
const POLARITY_EXCURSION_THRESHOLD_FACTOR = 0.5;
const DEFAULT_EXPECTED_IBI_MS = 800;
const MIN_AMPLITUDE = 0.0004;
const MIN_IBI_MS = 320;
const MAX_IBI_MS = 1500;
const ADAPTIVE_REFRACTORY_FRACTION = 0.5;
const TROUGH_REARM_FACTOR = 0.05;
const FORCE_REARM_AFTER_MS = 600;
const SHORT_IBI_CONFIRMATION_MS = 360;
const SHORT_IBI_CONFIRMATION_TOLERANCE = 0.25;
const WARMUP_FRAMES = 60;
const REINIT_GAP_MS = 1000;
const BAD_PLACEMENT_GRACE_MS = 500;
const IBI_HISTORY_SIZE = 8;
const MIN_LIVE_BPM_IBIS = 3;
const MALIK_THRESHOLD = 0.2;
const MALIK_SHORT_THRESHOLD = 0.12;
const MALIK_WINDOW = 5;
const MALIK_MIN_HISTORY = 3;
const SIGNAL_QUALITY_REF = 0.02;
const FILTER_GROUP_DELAY_MS = 65;

const SAMPLE_RATE_HZ = 30;
const BP_LOW_HZ = 0.7;
const BP_HIGH_HZ = 3.5;

interface BiquadCoeffs {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

function designHighpass(fs: number, f0: number): BiquadCoeffs {
  const w0 = (2 * Math.PI * f0) / fs;
  const cosw = Math.cos(w0);
  const sinw = Math.sin(w0);
  const alpha = sinw / (2 * Math.SQRT1_2);
  const a0 = 1 + alpha;
  return {
    b0: (1 + cosw) / 2 / a0,
    b1: -(1 + cosw) / a0,
    b2: (1 + cosw) / 2 / a0,
    a1: (-2 * cosw) / a0,
    a2: (1 - alpha) / a0,
  };
}

function designLowpass(fs: number, f0: number): BiquadCoeffs {
  const w0 = (2 * Math.PI * f0) / fs;
  const cosw = Math.cos(w0);
  const sinw = Math.sin(w0);
  const alpha = sinw / (2 * Math.SQRT1_2);
  const a0 = 1 + alpha;
  return {
    b0: (1 - cosw) / 2 / a0,
    b1: (1 - cosw) / a0,
    b2: (1 - cosw) / 2 / a0,
    a1: (-2 * cosw) / a0,
    a2: (1 - alpha) / a0,
  };
}

const HP_COEFFS = designHighpass(SAMPLE_RATE_HZ, BP_LOW_HZ);
const LP_COEFFS = designLowpass(SAMPLE_RATE_HZ, BP_HIGH_HZ);

class Biquad {
  private readonly coeffs: BiquadCoeffs;
  private s1 = 0;
  private s2 = 0;

  constructor(coeffs: BiquadCoeffs) {
    this.coeffs = coeffs;
  }

  process(x: number): number {
    const { b0, b1, b2, a1, a2 } = this.coeffs;
    const y = b0 * x + this.s1;
    this.s1 = b1 * x - a1 * y + this.s2;
    this.s2 = b2 * x - a2 * y;
    return y;
  }

  reset(): void {
    this.s1 = 0;
    this.s2 = 0;
  }

  // Seed filter state as if it had seen a constant input x0 indefinitely.
  // dcGain is the filter's DC response (0 for highpass, 1 for lowpass).
  prime(x0: number, dcGain: number): void {
    const { b0, b2, a2 } = this.coeffs;
    const y = dcGain * x0;
    this.s1 = y - b0 * x0;
    this.s2 = b2 * x0 - a2 * y;
  }
}

export function interpolatePeakTimestamp(
  y1: number,
  y2: number,
  y3: number,
  t1: number,
  t2: number,
  t3: number,
): number {
  const denom = y1 - 2 * y2 + y3;
  if (!Number.isFinite(denom) || denom >= 0) return t2;
  let offset = (0.5 * (y1 - y3)) / denom;
  if (!Number.isFinite(offset)) return t2;
  if (offset > 1) offset = 1;
  if (offset < -1) offset = -1;
  const dt = (t3 - t1) / 2;
  return t2 + offset * dt;
}

export function medianOfRecent(values: number[], window: number): number {
  const slice = values.slice(-window);
  const sorted = [...slice].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export function adaptivePeakThreshold(
  amplitude: number,
  timeSinceLastPeakMs: number,
  expectedIbiMs: number,
): number {
  if (amplitude <= 0) return 0;
  if (timeSinceLastPeakMs < 0 || expectedIbiMs <= 0) {
    return amplitude * INITIAL_PEAK_THRESHOLD_FACTOR;
  }

  const decayStartMs = expectedIbiMs * ADAPTIVE_THRESHOLD_DECAY_START_FRACTION;
  if (timeSinceLastPeakMs < decayStartMs) {
    return amplitude * INITIAL_PEAK_THRESHOLD_FACTOR;
  }
  const decayElapsedMs = timeSinceLastPeakMs - decayStartMs;
  const decayFactor = Math.exp(-decayElapsedMs / expectedIbiMs);
  const thresholdFactor = Math.min(
    INITIAL_PEAK_THRESHOLD_FACTOR,
    ADAPTIVE_THRESHOLD_BASE_FACTOR +
      ADAPTIVE_THRESHOLD_DECAY_FACTOR * decayFactor,
  );
  return amplitude * thresholdFactor;
}

function weightedChannelValue(roi: PpgRoiSample): number {
  return roi.r * 0.67 + roi.g * 0.33;
}

function redToSum(roi: PpgRoiSample): number {
  const total = roi.r + roi.g + roi.b;
  return total > 0 ? roi.r / total : 0;
}

function redToMax(roi: PpgRoiSample): number {
  return roi.r / Math.max(1, Math.max(roi.g, roi.b));
}

function isRoiCovered(roi: PpgRoiSample): boolean {
  const value = weightedChannelValue(roi);
  return (
    value >= 25 &&
    value <= 245 &&
    roi.darkPct < 0.35 &&
    roi.saturatedPct < 0.45 &&
    redToSum(roi) >= 0.54 &&
    redToMax(roi) >= 1.05
  );
}

function classifyFrame(sample: PpgFrameSample): {
  placement: FingerPlacementState;
  weightedAverage: number;
} {
  if (sample.rois.length === 0) {
    return { placement: 'no_finger', weightedAverage: 0 };
  }

  let weightedSum = 0;
  let darkSum = 0;
  let saturatedSum = 0;
  let coveredCount = 0;

  for (const roi of sample.rois) {
    weightedSum += weightedChannelValue(roi);
    darkSum += roi.darkPct;
    saturatedSum += roi.saturatedPct;
    if (isRoiCovered(roi)) coveredCount += 1;
  }

  const count = sample.rois.length;
  const weightedAverage = weightedSum / count;
  const avgDark = darkSum / count;
  const avgSaturated = saturatedSum / count;
  const coverage = coveredCount / count;

  if (avgDark > 0.45 || weightedAverage < 12) {
    return { placement: 'too_much_pressure', weightedAverage };
  }
  if (coverage < 0.35) {
    return { placement: 'no_finger', weightedAverage };
  }
  if (avgSaturated > 0.55 || coverage < 0.65) {
    return { placement: 'partial', weightedAverage };
  }
  return { placement: 'good', weightedAverage };
}

export class HeartRateManager {
  private baseline = 0;
  private amplitude = 0;
  private readonly bpHp = new Biquad(HP_COEFFS);
  private readonly bpLp = new Biquad(LP_COEFFS);
  private needsBandpassPrime = false;
  private prev1 = 0;
  private prev2 = 0;
  private prev1Ts = 0;
  private prev2Ts = 0;
  private lastPeakTs = 0;
  private lastTickTs = 0;
  private lastGoodTs = 0;
  private validFrameCounter = 0;
  private initialized = false;
  private lastPlacement: FingerPlacementState = 'no_finger';
  private readonly ibiHistory: number[] = [];
  private readonly ibiSamples: IbiSample[] = [];
  private sessionStartTs: number | null = null;
  private skipNextRecordedIbi = false;
  private armedForPeak = true;
  private pendingShortPeakTs: number | null = null;
  private badPlacementSinceTs: number | null = null;
  private polarity: 1 | -1 = 1;
  private polarityLocked = false;
  private polarityPositiveScore = 0;
  private polarityNegativeScore = 0;

  reset(): void {
    this.baseline = 0;
    this.amplitude = 0;
    this.bpHp.reset();
    this.bpLp.reset();
    this.needsBandpassPrime = false;
    this.prev1 = 0;
    this.prev2 = 0;
    this.prev1Ts = 0;
    this.prev2Ts = 0;
    this.lastPeakTs = 0;
    this.lastTickTs = 0;
    this.lastGoodTs = 0;
    this.validFrameCounter = 0;
    this.initialized = false;
    this.lastPlacement = 'no_finger';
    this.ibiHistory.length = 0;
    this.ibiSamples.length = 0;
    this.sessionStartTs = null;
    this.skipNextRecordedIbi = false;
    this.armedForPeak = true;
    this.pendingShortPeakTs = null;
    this.badPlacementSinceTs = null;
    this.polarity = 1;
    this.polarityLocked = false;
    this.polarityPositiveScore = 0;
    this.polarityNegativeScore = 0;
  }

  private pushAcceptedIbi(peakTs: number, ibi: number): void {
    if (this.skipNextRecordedIbi) {
      this.skipNextRecordedIbi = false;
      return;
    }
    this.ibiHistory.push(ibi);
    if (this.ibiHistory.length > IBI_HISTORY_SIZE) {
      this.ibiHistory.shift();
    }
    const anchorTs = this.sessionStartTs ?? peakTs;
    const quality = Math.min(
      1,
      Math.max(0, this.amplitude / SIGNAL_QUALITY_REF),
    );
    this.ibiSamples.push({
      offsetMs: Math.max(0, Math.round(peakTs - anchorTs)),
      ibiMs: Math.round(ibi),
      signalQuality: quality,
    });
  }

  beginMeasurementWindow(startTimestamp: number): void {
    this.ibiSamples.length = 0;
    this.sessionStartTs = startTimestamp;
    // Preserve the warmed detector, but avoid storing the first accepted
    // interval because it straddles the setup->measurement boundary.
    this.skipNextRecordedIbi = this.lastPeakTs !== 0;
    // Do not let setup-phase settling artifacts seed the displayed BPM or
    // outlier rejection for the actual measurement window.
    this.ibiHistory.length = 0;
    this.pendingShortPeakTs = null;
    this.lastTickTs = 0;
  }

  private getExpectedIbiMs(): number {
    if (this.ibiHistory.length >= MALIK_MIN_HISTORY) {
      return Math.min(
        MAX_IBI_MS,
        Math.max(MIN_IBI_MS, medianOfRecent(this.ibiHistory, MALIK_WINDOW)),
      );
    }
    return DEFAULT_EXPECTED_IBI_MS;
  }

  processFrame(sample: PpgFrameSample): HeartRateFrameState {
    const { placement, weightedAverage } = classifyFrame(sample);

    if (placement !== 'good') {
      if (this.initialized && this.lastGoodTs !== 0) {
        if (this.badPlacementSinceTs == null) {
          this.badPlacementSinceTs = sample.timestamp;
        }

        if (sample.timestamp - this.badPlacementSinceTs <= BAD_PLACEMENT_GRACE_MS) {
          return {
            fingerPlacement: this.lastPlacement,
            beatDetected: false,
            readyForMeasurement: this.validFrameCounter > WARMUP_FRAMES,
            signalText:
              this.validFrameCounter > WARMUP_FRAMES
                ? 'Measuring pulse'
                : 'Warm up and hold steady',
          };
        }
      }

      this.validFrameCounter = 0;
      this.amplitude = 0;
      this.bpHp.reset();
      this.bpLp.reset();
      this.needsBandpassPrime = true;
      this.prev1 = 0;
      this.prev2 = 0;
      this.prev1Ts = 0;
      this.prev2Ts = 0;
      this.armedForPeak = true;
      this.pendingShortPeakTs = null;
      this.lastTickTs = 0;
      this.lastPlacement =
        placement === 'no_finger' && this.lastPlacement === 'good'
          ? 'lost'
          : placement;
      return {
        fingerPlacement: this.lastPlacement,
        beatDetected: false,
        readyForMeasurement: false,
        signalText:
          placement === 'too_much_pressure'
            ? 'Ease up on the pressure'
            : placement === 'partial'
              ? 'Adjust finger coverage'
            : this.lastPlacement === 'lost'
              ? 'Signal lost - hold steady'
              : 'Cover the back camera and flash',
      };
    }

    this.badPlacementSinceTs = null;

    const gapMs = this.lastGoodTs === 0 ? 0 : sample.timestamp - this.lastGoodTs;
    if (!this.initialized || gapMs > REINIT_GAP_MS) {
      if (this.sessionStartTs == null) {
        this.sessionStartTs = sample.timestamp;
      }
      this.baseline = weightedAverage;
      this.bpHp.prime(weightedAverage, 0);
      this.bpLp.prime(0, 1);
      this.needsBandpassPrime = false;
      this.amplitude = 0;
      this.prev1 = 0;
      this.prev2 = 0;
      this.prev1Ts = 0;
      this.prev2Ts = 0;
      this.lastPeakTs = 0;
      this.lastTickTs = 0;
      this.ibiHistory.length = 0;
      this.validFrameCounter = 0;
      this.initialized = true;
      this.armedForPeak = true;
      this.pendingShortPeakTs = null;
    }

    if (this.needsBandpassPrime) {
      // After a brief placement loss, re-seed the band-pass on the next
      // valid frame so stale filter state cannot distort the first beats.
      this.baseline = weightedAverage;
      this.bpHp.prime(weightedAverage, 0);
      this.bpLp.prime(0, 1);
      this.amplitude = 0;
      this.needsBandpassPrime = false;
      this.armedForPeak = true;
      this.pendingShortPeakTs = null;
    }

    this.baseline += BASELINE_ALPHA * (weightedAverage - this.baseline);
    const hp = this.bpHp.process(weightedAverage);
    const bp = this.bpLp.process(hp);
    const denom = Math.max(this.baseline, 1);
    const rawAc = bp / denom;
    this.amplitude += AMPLITUDE_ALPHA * (Math.abs(rawAc) - this.amplitude);

    if (!this.polarityLocked && this.amplitude > MIN_AMPLITUDE) {
      const excursionThreshold =
        this.amplitude * POLARITY_EXCURSION_THRESHOLD_FACTOR;
      if (rawAc > excursionThreshold) {
        this.polarityPositiveScore += rawAc;
      } else if (rawAc < -excursionThreshold) {
        this.polarityNegativeScore += -rawAc;
      }
    }

    this.validFrameCounter += 1;
    const readyForMeasurement = this.validFrameCounter > WARMUP_FRAMES;

    if (!this.polarityLocked && readyForMeasurement) {
      const pos = this.polarityPositiveScore;
      const neg = this.polarityNegativeScore;
      if (
        neg > pos * POLARITY_LOCK_DOMINANCE &&
        neg > 0
      ) {
        this.polarity = -1;
      }
      this.polarityLocked = true;
    }

    const ac = rawAc * this.polarity;
    let beatDetected = false;

    if (readyForMeasurement && this.amplitude > MIN_AMPLITUDE) {
      const upperThreshold =
        this.lastPeakTs === 0
          ? this.amplitude * INITIAL_PEAK_THRESHOLD_FACTOR
          : adaptivePeakThreshold(
              this.amplitude,
              sample.timestamp - this.lastPeakTs,
              this.getExpectedIbiMs(),
            );
      const lowerThreshold = -this.amplitude * TROUGH_REARM_FACTOR;
      if (
        !this.armedForPeak &&
        (ac < lowerThreshold ||
          (this.lastPeakTs !== 0 &&
            sample.timestamp - this.lastPeakTs >= FORCE_REARM_AFTER_MS))
      ) {
        this.armedForPeak = true;
      }

      const isPeak =
        this.armedForPeak &&
        this.prev1 > upperThreshold &&
        this.prev1 >= this.prev2 &&
        this.prev1 > ac;
      if (isPeak) {
        const rawPeakTs =
          this.prev2Ts > 0
            ? interpolatePeakTimestamp(
                this.prev2,
                this.prev1,
                ac,
                this.prev2Ts,
                this.prev1Ts,
                sample.timestamp,
              )
            : this.prev1Ts;
        const peakTs = rawPeakTs - FILTER_GROUP_DELAY_MS;
        const adaptiveMinIbi =
          this.ibiHistory.length >= MALIK_MIN_HISTORY
            ? Math.max(
                MIN_IBI_MS,
                ADAPTIVE_REFRACTORY_FRACTION *
                  medianOfRecent(this.ibiHistory, MALIK_WINDOW),
              )
            : MIN_IBI_MS;
        const refractoryOk =
          this.lastPeakTs === 0 || peakTs - this.lastPeakTs >= adaptiveMinIbi;
        if (refractoryOk) {
          let advanceAnchor = true;
          let emitTick = this.lastPeakTs === 0;
          if (this.lastPeakTs !== 0) {
            const ibi = peakTs - this.lastPeakTs;
            let handledInterval = false;

            const pendingTs = this.pendingShortPeakTs;
            if (pendingTs != null) {
              const pendingIbi = pendingTs - this.lastPeakTs;
              const confirmedIbi = peakTs - pendingTs;
              const confirmsFastRhythm =
                confirmedIbi >= MIN_IBI_MS &&
                confirmedIbi < SHORT_IBI_CONFIRMATION_MS &&
                Math.abs(confirmedIbi - pendingIbi) / Math.max(pendingIbi, 1) <=
                  SHORT_IBI_CONFIRMATION_TOLERANCE;
              if (confirmsFastRhythm) {
                emitTick = true;
                handledInterval = true;
                this.pendingShortPeakTs = null;
                this.pushAcceptedIbi(pendingTs, pendingIbi);
                this.pushAcceptedIbi(peakTs, confirmedIbi);
              } else {
                this.pendingShortPeakTs = null;
              }
            }

            if (!handledInterval) {
              if (ibi > MAX_IBI_MS) {
                this.ibiHistory.length = 0;
                emitTick = true;
              } else if (
                this.ibiHistory.length < MALIK_MIN_HISTORY &&
                ibi < SHORT_IBI_CONFIRMATION_MS
              ) {
                // Cold start: defer short IBIs until a similar next IBI
                // confirms a real fast rhythm; otherwise drop as a likely
                // dicrotic doublet. No tick yet — we don't know if this
                // peak is real or a dicrotic notch.
                this.pendingShortPeakTs = peakTs;
                advanceAnchor = false;
              } else {
                emitTick = true;
                const ectopic =
                  this.ibiHistory.length >= MALIK_MIN_HISTORY &&
                  (() => {
                    const med = medianOfRecent(this.ibiHistory, MALIK_WINDOW);
                    if (med <= 0) return false;
                    const threshold =
                      ibi < med ? MALIK_SHORT_THRESHOLD : MALIK_THRESHOLD;
                    return Math.abs(ibi - med) / med > threshold;
                  })();
                if (!ectopic) {
                  this.pushAcceptedIbi(peakTs, ibi);
                } else {
                  advanceAnchor = false;
                }
              }
            }
          }
          if (advanceAnchor) {
            this.lastPeakTs = peakTs;
          }
          if (
            emitTick &&
            this.lastTickTs !== 0 &&
            peakTs - this.lastTickTs < MIN_IBI_MS
          ) {
            emitTick = false;
          }
          if (emitTick) {
            this.lastTickTs = peakTs;
            this.armedForPeak = false;
          }
          beatDetected = emitTick;
        }
      }
    }

    this.prev2 = this.prev1;
    this.prev2Ts = this.prev1Ts;
    this.prev1 = ac;
    this.prev1Ts = sample.timestamp;
    this.lastGoodTs = sample.timestamp;
    this.lastPlacement = placement;

    return {
      fingerPlacement: placement,
      beatDetected,
      readyForMeasurement,
      signalText: readyForMeasurement ? 'Measuring pulse' : 'Warm up and hold steady',
    };
  }

  getCurrentBpm(): number | null {
    if (this.lastPlacement !== 'good') return null;
    if (this.ibiHistory.length < MIN_LIVE_BPM_IBIS) return null;
    const sorted = [...this.ibiHistory].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    const medianMs =
      sorted.length % 2 === 0
        ? (sorted[middle - 1] + sorted[middle]) / 2
        : sorted[middle];
    if (medianMs <= 0) return null;
    const bpm = Math.round(60000 / medianMs);
    if (bpm < 40 || bpm > 180) return null;
    return bpm;
  }

  getIbiSamples(): IbiSample[] {
    return this.ibiSamples.map((sample) => ({ ...sample }));
  }
}
