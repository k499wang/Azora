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
const SMOOTH_ALPHA = 0.4;
const AMPLITUDE_ALPHA = 0.05;
const PEAK_THRESHOLD_FACTOR = 0.4;
const MIN_AMPLITUDE = 0.001;
const MIN_IBI_MS = 300;
const MAX_IBI_MS = 1500;
const WARMUP_FRAMES = 20;
const REINIT_GAP_MS = 1000;
const IBI_HISTORY_SIZE = 8;

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
    redToSum(roi) >= 0.58 &&
    redToMax(roi) >= 1.08
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
  if (avgSaturated > 0.55 || coverage < 0.7) {
    return { placement: 'partial', weightedAverage };
  }
  return { placement: 'good', weightedAverage };
}

export class HeartRateManager {
  private baseline = 0;
  private smoothed = 0;
  private amplitude = 0;
  private prev1 = 0;
  private prev2 = 0;
  private prev1Ts = 0;
  private lastPeakTs = 0;
  private lastGoodTs = 0;
  private validFrameCounter = 0;
  private initialized = false;
  private lastPlacement: FingerPlacementState = 'no_finger';
  private readonly ibiHistory: number[] = [];
  private readonly ibiSamples: IbiSample[] = [];
  private sessionStartTs: number | null = null;

  reset(): void {
    this.baseline = 0;
    this.smoothed = 0;
    this.amplitude = 0;
    this.prev1 = 0;
    this.prev2 = 0;
    this.prev1Ts = 0;
    this.lastPeakTs = 0;
    this.lastGoodTs = 0;
    this.validFrameCounter = 0;
    this.initialized = false;
    this.lastPlacement = 'no_finger';
    this.ibiHistory.length = 0;
    this.ibiSamples.length = 0;
    this.sessionStartTs = null;
  }

  processFrame(sample: PpgFrameSample): HeartRateFrameState {
    const { placement, weightedAverage } = classifyFrame(sample);

    if (placement === 'no_finger' || placement === 'too_much_pressure') {
      this.validFrameCounter = 0;
      this.prev1 = 0;
      this.prev2 = 0;
      this.lastPlacement = this.lastPlacement === 'good' ? 'lost' : placement;
      return {
        fingerPlacement: this.lastPlacement,
        beatDetected: false,
        readyForMeasurement: false,
        signalText:
          placement === 'too_much_pressure'
            ? 'Ease up on the pressure'
            : this.lastPlacement === 'lost'
              ? 'Signal lost - hold steady'
              : 'Cover the back camera and flash',
      };
    }

    const gapMs = this.lastGoodTs === 0 ? 0 : sample.timestamp - this.lastGoodTs;
    if (!this.initialized || gapMs > REINIT_GAP_MS) {
      if (this.sessionStartTs == null || gapMs > REINIT_GAP_MS) {
        this.sessionStartTs = sample.timestamp;
      }
      this.baseline = weightedAverage;
      this.smoothed = weightedAverage;
      this.amplitude = 0;
      this.prev1 = 0;
      this.prev2 = 0;
      this.lastPeakTs = 0;
      this.validFrameCounter = 0;
      this.initialized = true;
    }

    this.baseline += BASELINE_ALPHA * (weightedAverage - this.baseline);
    this.smoothed += SMOOTH_ALPHA * (weightedAverage - this.smoothed);
    const denom = Math.max(this.baseline, 1);
    const ac = (this.smoothed - this.baseline) / denom;
    this.amplitude += AMPLITUDE_ALPHA * (Math.abs(ac) - this.amplitude);

    this.validFrameCounter += 1;
    const readyForMeasurement = this.validFrameCounter > WARMUP_FRAMES;
    let beatDetected = false;

    if (readyForMeasurement && this.amplitude > MIN_AMPLITUDE) {
      const threshold = this.amplitude * PEAK_THRESHOLD_FACTOR;
      const isPeak =
        this.prev1 > threshold &&
        this.prev1 >= this.prev2 &&
        this.prev1 > ac;
      if (isPeak) {
        const refractoryOk =
          this.lastPeakTs === 0 || this.prev1Ts - this.lastPeakTs >= MIN_IBI_MS;
        if (refractoryOk) {
          if (this.lastPeakTs !== 0) {
            const ibi = this.prev1Ts - this.lastPeakTs;
            if (ibi <= MAX_IBI_MS) {
              this.ibiHistory.push(ibi);
              if (this.ibiHistory.length > IBI_HISTORY_SIZE) {
                this.ibiHistory.shift();
              }
              this.ibiSamples.push({
                offsetMs: Math.max(0, this.prev1Ts - (this.sessionStartTs ?? this.prev1Ts)),
                ibiMs: Math.round(ibi),
                signalQuality: null,
              });
            } else {
              this.ibiHistory.length = 0;
            }
          }
          this.lastPeakTs = this.prev1Ts;
          beatDetected = true;
        }
      }
    }

    this.prev2 = this.prev1;
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
    if (this.ibiHistory.length < 3) return null;
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
