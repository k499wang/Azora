import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { useWhileVisible } from '../../hooks/useWhileVisible';
import {
  useTimedCompletionSound,
  type TimedCompletionSound,
} from '../../hooks/useCompletionSound';
import { startUiTimer } from '../../lib/ui/uiThreadTimer';
import { triggerLightHaptic, triggerSuccessHaptic } from '../../native/tapHaptics';
import { savePlanPathSeen } from '../../services/preferences/planPathSeenPreference';
import { duration } from '../../theme/motion';
import {
  CELEBRATION_HOLD_MAX_MS,
  celebrationPhases,
  celebrationTarget,
  pathReached,
  pendingPathCelebration,
  seenAfterCelebration,
  seenAfterPhase,
  todayDay,
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
const REVEAL_ATTEMPTS = 3;
const REVEAL_RETRY_MS = duration.slow;

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

interface PlayingPhase {
  show: PathCelebrationShow;
  signal: AbortSignal;
  started: boolean;
  finish: (played: boolean) => void;
}

export interface PathCelebrationPlayback {
  show: PathCelebrationShow | null;
  /** From the moment a celebration commits until it ends, is left, or reaches the hold limit. */
  playing: boolean;
  onPhaseStarted: (show: PathCelebrationShow) => void;
  onPhaseFinished: (show: PathCelebrationShow) => void;
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
  const deadline = Date.now() + SOUND_WAIT_MS;
  while (Date.now() < deadline && !signal.aborted) {
    if (!sounds.some((sound) => sound.isLoading())) return;
    await uiDelay(Math.min(SOUND_POLL_MS, deadline - Date.now()), signal);
  }
}

/**
 * Stamps the newest finished day and wakes the next one, once each, when the
 * path comes into view. Until it plays, the path is drawn waiting: the stamp
 * not yet landed and the day not yet awake. Each part is recorded as it plays,
 * so leaving halfway plays the rest next time and never repeats a finished part.
 * Each phase waits for its rendered animation to finish. A node that cannot
 * be shown after retrying draws normally and keeps its celebration for later.
 * A celebration still running at the hold limit is cut to its end and saved.
 */
export function usePathCelebration({
  active,
  enrollmentId,
  seen,
  calendar,
  isPro,
  goldDays,
  reveal,
}: Options): PathCelebrationPlayback {
  const reducedMotion = useReducedMotion();
  const [running, setRunning] = useState<PathCelebrationShow | null>(null);
  const [waitingSuppressed, setWaitingSuppressed] = useState(false);
  const [holding, setHolding] = useState<AbortController | null>(null);
  const playing = useRef<PlayingPhase | null>(null);
  const stamp = useTimedCompletionSound('pathStamp');
  const gold = useTimedCompletionSound('pathGold');
  const unlock = useTimedCompletionSound('pathUnlock');
  // Read when a step plays, so a new player or a refetch never restarts a sequence.
  const latest = useRef({ seen, calendar, goldDays, reveal, stamp, gold, unlock });

  useEffect(() => {
    latest.current = { seen, calendar, goldDays, reveal, stamp, gold, unlock };
  }, [seen, calendar, goldDays, reveal, stamp, gold, unlock]);

  const onPhaseStarted = useCallback((show: PathCelebrationShow) => {
    const current = playing.current;
    if (current == null || current.show !== show || current.signal.aborted || current.started) return;
    current.started = true;
    if (show.phase === 'stampLand' && show.stampDay != null) {
      triggerSuccessHaptic();
      const { goldDays: golden, stamp: plain, gold: gilded } = latest.current;
      (golden.has(show.stampDay) ? gilded : plain).play();
    } else if (show.phase === 'wakePop') {
      triggerLightHaptic();
      latest.current.unlock.play();
    }
  }, []);

  const onPhaseFinished = useCallback((show: PathCelebrationShow) => {
    const current = playing.current;
    if (current?.show === show && current.started && !current.signal.aborted) current.finish(true);
  }, []);

  const { daysDone, opensTomorrow } = calendar;
  const today = todayDay(calendar);

  useWhileVisible(() => {
    if (!active) return () => {};
    setWaitingSuppressed(false);
    const { seen: record, calendar: current } = latest.current;
    const pending = pendingPathCelebration(record, current, isPro, reducedMotion);
    const phases = celebrationPhases(pending);
    const target = celebrationTarget(pending);
    if (phases.length === 0 || target == null || record == null) {
      savePlanPathSeen(enrollmentId, pathReached(current, isPro));
      return () => {};
    }

    const controller = new AbortController();
    const { signal } = controller;
    setHolding(controller);
    const cancelHoldLimit = startUiTimer(CELEBRATION_HOLD_MAX_MS, () => {
      savePlanPathSeen(enrollmentId, seenAfterCelebration(record, pending));
      controller.abort();
      setRunning(null);
    });
    const release = () => {
      cancelHoldLimit();
      setHolding((held) => (held === controller ? null : held));
    };

    const revealNode = async (day: number) => {
      for (let attempt = 0; attempt < REVEAL_ATTEMPTS && !signal.aborted; attempt += 1) {
        let shown = false;
        try {
          shown = await latest.current.reveal(day, signal);
        } catch {
          // A disappearing native view is retried just like an unsettled one.
        }
        if (signal.aborted) return false;
        if (shown) {
          await uiDelay(SETTLE_MS, signal);
          return !signal.aborted;
        }
        if (attempt + 1 < REVEAL_ATTEMPTS) await uiDelay(REVEAL_RETRY_MS, signal);
      }
      if (!signal.aborted) {
        setWaitingSuppressed(true);
        setRunning(null);
      }
      return false;
    };

    const playPhase = (show: PathCelebrationShow) => new Promise<boolean>((resolve) => {
      if (signal.aborted) {
        resolve(false);
        return;
      }
      const current: PlayingPhase = {
        show,
        signal,
        started: false,
        finish(played) {
          if (playing.current !== current) return;
          playing.current = null;
          signal.removeEventListener('abort', abort);
          resolve(played);
        },
      };
      const abort = () => current.finish(false);
      playing.current = current;
      signal.addEventListener('abort', abort, { once: true });
      setRunning(show);
    });

    void (async () => {
      const { stamp: plain, gold: gilded, unlock: woken } = latest.current;
      const [shown] = await Promise.all([
        revealNode(target),
        soundsLoaded([plain, gilded, woken], signal),
      ]);
      if (!shown || signal.aborted) return;
      let saved = record;
      let revealedDay = target;
      for (const phase of phases) {
        // A stamp and a wake can straddle a week divider. Reveal the wake's
        // own coin before drawing its trail or playing its pop.
        if ((phase === 'wakeTrail' || phase === 'wakePop') &&
            pending.wakeDay != null && revealedDay !== pending.wakeDay) {
          if (!await revealNode(pending.wakeDay)) return;
          revealedDay = pending.wakeDay;
        }
        if (!await playPhase({ ...pending, phase })) return;
        const next = seenAfterPhase(saved, pending, phase);
        if (next !== saved) savePlanPathSeen(enrollmentId, next);
        saved = next;
      }
      if (!signal.aborted) setRunning(null);
    })().finally(release);

    return () => {
      controller.abort();
      release();
      setRunning(null);
    };
  }, [active, enrollmentId, daysDone, opensTomorrow, today, isPro, reducedMotion]);

  const waiting = useMemo(() => {
    const pending = pendingPathCelebration(seen, calendar, isPro, reducedMotion);
    return celebrationTarget(pending) == null ? null : { ...pending, phase: null };
  }, [seen, calendar, isPro, reducedMotion]);

  return {
    show: running ?? (waitingSuppressed ? null : waiting),
    playing: holding != null,
    onPhaseStarted,
    onPhaseFinished,
  };
}
