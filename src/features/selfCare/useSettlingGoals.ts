import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Phase = 'holding' | 'leaving';

const NONE: ReadonlyMap<string, Phase> = new Map();

interface Options {
  /** how long a ticked goal stays put, showing its tick */
  holdMs: number;
  /** how long it then has to fade out where it stands, if it is being filed */
  leaveMs: number;
}

/**
 * Goals just ticked, still settling where they were ticked.
 *
 * Each one holds its place for `holdMs` and then spends `leaveMs` leaving
 * before the list may move it. A card that is going into the drawer fades out
 * in its own slot during that second phase, and only then does the gap close,
 * so a card never fades out while the next one slides in on top of it.
 */
export function useSettlingGoals({ holdMs, leaveMs }: Options) {
  const [phases, setPhases] = useState<ReadonlyMap<string, Phase>>(NONE);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const set = useCallback((goalId: string, phase: Phase | null) => {
    setPhases((current) => {
      if ((current.get(goalId) ?? null) === phase) return current;
      const next = new Map(current);
      if (phase == null) next.delete(goalId);
      else next.set(goalId, phase);
      return next;
    });
  }, []);

  const schedule = useCallback((goalId: string, ms: number, then: () => void) => {
    clearTimeout(timers.current.get(goalId));
    timers.current.set(goalId, setTimeout(then, ms));
  }, []);

  const release = useCallback(
    (goalId: string) => {
      clearTimeout(timers.current.get(goalId));
      timers.current.delete(goalId);
      set(goalId, null);
    },
    [set],
  );

  const hold = useCallback(
    (goalId: string) => {
      set(goalId, 'holding');
      schedule(goalId, holdMs, () => {
        set(goalId, 'leaving');
        schedule(goalId, leaveMs, () => release(goalId));
      });
    },
    [holdMs, leaveMs, release, schedule, set],
  );

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
