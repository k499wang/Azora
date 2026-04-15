import type { BrightnessSample, FingerPlacementState } from './types';

interface ClassifyState {
  previousState?: FingerPlacementState;
  goodSinceMs?: number;
}

// Module-level state for tracking 'lost' transitions
let _previousState: FingerPlacementState | undefined = undefined;
let _goodSinceMs: number | undefined = undefined;

/**
 * Classifies signal quality into FingerPlacementState based on recent brightness samples.
 *
 * Rules:
 * - no_finger: mean brightness > 180 (too bright, no finger covering)
 * - too_much_pressure: mean < 20 OR (mean < 50 AND variance < 5)
 * - partial: mean in 50-180 AND variance < 15
 * - good: mean in 20-150 AND variance >= 15
 * - lost: was 'good' but not 'good' for > 1000ms
 */
export function classifyFingerPlacement(
  samples: BrightnessSample[],
  windowMs: number = 1000,
): FingerPlacementState {
  if (samples.length === 0) {
    _previousState = 'no_finger';
    _goodSinceMs = undefined;
    return 'no_finger';
  }

  const now = samples[samples.length - 1].timestamp;
  const cutoff = now - windowMs;
  const recent = samples.filter((s) => s.timestamp >= cutoff);

  if (recent.length === 0) {
    _previousState = 'no_finger';
    _goodSinceMs = undefined;
    return 'no_finger';
  }

  const mean = recent.reduce((sum, s) => sum + s.value, 0) / recent.length;
  const variance =
    recent.reduce((sum, s) => sum + Math.pow(s.value - mean, 2), 0) / recent.length;

  let currentState: FingerPlacementState;

  if (mean > 180) {
    currentState = 'no_finger';
  } else if (mean < 20 || (mean < 50 && variance < 5)) {
    currentState = 'too_much_pressure';
  } else if (mean >= 20 && mean <= 150 && variance >= 15) {
    currentState = 'good';
  } else if (mean >= 50 && mean <= 180 && variance < 15) {
    currentState = 'partial';
  } else {
    // Fallback for edge cases not covered above
    currentState = 'partial';
  }

  // Check for 'lost': was good but no longer good for > 1000ms
  if (currentState === 'good') {
    if (_goodSinceMs == null) {
      _goodSinceMs = now;
    }
  } else {
    if (_previousState === 'good' && _goodSinceMs != null) {
      const notGoodDuration = now - (_goodSinceMs + windowMs);
      if (notGoodDuration > 1000) {
        _previousState = 'lost';
        _goodSinceMs = undefined;
        return 'lost';
      }
    } else {
      _goodSinceMs = undefined;
    }
  }

  _previousState = currentState;
  return currentState;
}

/**
 * Stateless version that accepts explicit previous state tracking.
 * Use this when you want to manage state externally.
 */
export function classifyFingerPlacementStateless(
  samples: BrightnessSample[],
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
  const recent = samples.filter((s) => s.timestamp >= cutoff);

  if (recent.length === 0) {
    return {
      placement: 'no_finger',
      state: { previousState: 'no_finger', goodSinceMs: undefined },
    };
  }

  const mean = recent.reduce((sum, s) => sum + s.value, 0) / recent.length;
  const variance =
    recent.reduce((sum, s) => sum + Math.pow(s.value - mean, 2), 0) / recent.length;

  let currentState: FingerPlacementState;

  if (mean > 180) {
    currentState = 'no_finger';
  } else if (mean < 20 || (mean < 50 && variance < 5)) {
    currentState = 'too_much_pressure';
  } else if (mean >= 20 && mean <= 150 && variance >= 15) {
    currentState = 'good';
  } else if (mean >= 50 && mean <= 180 && variance < 15) {
    currentState = 'partial';
  } else {
    currentState = 'partial';
  }

  let newGoodSinceMs = state.goodSinceMs;
  let placement: FingerPlacementState = currentState;

  if (currentState === 'good') {
    if (newGoodSinceMs == null) {
      newGoodSinceMs = now;
    }
  } else {
    if (state.previousState === 'good' && newGoodSinceMs != null) {
      const notGoodDuration = now - (newGoodSinceMs + windowMs);
      if (notGoodDuration > 1000) {
        placement = 'lost';
        newGoodSinceMs = undefined;
      }
    } else {
      newGoodSinceMs = undefined;
    }
  }

  return {
    placement,
    state: { previousState: placement, goodSinceMs: newGoodSinceMs },
  };
}
