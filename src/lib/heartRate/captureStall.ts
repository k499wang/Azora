import type { FingerPlacementState, SignalStatus } from './types';

/**
 * How long the camera check may run without ever confirming a pulse before the
 * help sheet takes over. Long enough for an ordinary fumble to resolve itself,
 * short enough that nobody sits there guessing.
 */
export const HEART_RATE_STALL_DELAY_MS = 20_000;

export type HeartRateStallIssue =
  | 'no_finger'
  | 'partial_coverage'
  | 'too_much_pressure'
  | 'motion'
  | 'no_pulse';

export interface HeartRateStallSample {
  /** `null` covers warm-up and clean-but-silent frames, which diagnose nothing. */
  readonly issue: HeartRateStallIssue | null;
  readonly atMs: number;
}

/**
 * A window that never produced a classifiable fault is the weak-perfusion case:
 * placement looks right and no pulse ever shows up.
 */
const FALLBACK_ISSUE: HeartRateStallIssue = 'no_pulse';

/** Resolves ties toward the fault whose fix is most likely to unblock the read. */
const ISSUE_PRIORITY: readonly HeartRateStallIssue[] = [
  'no_finger',
  'partial_coverage',
  'too_much_pressure',
  'motion',
  'no_pulse',
];

export function classifyStallIssue(
  fingerPlacement: FingerPlacementState,
  signalStatus: SignalStatus,
): HeartRateStallIssue | null {
  if (
    fingerPlacement === 'no_finger' ||
    fingerPlacement === 'lost' ||
    signalStatus === 'no_finger' ||
    signalStatus === 'signal_lost'
  ) {
    return 'no_finger';
  }
  if (fingerPlacement === 'partial' || signalStatus === 'partial_coverage') {
    return 'partial_coverage';
  }
  if (
    fingerPlacement === 'too_much_pressure' ||
    signalStatus === 'too_much_pressure'
  ) {
    return 'too_much_pressure';
  }
  if (signalStatus === 'excessive_motion') {
    return 'motion';
  }
  if (signalStatus === 'no_pulse') {
    return 'no_pulse';
  }
  return null;
}

/**
 * Picks the fault that held for the longest across the stalled window, so a
 * single flicker of a different state can't hijack the advice.
 */
export function dominantStallIssue(
  samples: readonly HeartRateStallSample[],
  endMs: number,
): HeartRateStallIssue {
  const durations = new Map<HeartRateStallIssue, number>();

  samples.forEach((sample, index) => {
    if (sample.issue == null) return;
    const until = samples[index + 1]?.atMs ?? endMs;
    const elapsed = until - sample.atMs;
    if (elapsed <= 0) return;
    durations.set(sample.issue, (durations.get(sample.issue) ?? 0) + elapsed);
  });

  let winner: HeartRateStallIssue | null = null;
  let longest = 0;
  for (const issue of ISSUE_PRIORITY) {
    const elapsed = durations.get(issue) ?? 0;
    if (elapsed > longest) {
      longest = elapsed;
      winner = issue;
    }
  }

  return winner ?? FALLBACK_ISSUE;
}
