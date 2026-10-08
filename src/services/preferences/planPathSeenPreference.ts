import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PathSeen } from '../../features/plan/domain/pathCelebration';

const planPathSeenKey = (enrollmentId: string) => `plan:path-seen:${enrollmentId}`;

// Held in memory too, so a path that re-renders mid-write never reads the old record.
const remembered = new Map<string, PathSeen>();

export async function loadPlanPathSeen(enrollmentId: string): Promise<PathSeen | null> {
  const known = remembered.get(enrollmentId);
  if (known != null) return known;
  const stored = await readStored(enrollmentId);
  // A save made while the read was in flight is the newer record.
  return remembered.get(enrollmentId) ?? stored;
}

async function readStored(enrollmentId: string): Promise<PathSeen | null> {
  try {
    const raw = await AsyncStorage.getItem(planPathSeenKey(enrollmentId));
    const parsed = raw == null ? null : (JSON.parse(raw) as Partial<PathSeen>);
    return typeof parsed?.stampedDay === 'number' && typeof parsed.wokenDay === 'number'
      ? { stampedDay: parsed.stampedDay, wokenDay: parsed.wokenDay }
      : null;
  } catch {
    // Unreadable reads as a first view: seeded quietly, never a replay of history.
    return null;
  }
}

export function savePlanPathSeen(enrollmentId: string, seen: PathSeen): void {
  remembered.set(enrollmentId, seen);
  AsyncStorage.setItem(planPathSeenKey(enrollmentId), JSON.stringify(seen)).catch(() => {
    // Nothing to recover; the in-memory record still stops a replay this launch.
  });
}

/** Development only: steps the record back a day so the path celebrates again. */
export async function rewindPlanPathSeen(enrollmentId: string): Promise<void> {
  const seen = await loadPlanPathSeen(enrollmentId);
  if (seen == null) return;
  savePlanPathSeen(enrollmentId, {
    stampedDay: Math.max(0, seen.stampedDay - 1),
    wokenDay: Math.max(0, seen.wokenDay - 1),
  });
}
