import type {
  FingerPlacementState,
  IbiSample,
  LivePpgSignalSample,
  PpgFrameSample,
  PpgRoiSample,
  SignalStatus,
} from './types';

export interface HeartRateFrameState {
  fingerPlacement: FingerPlacementState;
  beatDetected: boolean;
  // Group-delay-compensated frame-clock timestamp of the detected beat's peak,
  // or null when no beat fired this frame. Consumers schedule the live tick
  // relative to this instead of detection time to remove frame-quantization
  // jitter from the emitted pulse.
  beatPeakTs: number | null;
  readyForMeasurement: boolean;
  signalText: string;
  signalStatus: SignalStatus;
}

export type HeartRateLiveBpmProfile = 'stable' | 'responsive';

export interface HeartRateBpmSnapshot {
  bpm: number;
  timestamp: number;
  signalQuality: number;
}

export interface HeartRateManagerOptions {
  liveBpmProfile?: HeartRateLiveBpmProfile;
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
// How many consecutive over-long gaps (missed beats) to tolerate while holding
// the last live BPM before giving up and clearing the interval history to
// re-lock. A single miss is normal during breathing; a run of them means the
// pulse was genuinely lost.
const MAX_CONSECUTIVE_LONG_GAPS = 3;
const ADAPTIVE_REFRACTORY_FRACTION = 0.5;
const TROUGH_REARM_FACTOR = 0.05;
const FORCE_REARM_AFTER_MS = 600;
const SHORT_IBI_CONFIRMATION_MS = 360;
const SHORT_IBI_CONFIRMATION_TOLERANCE = 0.25;
const WARMUP_FRAMES = 60;
const REINIT_GAP_MS = 1000;
const BAD_PLACEMENT_GRACE_MS = 500;
const FLAT_SIGNAL_GRACE_MS = 2500;
const FLAT_SIGNAL_AMPLITUDE_FLOOR = MIN_AMPLITUDE * 0.6;
const MIN_ROI_RED = 120;
const MIN_AVG_ROI_RED = 100;
const MAX_ROI_SATURATION = 0.98;
const MAX_AVG_SATURATION = 0.98;
const IBI_HISTORY_SIZE = 6;
// Fresh accepted beats required since a measurement window began before the
// motion detector is trusted. This is slightly more than either BPM profile
// needs, so motion is not trusted when the pulse has only barely locked.
const MIN_MOTION_LOCK_BEATS = 5;
const MALIK_THRESHOLD = 0.2;
const MALIK_SHORT_THRESHOLD = 0.12;
const MALIK_WINDOW = 5;
const MALIK_MIN_HISTORY = 3;
// Cold start (fewer than MALIK_MIN_HISTORY intervals): there is no rhythm to
// judge an interval against, so accept one only once the next interval agrees
// with it within this tolerance. A real rhythm produces two similar intervals
// in a row; a dicrotic-notch double-count or a noise peak produces mismatched
// ones, which would otherwise seed the history — and the first displayed BPM —
// too fast. On a clean signal this defers nothing but the push (pairs are
// committed together), so lock time is unchanged.
const COLD_START_IBI_TOLERANCE = 0.2;
// The first published BPM seeds the IBI EMA, so require the intervals it is
// derived from to agree within this spread before seeding. A contaminated cold
// start shows up as a wide spread, and seeding from it locks in a wrong first
// reading that the display then slowly bleeds down from. Applies only to the
// initial seed: once locked, slow breathing legitimately swings IBIs more than
// this and must not blank an established reading.
const INITIAL_LOCK_MAX_IBI_SPREAD = 0.2;
const SIGNAL_QUALITY_REF = 0.02;
const FILTER_GROUP_DELAY_MS = 65;
const LIVE_SIGNAL_WINDOW_MS = 8000;
// The PPG graph plots by timestamp, so a freeze (motion/no-pulse — while we stop
// feeding samples) leaves a time gap. Left as-is, the graph would fast-forward on
// resume to catch up to the newest timestamp. We instead collapse any gap larger
// than a couple of frames down to a single nominal frame, keeping the graph clock
// continuous so it resumes exactly where it froze. Visual-only — real frame
// timestamps used for beat/HR timing are untouched.
const LIVE_SIGNAL_FREEZE_GAP_MS = 250;
const LIVE_SIGNAL_RESUME_GAP_MS = 50;
const MOTION_WINDOW_MS = 1000;
const MOTION_MIN_FRAMES = 10;
// Motion shows up two ways the bandpassed pulse can't hide, and either one
// sustained across the window is movement:
//  - Raw luminance jumps away from its slow baseline. Shifting the finger/phone
//    changes optical coupling and contact pressure, so the raw (pre-bandpass)
//    brightness deviates far more than a pulse's ~1-3% AC. Catches both a fast
//    jerk and a slow reposition, and unlike the pulse amplitude this reference
//    (the baseline) is too slow to self-calibrate the motion away.
//  - The filtered trace stops being a smooth once-per-beat bump and reverses
//    direction on a large fraction of frames — the "erratic ups and downs" of a
//    corrupted signal. A clean pulse reverses only at its peak and trough.
const MOTION_RAW_DEV_THRESHOLD = 0.06;
const MOTION_DISTURBED_FRACTION = 0.3;
const MOTION_REVERSAL_FRACTION = 0.35;
// Direction reversals only count as motion when the pulse has real amplitude.
// A weak signal (e.g. the low-perfusion part of a breath) reverses from noise,
// not movement — that should read as calibrating, not "keep still". Expressed as
// a fraction of the quality reference (amplitude / SIGNAL_QUALITY_REF).
const MOTION_REVERSAL_MIN_QUALITY = 0.15;
const MOTION_HOLD_MS = 1200;
// Accelerometer-based device motion — orthogonal to the optical signal, so it
// catches phone movement the camera-based detector can miss (its whole weakness
// is that motion overlaps the pulse band). Magnitude is in g (~1.0 at rest);
// subtracting the window mean removes gravity, so the std-dev is ~0 when still
// and rises with movement regardless of orientation.
const ACCEL_WINDOW_MS = 600;
const ACCEL_MIN_SAMPLES = 8;
const ACCEL_MOTION_STD_THRESHOLD = 0.06;
// Rapid finger placement flip-flopping (good↔partial↔no_finger) is what a shake
// looks like when the finger keeps lifting off the lens — a different signature
// from the in-place motion above, so it is tracked separately.
const PLACEMENT_CHURN_WINDOW_MS = 1500;
const PLACEMENT_CHURN_MIN_CHANGES = 4;
const NO_PULSE_NOTICE_MS = 1200;
// Live BPM quality gate — kept just above the beat-detection amplitude floor
// (MIN_AMPLITUDE ≈ quality 0.02) so it only rejects near-flat signal, not a
// weak-but-real pulse. A higher floor created a dead zone where low-perfusion
// fingers (cold hands, light contact) detected consistent beats yet never
// cleared the gate, leaving the reading stuck on "calibrating".
const LIVE_BPM_MIN_QUALITY = 0.03;

const LIVE_BPM_PROFILE_CONFIG = {
  stable: {
    minIbis: 4,
    medianWindow: 6,
    emaAlpha: 0.2,
  },
  responsive: {
    minIbis: 5,
    medianWindow: 3,
    emaAlpha: 0.42,
  },
} as const;

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
    roi.r >= MIN_ROI_RED &&
    roi.darkPct < 0.35 &&
    roi.saturatedPct < MAX_ROI_SATURATION &&
    redToSum(roi) >= 0.66 &&
    redToMax(roi) >= 1.80
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
  let redSum = 0;

  for (const roi of sample.rois) {
    weightedSum += weightedChannelValue(roi);
    darkSum += roi.darkPct;
    saturatedSum += roi.saturatedPct;
    redSum += roi.r;
    if (isRoiCovered(roi)) coveredCount += 1;
  }

  const count = sample.rois.length;
  const weightedAverage = weightedSum / count;
  const avgDark = darkSum / count;
  const avgSaturated = saturatedSum / count;
  const coverage = coveredCount / count;
  const avgRed = redSum / count;

  if (avgDark > 0.45 || weightedAverage < 12) {
    return { placement: 'too_much_pressure', weightedAverage };
  }
  if (coverage < 0.55 || avgRed < MIN_AVG_ROI_RED) {
    return { placement: 'no_finger', weightedAverage };
  }
  if (avgSaturated > MAX_AVG_SATURATION || coverage < 0.95) {
    return { placement: 'partial', weightedAverage };
  }
  return { placement: 'good', weightedAverage };
}

export class HeartRateManager {
  private readonly liveBpmConfig: (typeof LIVE_BPM_PROFILE_CONFIG)[HeartRateLiveBpmProfile];
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
  private consecutiveLongGaps = 0;
  private readonly ibiSamples: IbiSample[] = [];
  private sessionStartTs: number | null = null;
  private skipNextRecordedIbi = false;
  private armedForPeak = true;
  private pendingShortPeakTs: number | null = null;
  private coldStartPendingIbi: { peakTs: number; ibiMs: number } | null = null;
  private badPlacementSinceTs: number | null = null;
  private flatSignalSinceTs: number | null = null;
  private polarity: 1 | -1 = 1;
  private polarityLocked = false;
  private polarityPositiveScore = 0;
  private polarityNegativeScore = 0;
  private readonly liveSignalSamples: LivePpgSignalSample[] = [];
  private lastGraphRealTs: number | null = null;
  private graphTimeShift = 0;
  private readonly motionFrames: {
    timestamp: number;
    disturbed: boolean;
    reversal: boolean;
  }[] = [];
  private motionUntilTs = 0;
  private motionPrevAc = 0;
  private motionPrevSlopeSign = 0;
  private motionHasPrevAc = false;
  private pulseLockedThisWindow = false;
  private lockBeatCount = 0;
  private readonly accelSamples: { timestamp: number; magnitude: number }[] = [];
  private accelMovingUntil = 0;
  private accelMoving = false;
  private readonly placementChangeTimes: number[] = [];
  private lastTrackedPlacement: FingerPlacementState = 'no_finger';
  private liveSignalStable = false;
  private ibiEma: number | null = null;
  private latestBpmSnapshot: HeartRateBpmSnapshot | null = null;

  constructor(options: HeartRateManagerOptions = {}) {
    this.liveBpmConfig = LIVE_BPM_PROFILE_CONFIG[options.liveBpmProfile ?? 'stable'];
  }

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
    this.consecutiveLongGaps = 0;
    this.ibiSamples.length = 0;
    this.sessionStartTs = null;
    this.skipNextRecordedIbi = false;
    this.armedForPeak = true;
    this.pendingShortPeakTs = null;
    this.coldStartPendingIbi = null;
    this.badPlacementSinceTs = null;
    this.flatSignalSinceTs = null;
    this.polarity = 1;
    this.polarityLocked = false;
    this.polarityPositiveScore = 0;
    this.polarityNegativeScore = 0;
    this.liveSignalSamples.length = 0;
    this.lastGraphRealTs = null;
    this.graphTimeShift = 0;
    this.motionFrames.length = 0;
    this.motionUntilTs = 0;
    this.motionPrevAc = 0;
    this.motionPrevSlopeSign = 0;
    this.motionHasPrevAc = false;
    this.pulseLockedThisWindow = false;
    this.lockBeatCount = 0;
    this.accelSamples.length = 0;
    this.accelMovingUntil = 0;
    this.accelMoving = false;
    this.placementChangeTimes.length = 0;
    this.lastTrackedPlacement = 'no_finger';
    this.liveSignalStable = false;
    this.ibiEma = null;
    this.latestBpmSnapshot = null;
  }

  // Counts transitions of the *committed* placement (after the grace window has
  // de-flickered brief dips). A steady finger commits one placement; a finger
  // that keeps genuinely lifting and reseating past the grace window churns the
  // committed placement, which is movement. Tracking the raw per-frame placement
  // instead would false-trigger on the normal coverage flicker that grace masks.
  private trackPlacementChurn(timestamp: number, committedPlacement: FingerPlacementState): boolean {
    if (committedPlacement !== this.lastTrackedPlacement) {
      this.placementChangeTimes.push(timestamp);
      this.lastTrackedPlacement = committedPlacement;
    }
    const cutoff = timestamp - PLACEMENT_CHURN_WINDOW_MS;
    while (
      this.placementChangeTimes.length > 0 &&
      this.placementChangeTimes[0] < cutoff
    ) {
      this.placementChangeTimes.shift();
    }
    return this.placementChangeTimes.length >= PLACEMENT_CHURN_MIN_CHANGES;
  }

  // Flags in-place motion (finger/phone moved but still on the lens) from two
  // signatures over a short window: the raw luminance deviating far from its slow
  // baseline (`rawDev`), and the filtered trace reversing direction erratically
  // instead of tracing one smooth bump per beat. A resting pulse trips neither;
  // either one over a large fraction of the window flags motion. Held briefly so
  // the warning does not flicker at the detection boundary.
  private trackMotion(timestamp: number, ac: number, rawDev: number): boolean {
    const strongEnoughForReversal =
      this.amplitude >= SIGNAL_QUALITY_REF * MOTION_REVERSAL_MIN_QUALITY;
    let reversal = false;
    if (this.motionHasPrevAc) {
      const slope = ac - this.motionPrevAc;
      const slopeSign = slope > 0 ? 1 : slope < 0 ? -1 : 0;
      if (slopeSign !== 0) {
        if (
          strongEnoughForReversal &&
          this.motionPrevSlopeSign !== 0 &&
          slopeSign !== this.motionPrevSlopeSign
        ) {
          reversal = true;
        }
        this.motionPrevSlopeSign = slopeSign;
      }
    }
    this.motionPrevAc = ac;
    this.motionHasPrevAc = true;

    this.motionFrames.push({
      timestamp,
      disturbed: rawDev > MOTION_RAW_DEV_THRESHOLD,
      reversal,
    });
    const cutoff = timestamp - MOTION_WINDOW_MS;
    while (this.motionFrames.length > 0 && this.motionFrames[0].timestamp < cutoff) {
      this.motionFrames.shift();
    }

    if (this.motionFrames.length >= MOTION_MIN_FRAMES) {
      const n = this.motionFrames.length;
      const disturbedFraction =
        this.motionFrames.filter((frame) => frame.disturbed).length / n;
      const reversalFraction =
        this.motionFrames.filter((frame) => frame.reversal).length / n;
      if (
        disturbedFraction > MOTION_DISTURBED_FRACTION ||
        reversalFraction > MOTION_REVERSAL_FRACTION
      ) {
        this.motionUntilTs = timestamp + MOTION_HOLD_MS;
      }
    }

    return timestamp < this.motionUntilTs;
  }

  private clearMotion(): void {
    this.motionFrames.length = 0;
    this.motionUntilTs = 0;
    this.motionPrevAc = 0;
    this.motionPrevSlopeSign = 0;
    this.motionHasPrevAc = false;
    this.pulseLockedThisWindow = false;
    this.lockBeatCount = 0;
  }

  // Feed device acceleration magnitude (in g) from the accelerometer. Kept in the
  // manager's own clock (the caller's timestamps) so the hold window compares
  // like-for-like; `accelMoving` is a plain flag the frame loop reads, avoiding
  // any cross-clock comparison with camera frame timestamps.
  pushAccelSample(timestamp: number, magnitude: number): void {
    if (!Number.isFinite(timestamp) || !Number.isFinite(magnitude)) return;
    this.accelSamples.push({ timestamp, magnitude });
    const cutoff = timestamp - ACCEL_WINDOW_MS;
    while (this.accelSamples.length > 0 && this.accelSamples[0].timestamp < cutoff) {
      this.accelSamples.shift();
    }

    if (this.accelSamples.length >= ACCEL_MIN_SAMPLES) {
      let sum = 0;
      for (const s of this.accelSamples) sum += s.magnitude;
      const mean = sum / this.accelSamples.length;
      let variance = 0;
      for (const s of this.accelSamples) variance += (s.magnitude - mean) ** 2;
      variance /= this.accelSamples.length;
      if (Math.sqrt(variance) > ACCEL_MOTION_STD_THRESHOLD) {
        this.accelMovingUntil = timestamp + MOTION_HOLD_MS;
      }
    }

    this.accelMoving = timestamp < this.accelMovingUntil;
  }

  private pushLiveSignalSample(timestamp: number, value: number): void {
    const quality = Math.min(
      1,
      Math.max(0, this.amplitude / SIGNAL_QUALITY_REF),
    );
    // Collapse any large gap since the last fed sample (a freeze) so the graph's
    // timeline stays continuous and doesn't fast-forward on resume.
    if (this.lastGraphRealTs != null) {
      const gap = timestamp - this.lastGraphRealTs;
      if (gap > LIVE_SIGNAL_FREEZE_GAP_MS) {
        this.graphTimeShift += gap - LIVE_SIGNAL_RESUME_GAP_MS;
      }
    }
    this.lastGraphRealTs = timestamp;
    const graphTimestamp = timestamp - this.graphTimeShift;

    this.liveSignalSamples.push({ timestamp: graphTimestamp, value, quality });
    const cutoff = graphTimestamp - LIVE_SIGNAL_WINDOW_MS;
    while (
      this.liveSignalSamples.length > 0 &&
      this.liveSignalSamples[0].timestamp < cutoff
    ) {
      this.liveSignalSamples.shift();
    }
  }

  // Gate for the *initial* EMA seed only (see INITIAL_LOCK_MAX_IBI_SPREAD):
  // the profile's minimum interval window must agree before the first BPM locks.
  private recentIbisConsistent(): boolean {
    if (this.ibiHistory.length < this.liveBpmConfig.minIbis) return false;
    const recent = this.ibiHistory.slice(-this.liveBpmConfig.minIbis);
    const min = Math.min(...recent);
    const max = Math.max(...recent);
    return min > 0 && (max - min) / min <= INITIAL_LOCK_MAX_IBI_SPREAD;
  }

  private pushAcceptedIbi(peakTs: number, ibi: number): void {
    this.consecutiveLongGaps = 0;
    this.lockBeatCount += 1;
    this.ibiHistory.push(ibi);
    if (this.ibiHistory.length > IBI_HISTORY_SIZE) {
      this.ibiHistory.shift();
    }

    // Update the selected profile's IBI EMA at beat cadence (not frame rate).
    let bpmEstimateUpdated = false;
    if (this.ibiHistory.length >= this.liveBpmConfig.minIbis) {
      const recentMedian = medianOfRecent(
        this.ibiHistory,
        this.ibiEma == null
          ? this.liveBpmConfig.minIbis
          : this.liveBpmConfig.medianWindow,
      );
      if (recentMedian > 0) {
        if (this.ibiEma == null) {
          if (this.recentIbisConsistent()) {
            this.ibiEma = recentMedian;
            bpmEstimateUpdated = true;
          }
        } else {
          const alpha = this.liveBpmConfig.emaAlpha;
          this.ibiEma = this.ibiEma * (1 - alpha) + recentMedian * alpha;
          bpmEstimateUpdated = true;
        }
      }
    }

    const quality = Math.min(
      1,
      Math.max(0, this.amplitude / SIGNAL_QUALITY_REF),
    );
    if (bpmEstimateUpdated && this.ibiEma != null && this.ibiEma > 0) {
      this.latestBpmSnapshot = {
        bpm: Math.round(60000 / this.ibiEma),
        timestamp: peakTs,
        signalQuality: quality,
      };
    }

    if (this.skipNextRecordedIbi) {
      this.skipNextRecordedIbi = false;
      return;
    }
    const anchorTs = this.sessionStartTs ?? peakTs;
    this.ibiSamples.push({
      offsetMs: Math.max(0, Math.round(peakTs - anchorTs)),
      ibiMs: Math.round(ibi),
      signalQuality: quality,
    });
  }

  beginMeasurementWindow(startTimestamp: number): void {
    this.ibiSamples.length = 0;
    // Keep liveSignalSamples intact so the PPG graph flows continuously from
    // calibration into the hold instead of resetting to empty. The buffer
    // self-trims to LIVE_SIGNAL_WINDOW_MS and is visual-only.
    this.sessionStartTs = startTimestamp;
    // Preserve the warmed detector, but avoid storing the first accepted
    // interval because it straddles the setup->measurement boundary.
    this.skipNextRecordedIbi = this.lastPeakTs !== 0;
    this.pendingShortPeakTs = null;
    this.coldStartPendingIbi = null;
    this.lastTickTs = 0;
    // Reset IBI EMA so measurement window starts with a fresh smoothed value
    this.ibiEma = null;
    this.latestBpmSnapshot = null;
    // Re-require a fresh pulse lock before trusting motion, so the opening inhale
    // / hand-settle at the start of a hold isn't misread as "keep still".
    this.pulseLockedThisWindow = false;
    this.lockBeatCount = 0;
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
            beatPeakTs: null,
            readyForMeasurement: this.validFrameCounter > WARMUP_FRAMES,
            signalText:
              this.validFrameCounter > WARMUP_FRAMES
                ? 'Measuring pulse'
                : 'Warm up and hold steady',
            signalStatus:
              this.validFrameCounter > WARMUP_FRAMES ? 'measuring' : 'warming_up',
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
      this.flatSignalSinceTs = null;
      this.clearMotion();
      this.ibiHistory.length = 0;
      this.ibiEma = null;
      this.coldStartPendingIbi = null;
      this.liveSignalStable = false;
      this.lastPlacement =
        placement === 'no_finger' && this.lastPlacement === 'good'
          ? 'lost'
          : placement;
      const placementChurn = this.trackPlacementChurn(sample.timestamp, this.lastPlacement);
      return {
        fingerPlacement: this.lastPlacement,
        beatDetected: false,
        beatPeakTs: null,
        readyForMeasurement: false,
        signalText: placementChurn
          ? 'Too much movement - hold still'
          : placement === 'too_much_pressure'
            ? 'Ease up on the pressure'
            : placement === 'partial'
              ? 'Adjust finger coverage'
            : this.lastPlacement === 'lost'
              ? 'Signal lost - hold steady'
              : 'Cover the back camera and flash',
        signalStatus: placementChurn
          ? 'excessive_motion'
          : placement === 'too_much_pressure'
            ? 'too_much_pressure'
            : placement === 'partial'
              ? 'partial_coverage'
            : this.lastPlacement === 'lost'
              ? 'signal_lost'
              : 'no_finger',
      };
    }

    this.badPlacementSinceTs = null;

    if (this.validFrameCounter > WARMUP_FRAMES) {
      if (this.amplitude < FLAT_SIGNAL_AMPLITUDE_FLOOR) {
        if (this.flatSignalSinceTs == null) {
          this.flatSignalSinceTs = sample.timestamp;
        } else if (
          sample.timestamp - this.flatSignalSinceTs > FLAT_SIGNAL_GRACE_MS
        ) {
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
          this.flatSignalSinceTs = null;
          this.clearMotion();
          this.ibiHistory.length = 0;
          this.ibiEma = null;
          this.coldStartPendingIbi = null;
          this.liveSignalStable = false;
          this.lastPlacement = 'lost';
          return {
            fingerPlacement: 'lost',
            beatDetected: false,
            beatPeakTs: null,
            readyForMeasurement: false,
            signalText: 'No pulse detected - adjust your finger',
            signalStatus: 'no_pulse',
          };
        }
      } else {
        this.flatSignalSinceTs = null;
      }
    } else {
      this.flatSignalSinceTs = null;
    }

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
      this.coldStartPendingIbi = null;
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

    // Motion classification is computed here (before the beat detector) so the
    // PPG graph can freeze during movement: while motion is active we stop
    // feeding it samples, holding the last clean waveform instead of drawing the
    // erratic disturbance. Bad placement already skips this whole path, so the
    // graph freezes for no-finger/lost/partial too.
    const placementChurn = this.trackPlacementChurn(sample.timestamp, placement);
    const rawDev =
      Math.abs(weightedAverage - this.baseline) / Math.max(this.baseline, 1);
    const excursionMotion = this.trackMotion(sample.timestamp, ac, rawDev);
    // Only trust the optical motion detectors once a real pulse has locked at
    // least once this measurement window. Before that everything is a settling
    // transient — the opening inhale of a breathing exercise, the hand settling
    // onto the phone — which should read as calibrating, not "keep still". The
    // latch is one-way (reset on measurement restart / placement loss) so that
    // once locked, motion still surfaces even as it disrupts the pulse. The
    // accelerometer is exempt from the latch: device shake is unambiguous
    // movement regardless of pulse state, so it surfaces at any time.
    if (this.ibiEma != null && this.lockBeatCount >= MIN_MOTION_LOCK_BEATS) {
      this.pulseLockedThisWindow = true;
    }
    const inMotion =
      this.accelMoving ||
      (readyForMeasurement &&
        this.pulseLockedThisWindow &&
        (placementChurn || excursionMotion));
    const noPulse =
      readyForMeasurement &&
      this.flatSignalSinceTs != null &&
      sample.timestamp - this.flatSignalSinceTs > NO_PULSE_NOTICE_MS;
    // Any surfaced signal problem freezes the graph and mutes beats: while it is
    // active we neither feed the PPG trace (it holds the last clean waveform) nor
    // emit beat ticks (which drive the pulse animation and haptics). Internal
    // interval tracking below still runs so the BPM can hold its last value.
    const signalError = inMotion || noPulse;

    if (!signalError) {
      this.pushLiveSignalSample(sample.timestamp, ac);
    }
    let beatDetected = false;
    let beatPeakTs: number | null = null;

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
                // A single over-long gap is almost always one missed beat during
                // breathing, not signal loss. Skip the anomalous interval but keep
                // the history and EMA so the live BPM holds its last real value
                // instead of blanking and rebuilding four beats from scratch. Only
                // clear and re-lock after several consecutive long gaps.
                this.consecutiveLongGaps += 1;
                this.coldStartPendingIbi = null;
                if (this.consecutiveLongGaps >= MAX_CONSECUTIVE_LONG_GAPS) {
                  this.ibiHistory.length = 0;
                  this.ibiEma = null;
                }
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
              } else if (this.ibiHistory.length === 0) {
                // Cold start, plausible interval: hold it until the next
                // interval agrees, then commit both. Mismatched neighbours
                // (echo peaks, settling noise) keep replacing the pending
                // interval and never contaminate the history.
                emitTick = true;
                const pending = this.coldStartPendingIbi;
                if (
                  pending != null &&
                  Math.abs(ibi - pending.ibiMs) / pending.ibiMs <=
                    COLD_START_IBI_TOLERANCE
                ) {
                  this.coldStartPendingIbi = null;
                  this.pushAcceptedIbi(pending.peakTs, pending.ibiMs);
                  this.pushAcceptedIbi(peakTs, ibi);
                } else {
                  this.coldStartPendingIbi = { peakTs, ibiMs: ibi };
                }
              } else if (this.ibiHistory.length < MALIK_MIN_HISTORY) {
                // Partial history: the committed intervals were already
                // pair-confirmed, so trust them over the incoming one — a
                // Malik-style consistency gate before Malik has enough
                // history to run. Rejections keep the anchor (like ectopic
                // rejection) so a split beat can't derail the rhythm; if the
                // committed rhythm itself was wrong, the long-gap path
                // clears it and cold start re-pairs.
                emitTick = true;
                const med = medianOfRecent(this.ibiHistory, MALIK_WINDOW);
                if (
                  med > 0 &&
                  Math.abs(ibi - med) / med <= COLD_START_IBI_TOLERANCE
                ) {
                  this.pushAcceptedIbi(peakTs, ibi);
                } else {
                  advanceAnchor = false;
                }
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
            beatPeakTs = peakTs;
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

    // `inMotion` / `noPulse` / `signalError` were computed above (before the
    // graph feed). Motion surfacing is gated on warm-up there: the settling ramp
    // is legitimately noisy and a still finger should read as calibrating.
    const signalStatus: SignalStatus = noPulse
      ? 'no_pulse'
      : inMotion
        ? 'excessive_motion'
        : readyForMeasurement
          ? 'measuring'
          : 'warming_up';

    this.liveSignalStable = signalStatus === 'measuring';

    return {
      fingerPlacement: placement,
      beatDetected: signalError ? false : beatDetected,
      beatPeakTs: signalError ? null : beatPeakTs,
      readyForMeasurement,
      signalText:
        signalStatus === 'no_pulse'
          ? 'No pulse detected - adjust your finger'
          : signalStatus === 'excessive_motion'
            ? 'Too much movement - hold still'
            : readyForMeasurement
              ? 'Measuring pulse'
              : 'Warm up and hold steady',
      signalStatus,
    };
  }

  getCurrentBpm(): number | null {
    return this.getCurrentBpmSnapshot()?.bpm ?? null;
  }

  getCurrentBpmSnapshot(): HeartRateBpmSnapshot | null {
    if (this.lastPlacement !== 'good') return null;
    if (!this.liveSignalStable) return null;
    if (this.amplitude / SIGNAL_QUALITY_REF < LIVE_BPM_MIN_QUALITY) return null;
    if (this.ibiHistory.length < this.liveBpmConfig.minIbis) return null;
    if (this.ibiEma == null || this.ibiEma <= 0) return null;
    if (this.latestBpmSnapshot == null) return null;
    if (this.latestBpmSnapshot.bpm < 40 || this.latestBpmSnapshot.bpm > 180) return null;
    return { ...this.latestBpmSnapshot };
  }

  getIbiSamples(): IbiSample[] {
    return this.ibiSamples.map((sample) => ({ ...sample }));
  }

  getLiveSignalSamples(): LivePpgSignalSample[] {
    return this.liveSignalSamples.map((sample) => ({ ...sample }));
  }

  getLatestLiveSignalTimestamp(): number | null {
    return this.liveSignalSamples[this.liveSignalSamples.length - 1]?.timestamp ?? null;
  }

  clearLiveSignalSamples(): void {
    this.liveSignalSamples.length = 0;
    this.lastGraphRealTs = null;
    this.graphTimeShift = 0;
  }
}
