import type { FingerPlacementState, PpgFrameSample, PpgRoiSample } from './types';

const MIN_ROI_RED = 80;
const MIN_AVG_ROI_RED = 70;

interface ClassifyState {
  previousState?: FingerPlacementState;
  goodSinceMs?: number;
}

let _previousState: FingerPlacementState | undefined = undefined;
let _goodSinceMs: number | undefined = undefined;

function weightedValue(roi: PpgRoiSample): number {
  return roi.r * 0.67 + roi.g * 0.33;
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / values.length);
}

function finiteRois(frame: PpgFrameSample): PpgRoiSample[] {
  return frame.rois.filter((roi) =>
    Number.isFinite(roi.r) &&
    Number.isFinite(roi.g) &&
    Number.isFinite(roi.b) &&
    Number.isFinite(roi.saturatedPct) &&
    Number.isFinite(roi.darkPct)
  );
}

function redToSum(roi: PpgRoiSample): number {
  return roi.r / Math.max(1, roi.g + roi.b);
}

function redToMaxChannel(roi: PpgRoiSample): number {
  return roi.r / Math.max(1, roi.g, roi.b);
}

function weightedFrameValue(rois: PpgRoiSample[]): number {
  return mean(rois.map(weightedValue));
}

function isCoveredByFinger(roi: PpgRoiSample): boolean {
  const value = weightedValue(roi);

  return (
    value >= 25 &&
    value <= 245 &&
    roi.r >= MIN_ROI_RED &&
    roi.darkPct < 0.35 &&
    roi.saturatedPct < 0.45 &&
    redToSum(roi) >= 0.68 &&
    redToMaxChannel(roi) >= 1.20
  );
}

function classifyRecent(recent: PpgFrameSample[]): FingerPlacementState {
  const frameRois = recent.map(finiteRois).filter((rois) => rois.length > 0);

  if (frameRois.length === 0) return 'no_finger';

  const rois = frameRois.flat();
  const values = rois.map(weightedValue);
  const avgValue = mean(values);
  const avgSaturated = mean(rois.map((roi) => roi.saturatedPct));
  const avgDark = mean(rois.map((roi) => roi.darkPct));
  const avgRed = mean(rois.map((roi) => roi.r));
  const avgRedToSum = mean(rois.map(redToSum));
  const avgRedToMax = mean(rois.map(redToMaxChannel));
  const avgCoverage = mean(
    frameRois.map((items) => items.filter(isCoveredByFinger).length / items.length),
  );
  const frameValues = frameRois.map(weightedFrameValue);
  const frameMeanValue = Math.max(1, mean(frameValues));
  let largeFrameJumps = 0;
  for (let i = 1; i < frameValues.length; i++) {
    const jumpRatio = Math.abs(frameValues[i] - frameValues[i - 1]) / Math.max(1, frameValues[i - 1]);
    if (jumpRatio > 0.12) {
      largeFrameJumps += 1;
    }
  }
  const frameJumpFraction = largeFrameJumps / Math.max(1, frameValues.length - 1);
  const frameDriftRatio =
    (Math.max(...frameValues) - Math.min(...frameValues)) / frameMeanValue;
  const roiIds = Array.from(new Set(rois.map((roi) => roi.id)));
  const avgTemporalCv = mean(
    roiIds.map((roiId) => {
      const roiValues = recent
        .map((frame) => frame.rois.find((roi) => roi.id === roiId))
        .filter((roi): roi is PpgRoiSample => roi != null)
        .map(weightedValue);
      return standardDeviation(roiValues) / Math.max(1, mean(roiValues));
    }),
  );
  const avgSpatialCv = mean(
    frameRois.map((items) => {
      const roiValues = items.map(weightedValue);
      return standardDeviation(roiValues) / Math.max(1, mean(roiValues));
    }),
  );

  if (avgDark > 0.45 || avgValue < 12) {
    return 'too_much_pressure';
  }

  if (
    avgCoverage < 0.35 ||
    avgRedToSum < 0.62 ||
    avgRedToMax < 1.15 ||
    avgRed < MIN_AVG_ROI_RED
  ) {
    return 'no_finger';
  }

  if (avgSaturated > 0.55) {
    return 'partial';
  }

  if (frameDriftRatio > 0.35 || frameJumpFraction > 0.15) {
    return 'partial';
  }

  if (
    avgCoverage >= 0.75 &&
    avgRedToSum >= 0.65 &&
    avgRedToMax >= 1.18 &&
    avgTemporalCv >= 0.0015 &&
    avgSpatialCv <= 0.35
  ) {
    return 'good';
  }

  return 'partial';
}

/**
 * Classifies signal quality into FingerPlacementState based on recent native
 * PPG frame summaries.
 */
export function classifyFingerPlacement(
  samples: PpgFrameSample[],
  windowMs: number = 1000,
): FingerPlacementState {
  const { placement, state } = classifyFingerPlacementStateless(samples, windowMs, {
    previousState: _previousState,
    goodSinceMs: _goodSinceMs,
  });

  _previousState = state.previousState;
  _goodSinceMs = state.goodSinceMs;

  return placement;
}

/**
 * Stateless version that accepts explicit previous state tracking.
 * Use this when you want to manage state externally.
 */
export function classifyFingerPlacementStateless(
  samples: PpgFrameSample[],
  windowMs: number = 1000,
  state: ClassifyState = {},
): { placement: FingerPlacementState; state: ClassifyState } {
  if (samples.length === 0) {
    return {
      placement: 'no_finger',
      state: { previousState: 'no_finger', goodSinceMs: undefined },
    };
  }

  const now = samples[samples.length - 1].timestamp;
  const cutoff = now - windowMs;
  const recent = samples.filter((sample) => sample.timestamp >= cutoff);

  if (recent.length === 0) {
    return {
      placement: 'no_finger',
      state: { previousState: 'no_finger', goodSinceMs: undefined },
    };
  }

  const currentState = classifyRecent(recent);
  let newGoodSinceMs = state.goodSinceMs;
  let placement: FingerPlacementState = currentState;

  if (currentState === 'good') {
    if (newGoodSinceMs == null) {
      newGoodSinceMs = now;
    }
  } else if (state.previousState === 'good' && newGoodSinceMs != null) {
    const notGoodDuration = now - (newGoodSinceMs + windowMs);
    if (notGoodDuration > 1000) {
      placement = 'lost';
      newGoodSinceMs = undefined;
    }
  } else {
    newGoodSinceMs = undefined;
  }

  return {
    placement,
    state: { previousState: placement, goodSinceMs: newGoodSinceMs },
  };
}
