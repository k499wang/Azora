import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { useCompletionSound } from '../../hooks/useCompletionSound';
import { startUiTimer } from '../../lib/ui/uiThreadTimer';
import { triggerLightHaptic, triggerSuccessHaptic } from '../../native/tapHaptics';
import {
  loadPlanPathSeen,
  savePlanPathSeen,
} from '../../services/preferences/planPathSeenPreference';
import { duration } from '../../theme/motion';
import {
  pathCelebration,
  pathReached,
  type PathCelebration,
} from './domain/pathCelebration';
import type { PlanCalendar } from './domain/planCalendar';

export type PathCelebrationPhase =
  | 'stampWait'
  | 'stampRise'
  | 'stampLand'
  | 'wakeWait'
  | 'wakeTrail'
  | 'wakePop';

export interface PathCelebrationBeat {
  phase: PathCelebrationPhase;
  stampDay: number | null;
  wakeDay: number | null;
}

/** How long the trail into a waking day takes to light up. */
export const PATH_WAKE_TRAIL_MS = duration.slower;
/** Long enough for the scroll that brings the node into view to land first. */
const LEAD_MS = duration.slower;

interface Step {
  phase: PathCelebrationPhase;
  ms: number;
}

function celebrationSteps({ stampDay, wakeDay, wakeTrail }: PathCelebration): Step[] {
  const steps: Step[] = [];
  if (stampDay != null) {
    steps.push(
      { phase: 'stampWait', ms: LEAD_MS },
      { phase: 'stampRise', ms: duration.fast },
      { phase: 'stampLand', ms: duration.slower },
    );
  }
  if (wakeDay != null) {
    if (stampDay == null) steps.push({ phase: 'wakeWait', ms: LEAD_MS });
    if (wakeTrail) steps.push({ phase: 'wakeTrail', ms: PATH_WAKE_TRAIL_MS });
    steps.push({ phase: 'wakePop', ms: duration.slow });
  }
  return steps;
}

interface Options {
  /** The path is on screen and everything the celebration draws has loaded. */
  active: boolean;
  enrollmentId: string;
  calendar: PlanCalendar;
  isPro: boolean;
  goldDays: ReadonlySet<number>;
  /** Brings the current node on screen before anything plays. */
  onReveal?: () => void;
}

/**
 * Stamps the newest finished day and wakes the next one, once each, when the
 * path comes back into view. The record is written as the sequence starts, so
 * leaving halfway shows the end state rather than playing it again.
 */
export function usePathCelebration({
  active,
  enrollmentId,
  calendar,
  isPro,
  goldDays,
  onReveal,
}: Options): PathCelebrationBeat | null {
  const reducedMotion = useReducedMotion();
  const [beat, setBeat] = useState<PathCelebrationBeat | null>(null);
  const playStamp = useCompletionSound('pathStamp');
  const playGold = useCompletionSound('pathGold');
  const playUnlock = useCompletionSound('pathUnlock');
  // Read when a step plays, so a new player or a refetch never restarts a sequence.
  const latest = useRef({ goldDays, onReveal, playStamp, playGold, playUnlock });

  useEffect(() => {
    latest.current = { goldDays, onReveal, playStamp, playGold, playUnlock };
  }, [goldDays, onReveal, playStamp, playGold, playUnlock]);

  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;
    let cancelTimer = () => {};

    void loadPlanPathSeen(enrollmentId).then((seen) => {
      if (cancelled) return;
      savePlanPathSeen(enrollmentId, pathReached(calendar));
      if (seen == null || reducedMotion) return;

      const pending = pathCelebration(seen, calendar, isPro);
      const steps = celebrationSteps(pending);
      if (steps.length === 0) return;
      latest.current.onReveal?.();

      const run = (index: number) => {
        const step = steps[index];
        if (step == null) {
          setBeat(null);
          return;
        }
        setBeat({ phase: step.phase, stampDay: pending.stampDay, wakeDay: pending.wakeDay });
        const { goldDays: gold, playStamp: stamp, playGold: stampGold, playUnlock: unlock } =
          latest.current;
        if (step.phase === 'stampLand' && pending.stampDay != null) {
          triggerSuccessHaptic();
          (gold.has(pending.stampDay) ? stampGold : stamp)();
        } else if (step.phase === 'wakePop') {
          triggerLightHaptic();
          unlock();
        }
        cancelTimer = startUiTimer(step.ms, () => run(index + 1));
      };
      run(0);
    });

    return () => {
      cancelled = true;
      cancelTimer();
      setBeat(null);
    };
  }, [active, enrollmentId, calendar, isPro, reducedMotion]);

  return beat;
}
