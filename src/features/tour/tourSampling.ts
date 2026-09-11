import type { TourRect } from './tourGeometry';

/**
 * When a measurement can be believed.
 *
 * Nothing about a freshly mounted screen is still, and every way it moves looks
 * the same to a single `measureInWindow`: a tab mounting for the first time
 * measures zero-sized for a few frames, a screen sliding in from the right has
 * its full size and the wrong position for the length of the transition, and a
 * screen whose queries are still landing goes on resizing long after it first
 * painted. Taking the first rect with a size caught all three mid-flight, so
 * the same measurement has to come back several polls running before it counts.
 *
 * Split from `tourTargets` because this is the part with no view in it: given a
 * way to measure, it decides when the answer has stopped changing.
 */

/** enough polls to cover more than one render frame on a slow device */
export const REQUIRED_STABLE_SAMPLES = 4;

export interface Sample {
  /** the last rect seen, which is the settled one when `stable` */
  rect: TourRect | null;
  /** whether it held still long enough to be believed */
  stable: boolean;
}

export interface SampleOptions {
  /** longest to keep polling before giving up */
  timeoutMs: number;
  /** time between polls */
  pollMs: number;
  /**
   * How long to wait before the first poll. Native scrolling takes a moment to
   * begin, and without this a scroll that has not started yet reads as one that
   * has already finished.
   */
  graceMs?: number;
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Whether two measurements are the same place.
 *
 * All four edges, not just the vertical ones: a pushed screen slides in
 * horizontally, so a target that only ever moves in x would otherwise count as
 * having come to rest while it was still halfway across the screen.
 */
export function isSamePosition(a: TourRect, b: TourRect): boolean {
  return (
    Math.abs(a.x - b.x) < 0.5 &&
    Math.abs(a.y - b.y) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

/** Polls until the measurement stops changing, or the deadline passes. */
export async function sampleUntilStable(
  measure: () => Promise<TourRect | null>,
  { timeoutMs, pollMs, graceMs = 0 }: SampleOptions,
): Promise<Sample> {
  const deadline = Date.now() + timeoutMs;
  let previous: TourRect | null = null;
  let stableSamples = 0;

  if (graceMs > 0) await wait(Math.min(graceMs, timeoutMs));

  for (;;) {
    const rect = await measure();
    if (rect == null) {
      // An element that went away has not held still; it has stopped existing.
      previous = null;
      stableSamples = 0;
    } else {
      stableSamples =
        previous != null && isSamePosition(rect, previous) ? stableSamples + 1 : 1;
      previous = rect;
      if (stableSamples >= REQUIRED_STABLE_SAMPLES) return { rect, stable: true };
    }
    if (Date.now() >= deadline) return { rect: previous, stable: false };
    await wait(pollMs);
  }
}

/**
 * Reports every move of an element that has already been placed.
 *
 * The screen underneath keeps working while the overlay covers it, and a shift
 * in anything *above* the element moves it without changing its own layout —
 * its position inside its own parent is unchanged — so there is no layout event
 * to listen for. Polling the window position sees all of it.
 */
export function trackMovement(
  measure: () => Promise<TourRect | null>,
  from: TourRect,
  onMove: (rect: TourRect | null) => void,
  pollMs: number,
): () => void {
  let stopped = false;
  let last: TourRect | null = from;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const poll = async () => {
    const rect = await measure();
    if (stopped) return;

    const moved =
      rect == null ? last != null : last == null || !isSamePosition(rect, last);
    last = rect;
    if (moved) onMove(rect);
    if (!stopped) timer = setTimeout(() => void poll(), pollMs);
  };

  timer = setTimeout(() => void poll(), pollMs);

  return () => {
    stopped = true;
    if (timer != null) clearTimeout(timer);
  };
}
