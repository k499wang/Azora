import { create } from 'zustand';
import { setTourSeen } from '../../services/preferences/tourSeenPreference';
import { tourSteps } from './tourSteps';

/**
 * Lifecycle: checking the saved flag → running steps → closing the overlay →
 * finished. Post-tour presenters wait for the final state.
 */
export type TourStatus = 'checking' | 'running' | 'closing' | 'finished';

interface TourState {
  status: TourStatus;
  /** null when no stop is showing */
  stepIndex: number | null;
  /**
   * Set only by walking past the last stop, and cleared by reading it. Skipping
   * and aborting both end the tour without earning the celebration.
   */
  completed: boolean;
  /** resets in-memory lifecycle state before a newly completed onboarding */
  prepare: () => void;
  start: () => void;
  next: () => void;
  /** remembers finishing or skipping, then starts the overlay close */
  stop: (completed?: boolean) => Promise<void>;
  /** true once for a run that reached the end; reading it clears it */
  consumeCompletion: () => boolean;
  /**
   * Stands a running tour down *without* marking it seen, so it plays again on
   * the next launch. For the case where a stop cannot be placed: advancing past
   * it walks the tour to its end and calls `stop`, which marks the whole thing
   * seen — one unmeasurable element and the user never gets a tour at all.
   */
  abort: () => void;
  /** releases post-tour presenters after the native overlay has closed */
  completeClosing: () => void;
  /** stands the tour down without marking it seen, when it has run before */
  dismiss: () => void;
}

let lifecycleGeneration = 0;
let stopPromise: Promise<void> | null = null;

export const useTourStore = create<TourState>((set, get) => ({
  status: 'checking',
  stepIndex: null,
  completed: false,
  prepare: () => {
    lifecycleGeneration += 1;
    stopPromise = null;
    set({ status: 'checking', stepIndex: null, completed: false });
  },
  start: () => {
    lifecycleGeneration += 1;
    stopPromise = null;
    set({ status: 'running', stepIndex: 0, completed: false });
  },
  next: () => {
    if (stopPromise != null) return;
    const current = get().stepIndex;
    if (current == null) return;
    if (current + 1 >= tourSteps.length) {
      void get().stop(true);
      return;
    }
    set({ stepIndex: current + 1 });
  },
  stop: (completed = false) => {
    if (stopPromise != null) return stopPromise;
    if (get().status !== 'running') return Promise.resolve();

    const stoppingGeneration = lifecycleGeneration;
    const pending = setTourSeen(true).then(() => {
      if (lifecycleGeneration === stoppingGeneration) {
        set({ status: 'closing', stepIndex: null, completed });
      }
    });
    stopPromise = pending;
    void pending.finally(() => {
      if (stopPromise === pending) stopPromise = null;
    });
    return pending;
  },
  consumeCompletion: () => {
    if (!get().completed) return false;
    set({ completed: false });
    return true;
  },
  abort: () => {
    if (stopPromise != null) return;
    if (get().status !== 'running') return;
    lifecycleGeneration += 1;
    set({ status: 'closing', stepIndex: null, completed: false });
  },
  completeClosing: () => {
    if (get().status !== 'closing') return;
    set({ status: 'finished', stepIndex: null });
  },
  dismiss: () => {
    lifecycleGeneration += 1;
    stopPromise = null;
    set({ status: 'finished', stepIndex: null, completed: false });
  },
}));

export function useCurrentTourStep() {
  const stepIndex = useTourStore((state) => state.stepIndex);
  return stepIndex == null ? null : tourSteps[stepIndex];
}

export function canPresentAfterTour(
  enabled: boolean,
  hasResolvedSeenFlag: boolean,
  status: TourStatus,
): boolean {
  return enabled && hasResolvedSeenFlag && status === 'finished';
}
