import { create } from 'zustand';
import {
  setFirstSessionActivation,
  setTourSeen,
} from '../../services/preferences/tourSeenPreference';
import {
  ACTIVATION_STOP_COUNT,
  type FirstSessionActivationPhase,
} from './activationStops';
import { useTourCelebrationStore } from './tourCelebrationStore';
import { useTourStore } from './tourStore';

export type { FirstSessionActivationPhase };

/**
 * The first session, as a state machine.
 *
 * Every hop is driven by the screen that owns the control the user pressed, not
 * by the overlay that points at it. A stop that cannot be drawn therefore costs
 * the user a coach mark, never the flow.
 *
 * `running` is the session itself and puts nothing on screen. Only
 * `completePersistence` touches the durable flag: once it has cleared, the
 * remaining stops are in-memory decoration and nothing replays on relaunch.
 */
interface FirstSessionActivationState {
  phase: FirstSessionActivationPhase;
  userId: string | null;
  techniqueId: string | null;
  /**
   * Whether these stops continue a tour the user is actually seeing. A user who
   * has already had the tour gets the coach marks on their own, and numbering
   * them "5 of 8" would count four stops they never saw.
   */
  followsTour: boolean;
  /**
   * True while the screen the user pressed on is still closing over the next
   * stop's target. The stop is measured and scrolled to underneath in the
   * meantime, and drawn the moment the screen above it is gone — so the hand
   * over costs a transition rather than a transition plus a measurement.
   */
  heldForTransition: boolean;
  beginCheck: (userId: string | null) => void;
  hydrate: (
    userId: string | null,
    techniqueId: string | null,
    tourSeen: boolean,
  ) => void;
  prepareQueued: (userId: string, techniqueId: string) => Promise<void>;
  promoteQueued: () => void;
  dailyPressed: () => void;
  startPressed: () => void;
  /** clears the durable flag, then waits for the result screen to arrive */
  completePersistence: () => Promise<void>;
  /** the result screen, settled and with nothing celebrating over it */
  resultReady: () => void;
  resultPressed: () => void;
  /** the screen that was covering the plan stop has finished closing */
  revealHeldStop: () => void;
  finish: () => void;
  /**
   * The user's own way out. Clears the durable flag like a completed run does,
   * because someone who skipped the first Reset should not be walked through it
   * again on the next launch.
   *
   * The phase moves synchronously: the guard that stops the session screen
   * being dismissed reads it, and the write it fires off must not be in the way
   * of the user leaving.
   */
  skip: () => void;
  /**
   * Stands the stops down without touching the durable flag. For a stop that
   * can never be placed — the element it points at is missing — so the run does
   * not sit there holding back everything that waits for it to end.
   */
  abandon: () => void;
}

const STOOD_DOWN = {
  phase: 'inactive',
  techniqueId: null,
  followsTour: false,
  heldForTransition: false,
} as const;

let activationGeneration = 0;

export const useFirstSessionActivationStore =
  create<FirstSessionActivationState>((set, get) => ({
    phase: 'checking',
    userId: null,
    techniqueId: null,
    followsTour: false,
    heldForTransition: false,
    beginCheck: (userId) => {
      // Readiness changes and remounts must not restart this account's live run.
      if (get().userId === userId) return;
      activationGeneration += 1;
      set({ ...STOOD_DOWN, phase: 'checking', userId });
    },
    hydrate: (userId, techniqueId, tourSeen) => {
      if (get().userId !== userId || get().phase !== 'checking') return;
      set({
        phase: techniqueId == null ? 'inactive' : tourSeen ? 'daily' : 'queued',
        userId,
        techniqueId,
        followsTour: !tourSeen,
      });
    },
    prepareQueued: async (userId, techniqueId) => {
      const generation = ++activationGeneration;
      await setFirstSessionActivation(userId, techniqueId);
      if (generation !== activationGeneration) return;
      set({ phase: 'queued', userId, techniqueId, followsTour: true });
    },
    promoteQueued: () => {
      if (get().phase === 'queued') set({ phase: 'daily' });
    },
    dailyPressed: () => {
      if (get().phase === 'daily') set({ phase: 'start' });
    },
    startPressed: () => {
      if (get().phase === 'start') set({ phase: 'running' });
    },
    completePersistence: async () => {
      const userId = get().userId;
      if (userId == null || get().phase !== 'running') return;
      const generation = activationGeneration;
      await setFirstSessionActivation(userId, null);
      if (generation !== activationGeneration || get().phase !== 'running') return;
      set({ phase: 'completing', techniqueId: null });
    },
    resultReady: () => {
      if (get().phase === 'completing') set({ phase: 'result' });
    },
    resultPressed: () => {
      if (get().phase === 'result') set({ phase: 'plan', heldForTransition: true });
    },
    revealHeldStop: () => set({ heldForTransition: false }),
    finish: () => {
      activationGeneration += 1;
      set(STOOD_DOWN);
      useTourCelebrationStore.getState().celebrate();
    },
    skip: () => {
      const userId = get().userId;
      activationGeneration += 1;
      set(STOOD_DOWN);
      if (userId != null) void setFirstSessionActivation(userId, null);
    },
    abandon: () => {
      activationGeneration += 1;
      set(STOOD_DOWN);
    },
  }));

/**
 * How many stops the pending first session adds to the tour's counter. Zero
 * once there is nothing pending, so a tour with no first session behind it
 * still counts itself correctly.
 */
export function activationStopCount(
  phase: FirstSessionActivationPhase,
  followsTour: boolean,
): number {
  if (!followsTour) return 0;
  return phase === 'checking' || phase === 'inactive' ? 0 : ACTIVATION_STOP_COUNT;
}

/**
 * Dev only: open the run at its last two stops, so the copy and placement after
 * the session can be looked at without sitting through the session first.
 *
 * Deliberately leaves the durable flag alone. A preview must not decide whether
 * this account's real first Reset has happened, so a pending one still plays on
 * the next launch. The caller navigates to the result screen, and pressing its
 * close button walks on to the plan stop exactly as the real run does.
 */
export function previewFirstSessionEnding(userId: string): void {
  useTourStore.getState().dismiss();
  useFirstSessionActivationStore.setState({
    phase: 'completing',
    userId,
    techniqueId: null,
    followsTour: true,
    heldForTransition: false,
  });
}

export async function replayFullFirstSessionFlow(
  userId: string,
  techniqueId: string,
): Promise<void> {
  useTourStore.getState().prepare();
  await Promise.all([
    setTourSeen(false),
    useFirstSessionActivationStore.getState().prepareQueued(userId, techniqueId),
  ]);
  useTourStore.getState().start();
}
