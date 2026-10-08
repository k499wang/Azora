import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PathSeen } from '../../features/plan/domain/pathCelebration';

const planPathSeenKey = (enrollmentId: string) => `plan:path-seen:${enrollmentId}`;

// Held in memory too, so a path that re-renders mid-write never reads the old
// record, and a later visit draws from it without waiting on storage. Null is
// a read that found nothing; a missing entry has not been read yet.
const remembered = new Map<string, PathSeen | null>();
const listeners = new Set<() => void>();

/** The record if it has been read this launch, else undefined. */
export function peekPlanPathSeen(enrollmentId: string): PathSeen | null | undefined {
  return remembered.get(enrollmentId);
}

export function subscribePlanPathSeen(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function remember(enrollmentId: string, seen: PathSeen | null) {
  remembered.set(enrollmentId, seen);
  listeners.forEach((listener) => listener());
}

export async function loadPlanPathSeen(enrollmentId: string): Promise<PathSeen | null> {
  const known = remembered.get(enrollmentId);
  if (known !== undefined) return known;
  const stored = await readStored(enrollmentId);
  // A save made while the read was in flight is the newer record.
  const latest = remembered.get(enrollmentId);
  if (latest !== undefined) return latest;
  remember(enrollmentId, stored);
  return stored;
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
  const known = remembered.get(enrollmentId);
  if (known?.stampedDay === seen.stampedDay && known.wokenDay === seen.wokenDay) return;
  remember(enrollmentId, seen);
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
