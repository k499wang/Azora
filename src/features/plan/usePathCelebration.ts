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
  todayDay,
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
 * path comes back into view. Each part is recorded as it plays, so leaving
 * halfway plays the rest next time and never repeats a part already seen.
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
  const latest = useRef({ calendar, goldDays, onReveal, playStamp, playGold, playUnlock });

  useEffect(() => {
    latest.current = { calendar, goldDays, onReveal, playStamp, playGold, playUnlock };
  }, [calendar, goldDays, onReveal, playStamp, playGold, playUnlock]);

  const { daysDone, opensTomorrow } = calendar;
  const today = todayDay(calendar);

  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;
    let cancelTimer = () => {};

    void loadPlanPathSeen(enrollmentId).then((seen) => {
      if (cancelled) return;
      const current = latest.current.calendar;
      if (seen == null || reducedMotion) {
        savePlanPathSeen(enrollmentId, pathReached(current, isPro));
        return;
      }

      const pending = pathCelebration(seen, current, isPro);
      const steps = celebrationSteps(pending);
      if (steps.length === 0) {
        savePlanPathSeen(enrollmentId, pathReached(current, isPro));
        return;
      }
      latest.current.onReveal?.();

      let record = seen;
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
          record = { ...record, stampedDay: pending.stampDay };
          savePlanPathSeen(enrollmentId, record);
        } else if (step.phase === 'wakePop' && pending.wakeDay != null) {
          triggerLightHaptic();
          unlock();
          record = { ...record, wokenDay: pending.wakeDay };
          savePlanPathSeen(enrollmentId, record);
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
  }, [active, enrollmentId, daysDone, opensTomorrow, today, isPro, reducedMotion]);

  return beat;
}
