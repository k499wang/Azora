import { useSyncExternalStore } from 'react';
import type { PyramidRoom } from './PyramidCanvas';

/**
 * A fake set of finished floors, for the dev lab only.
 *
 * The hotel reads its rooms from the database, and a room takes seven days to
 * finish — so the shape of a full pyramid is a year away from being visible on
 * real data. This lets the lab hand the real screen fabricated floors instead.
 *
 * Guarded exactly like the room's own override: `__DEV__` is checked at the
 * read and again at the write, so a release build can neither set an override
 * nor return one. Either guard alone would do, which is why there are two.
 */

let override: PyramidRoom[] | null = null;
const listeners = new Set<() => void>();

export function setHotelOverride(next: PyramidRoom[] | null): void {
  if (!__DEV__) return;

  override = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function read(): PyramidRoom[] | null {
  return __DEV__ ? override : null;
}

export function useHotelOverride(): PyramidRoom[] | null {
  return useSyncExternalStore(subscribe, read, read);
}
