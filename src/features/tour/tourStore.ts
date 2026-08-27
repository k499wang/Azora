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
  /** resets in-memory lifecycle state before a newly completed onboarding */
  prepare: () => void;
  start: () => void;
  next: () => void;
  /** remembers finishing or skipping, then starts the overlay close */
  stop: () => Promise<void>;
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
    if (stopPromise != null) return;
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
    if (get().status !== 'running') return Promise.resolve();

    const stoppingGeneration = lifecycleGeneration;
    const pending = setTourSeen(true).then(() => {
      if (lifecycleGeneration === stoppingGeneration) {
        set({ status: 'closing', stepIndex: null });
      }
    });
    stopPromise = pending;
    void pending.finally(() => {
      if (stopPromise === pending) stopPromise = null;
    });
    return pending;
  },
  completeClosing: () => {
    if (get().status !== 'closing') return;
    set({ status: 'finished', stepIndex: null });
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

export function canPresentAfterTour(
  enabled: boolean,
  hasResolvedSeenFlag: boolean,
  status: TourStatus,
): boolean {
  return enabled && hasResolvedSeenFlag && status === 'finished';
}
