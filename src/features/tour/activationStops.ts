import type { TourTargetId } from './tourSteps';
import { tourSteps } from './tourSteps';

/**
 * The first session, as stops.
 *
 * These continue the informational tour's numbering but are presented over the
 * live app rather than inside its Modal, because the user finishes most of them
 * on a real control and a Modal would swallow that tap.
 *
 * Adding a stop is one entry here plus a `useTourTarget` call on the element it
 * points at. The phase it names is what the flow advances to; the screen that
 * owns the control is what advances it, so a stop that never gets drawn still
 * cannot strand the user.
 */

/** the phases that put a stop on screen, in the order they are reached */
export type ActivationStopPhase = 'daily' | 'start' | 'result' | 'plan';

export type FirstSessionActivationPhase =
  | 'checking'
  | 'inactive'
  | 'queued'
  | ActivationStopPhase
  | 'running';

export interface ActivationStop {
  phase: ActivationStopPhase;
  /** the element Azo points at; registered with `useTourTarget` */
  target: TourTargetId;
  /** Azo's single line — he says one thing per stop */
  body: string;
  /**
   * `press-through` — the hole is live and the user completes the stop on the
   * real control underneath it.
   *
   * `dismiss` — nothing underneath is live; the stop is a message, and a tap
   * anywhere closes it. Only the last stop is one, so a dismissal ends the run.
   */
  interaction: 'press-through' | 'dismiss';
}

export const activationStops: readonly ActivationStop[] = [
  {
    phase: 'daily',
    target: 'firstDailyPlay',
    body: 'Let’s do your first personalized Reset. Tap play to start it.',
    interaction: 'press-through',
  },
  {
    phase: 'start',
    target: 'firstSessionStart',
    body: 'You’re ready. Tap Start and follow the breathing rhythm.',
    interaction: 'press-through',
  },
  {
    phase: 'result',
    target: 'resultDone',
    body: 'That’s your first Reset done. Tap here to get back to today’s plan.',
    interaction: 'press-through',
  },
  // Warm about the one they did, then straight to the next one. Coming back
  // tomorrow is the thing worth asking for, so it gets the last word.
  {
    phase: 'plan',
    target: 'dailies',
    body: 'Nice one! Finish the rest of today’s plan, then come back tomorrow.',
    interaction: 'dismiss',
  },
];

export const ACTIVATION_STOP_COUNT = activationStops.length;

/** the whole run: the informational stops, then these */
export const TOTAL_TOUR_STOPS = tourSteps.length + ACTIVATION_STOP_COUNT;

export function activationStopFor(
  phase: FirstSessionActivationPhase,
): ActivationStop | null {
  return activationStops.find((stop) => stop.phase === phase) ?? null;
}

/** where a stop sits in the whole run, for the counter */
export function activationStopNumber(stop: ActivationStop): number {
  return tourSteps.length + activationStops.indexOf(stop);
}
