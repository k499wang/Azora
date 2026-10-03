import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
 * A card that is going into the drawer fades out in its own slot during the
 * leaving phase, and only then does the gap close, so a card never fades out
 * while the next one slides in on top of it.
 */
export function useSettlingGoals({ holdMs, leaveMs }: Options) {
  const [phases, setPhases] = useState<ReadonlyMap<string, Phase>>(NONE);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (holdTimer.current != null) clearTimeout(holdTimer.current);
      if (leaveTimer.current != null) clearTimeout(leaveTimer.current);
    },
    [],
  );

  const leaveAll = useCallback(() => {
    holdTimer.current = null;
    setPhases((current) => {
      if (current.size === 0) return current;
      const next = new Map(current);
      next.forEach((_, goalId) => next.set(goalId, 'leaving'));
      return next;
    });
    if (leaveTimer.current != null) clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => {
      leaveTimer.current = null;
      setPhases((current) => {
        let changed = false;
        const next = new Map(current);
        next.forEach((phase, goalId) => {
          if (phase !== 'leaving') return;
          next.delete(goalId);
          changed = true;
        });
        return changed ? next : current;
      });
    }, leaveMs);
  }, [leaveMs]);

  const hold = useCallback(
    (goalId: string) => {
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
