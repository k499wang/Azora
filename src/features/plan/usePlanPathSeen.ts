import { useCallback, useEffect, useSyncExternalStore } from 'react';
import {
  loadPlanPathSeen,
  peekPlanPathSeen,
  subscribePlanPathSeen,
} from '../../services/preferences/planPathSeenPreference';
import type { PathSeen } from './domain/pathCelebration';

/**
 * What the plan path last saw, read as soon as the enrollment is known so the
 * path can be drawn in its waiting state from its first frame. Undefined until
 * read; null when this enrollment's path has never been seen.
 */
export function usePlanPathSeen(enrollmentId: string | null): PathSeen | null | undefined {
  const read = useCallback(
    () => (enrollmentId == null ? undefined : peekPlanPathSeen(enrollmentId)),
    [enrollmentId],
  );
  const seen = useSyncExternalStore(subscribePlanPathSeen, read);

  useEffect(() => {
    if (enrollmentId != null && seen === undefined) void loadPlanPathSeen(enrollmentId);
  }, [enrollmentId, seen]);

  return seen;
}
