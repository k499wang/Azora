import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import {
  useTimedCompletionSound,
  type TimedCompletionSound,
} from '../../hooks/useCompletionSound';
import { startUiTimer } from '../../lib/ui/uiThreadTimer';
import { triggerLightHaptic, triggerSuccessHaptic } from '../../native/tapHaptics';
import { savePlanPathSeen } from '../../services/preferences/planPathSeenPreference';
import { duration } from '../../theme/motion';
import {
  celebrationPhases,
  celebrationTarget,
  pathReached,
  pendingPathCelebration,
  seenAfterPhase,
  todayDay,
  type PathCelebrationPhase,
  type PathCelebrationShow,
  type PathSeen,
} from './domain/pathCelebration';
import type { PlanCalendar } from './domain/planCalendar';

/** How long the trail into a waking day takes to light up. */
export const PATH_WAKE_TRAIL_MS = duration.slower;
/** A beat for the eye to take in the node at rest before it moves. */
const SETTLE_MS = duration.base;
/** Longest a cue may load before the celebration plays without it. */
const SOUND_WAIT_MS = 1000;
const SOUND_POLL_MS = 50;

const PHASE_MS: Record<PathCelebrationPhase, number> = {
  stampRise: duration.fast,
  stampLand: duration.slower,
  wakeTrail: PATH_WAKE_TRAIL_MS,
  wakePop: duration.slow,
};

/** Brings a day's node wholly into view and holds until it is still; false when it could not. */
export type RevealDay = (day: number, signal: AbortSignal) => Promise<boolean>;

interface Options {
  /** The path is drawn, on screen and uncovered. */
  active: boolean;
  enrollmentId: string;
  /** What the path last saw, already read. */
  seen: PathSeen | null;
  calendar: PlanCalendar;
  isPro: boolean;
  goldDays: ReadonlySet<number>;
  reveal: RevealDay;
}

function uiDelay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const cancel = startUiTimer(ms, finish);
    function finish() {
      cancel();
      signal.removeEventListener('abort', finish);
      resolve();
    }
    signal.addEventListener('abort', finish, { once: true });
  });
}

async function soundsLoaded(sounds: TimedCompletionSound[], signal: AbortSignal) {
  for (let waited = 0; waited < SOUND_WAIT_MS && !signal.aborted; waited += SOUND_POLL_MS) {
    if (!sounds.some((sound) => sound.isLoading())) return;
    await uiDelay(SOUND_POLL_MS, signal);
  }
}

/**
 * Stamps the newest finished day and wakes the next one, once each, when the
 * path comes into view. Until it plays, the path is drawn waiting: the stamp
 * not yet landed and the day not yet awake. Each part is recorded as it plays,
 * so leaving halfway plays the rest next time and never repeats a part seen.
 * A node that cannot be shown plays nothing and records nothing.
 */
export function usePathCelebration({
  active,
  enrollmentId,
  seen,
  calendar,
  isPro,
  goldDays,
  reveal,
}: Options): PathCelebrationShow | null {
  const reducedMotion = useReducedMotion();
  const [running, setRunning] = useState<PathCelebrationShow | null>(null);
  const stamp = useTimedCompletionSound('pathStamp');
  const gold = useTimedCompletionSound('pathGold');
  const unlock = useTimedCompletionSound('pathUnlock');
  // Read when a step plays, so a new player or a refetch never restarts a sequence.
  const latest = useRef({ seen, calendar, goldDays, reveal, stamp, gold, unlock });

  useEffect(() => {
    latest.current = { seen, calendar, goldDays, reveal, stamp, gold, unlock };
  }, [seen, calendar, goldDays, reveal, stamp, gold, unlock]);

  const { daysDone, opensTomorrow } = calendar;
  const today = todayDay(calendar);

  useEffect(() => {
    if (!active) return undefined;
    const { seen: record, calendar: current } = latest.current;
    const pending = pendingPathCelebration(record, current, isPro, reducedMotion);
    const phases = celebrationPhases(pending);
    const target = celebrationTarget(pending);
    if (phases.length === 0 || target == null) {
      savePlanPathSeen(enrollmentId, pathReached(current, isPro));
      return undefined;
    }

    const controller = new AbortController();
    const { signal } = controller;
    let cancelTimer = () => {};

    const run = (index: number, saved: PathSeen) => {
      const phase = phases[index];
      if (phase == null) {
        setRunning(null);
        return;
      }
      setRunning({ ...pending, phase });
      if (phase === 'stampLand' && pending.stampDay != null) {
        const { goldDays: golden, stamp: plain, gold: gilded } = latest.current;
        triggerSuccessHaptic();
        (golden.has(pending.stampDay) ? gilded : plain).play();
      } else if (phase === 'wakePop') {
        triggerLightHaptic();
        latest.current.unlock.play();
      }
      const next = seenAfterPhase(saved, pending, phase);
      if (next !== saved) savePlanPathSeen(enrollmentId, next);
      cancelTimer = startUiTimer(PHASE_MS[phase], () => run(index + 1, next));
    };

    void (async () => {
      const { stamp: plain, gold: gilded, unlock: woken } = latest.current;
      const [shown] = await Promise.all([
        latest.current.reveal(target, signal),
        soundsLoaded([plain, gilded, woken], signal),
      ]);
      if (!shown || signal.aborted) return;
      await uiDelay(SETTLE_MS, signal);
      if (signal.aborted || record == null) return;
      run(0, record);
    })();

    return () => {
      controller.abort();
      cancelTimer();
      setRunning(null);
    };
  }, [active, enrollmentId, daysDone, opensTomorrow, today, isPro, reducedMotion]);

  const waiting = useMemo(() => {
    const pending = pendingPathCelebration(seen, calendar, isPro, reducedMotion);
    return celebrationTarget(pending) == null ? null : { ...pending, phase: null };
  }, [seen, calendar, isPro, reducedMotion]);

  return running ?? waiting;
}
