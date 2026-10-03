import { useCallback, useMemo, useRef, useState } from 'react';
import { useWhileVisible } from '../../hooks/useWhileVisible';
import { traceTick } from '../../lib/debug/tickTrace';

type Phase = 'holding' | 'leaving';

const NONE: ReadonlyMap<string, Phase> = new Map();

interface Options {
  /** how long the list stays put after the last tick, showing it */
  holdMs: number;
  /** how long ticked goals then have to fade out where they stand, if filed */
  leaveMs: number;
}

/**
 * Goals just ticked, still settling where they were ticked.
 *
 * They settle as a group. Every tick restarts one shared hold, so a run of
 * ticks leaves the whole list exactly where it is until the run stops — the
 * next to-do never slides out from under the finger reaching for it — and
 * then they all leave together: one fade, one gap closing, one render each,
 * instead of a reflow per card landing in the middle of the next card's tick.
 *
 * A card that is going into the drawer fades out during the leaving phase
 * while the list closes up over its slot, and is unmounted once that has
 * finished. Leaving runs on its own clock: once a group starts, it finishes
 * exactly `leaveMs` later whatever is tapped in the meantime, so a card never
 * hangs half-gone behind the next run of ticks.
 */
export function useSettlingGoals({ holdMs, leaveMs }: Options) {
  const [phases, setPhases] = useState<ReadonlyMap<string, Phase>>(NONE);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimers = useRef(new Set<ReturnType<typeof setTimeout>>());
  // The goals the shared hold covers, read when it ends rather than from state.
  const held = useRef(new Set<string>());

  useWhileVisible(
    () => () => {
      if (holdTimer.current != null) clearTimeout(holdTimer.current);
      holdTimer.current = null;
      leaveTimers.current.forEach(clearTimeout);
      leaveTimers.current.clear();
      held.current.clear();
      setPhases(() => NONE);
    },
    [],
  );

  const leaveAll = useCallback(() => {
    holdTimer.current = null;
    const leaving = held.current;
    held.current = new Set();
    if (leaving.size === 0) return;
    traceTick('fade-out started', { count: leaving.size });
    setPhases((current) => {
      const next = new Map(current);
      leaving.forEach((goalId) => {
        if (next.get(goalId) === 'holding') next.set(goalId, 'leaving');
      });
      return next;
    });
    const timer = setTimeout(() => {
      leaveTimers.current.delete(timer);
      traceTick('fade-out finished, cards removed', { count: leaving.size });
      setPhases((current) => {
        let changed = false;
        const next = new Map(current);
        leaving.forEach((goalId) => {
          if (next.get(goalId) !== 'leaving') return;
          next.delete(goalId);
          changed = true;
        });
        return changed ? next : current;
      });
    }, leaveMs);
    leaveTimers.current.add(timer);
  }, [leaveMs]);

  const hold = useCallback(
    (goalId: string) => {
      held.current.add(goalId);
      setPhases((current) => {
        if (current.get(goalId) === 'holding') return current;
        return new Map(current).set(goalId, 'holding');
      });
      if (holdTimer.current != null) clearTimeout(holdTimer.current);
      holdTimer.current = setTimeout(leaveAll, holdMs);
    },
    [holdMs, leaveAll],
  );

  const release = useCallback((goalId: string) => {
    held.current.delete(goalId);
    setPhases((current) => {
      if (!current.has(goalId)) return current;
      const next = new Map(current);
      next.delete(goalId);
      return next;
    });
  }, []);

  const sets = useMemo(() => {
    const settling = new Set<string>();
    const holding = new Set<string>();
    phases.forEach((phase, goalId) => {
      settling.add(goalId);
      if (phase === 'holding') holding.add(goalId);
    });
    return { settling, holding };
  }, [phases]);

  return { ...sets, hold, release };
}
