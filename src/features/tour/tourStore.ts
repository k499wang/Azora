import { create } from 'zustand';
import { setTourSeen } from '../../services/preferences/tourSeenPreference';
import { tourSteps } from './tourSteps';

/**
 * `checking` covers the gap while the seen flag loads. Anything that waits for
 * the tour must treat it as "not finished yet", or a one-time offer would slide
 * up over the first stop.
 */
export type TourStatus = 'checking' | 'running' | 'finished';

interface TourState {
  status: TourStatus;
  /** null when no stop is showing */
  stepIndex: number | null;
  /** resets in-memory lifecycle state before a newly completed onboarding */
  prepare: () => void;
  start: () => void;
  next: () => void;
  /** ends the tour and remembers it, for both finishing and skipping */
  stop: () => Promise<void>;
  /** stands the tour down without marking it seen, when it has run before */
  dismiss: () => void;
}

let lifecycleGeneration = 0;
let stopPromise: Promise<void> | null = null;

export const useTourStore = create<TourState>((set, get) => ({
  status: 'checking',
  stepIndex: null,
  prepare: () => {
    lifecycleGeneration += 1;
    stopPromise = null;
    set({ status: 'checking', stepIndex: null });
  },
  start: () => {
    lifecycleGeneration += 1;
    stopPromise = null;
    set({ status: 'running', stepIndex: 0 });
  },
  next: () => {
    const current = get().stepIndex;
    if (current == null) return;
    if (current + 1 >= tourSteps.length) {
      void get().stop();
      return;
    }
    set({ stepIndex: current + 1 });
  },
  stop: () => {
    if (stopPromise != null) return stopPromise;

    const stoppingGeneration = lifecycleGeneration;
    const pending = setTourSeen(true).then(() => {
      if (lifecycleGeneration === stoppingGeneration) {
        set({ status: 'finished', stepIndex: null });
      }
    });
    stopPromise = pending;
    void pending.finally(() => {
      if (stopPromise === pending) stopPromise = null;
    });
    return pending;
  },
  dismiss: () => {
    lifecycleGeneration += 1;
    stopPromise = null;
    set({ status: 'finished', stepIndex: null });
  },
}));

export function useCurrentTourStep() {
  const stepIndex = useTourStore((state) => state.stepIndex);
  return stepIndex == null ? null : tourSteps[stepIndex];
}

/** true once the tour has run, been skipped, or been found unnecessary */
export function useIsTourFinished() {
  return useTourStore((state) => state.status === 'finished');
}
