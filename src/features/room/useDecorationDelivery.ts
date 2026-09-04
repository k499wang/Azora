import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decorationReadyAt } from '../../lib/room/decorationDelivery';

const DELIVERY_KEY_PREFIX = 'room.decoration_delivery';

interface StoredDelivery {
  localDate: string;
  readyAt: number;
}

function deliveryKey(userId: string): string {
  return `${DELIVERY_KEY_PREFIX}:${userId}`;
}

/**
 * When today's earned decoration arrives, as epoch ms, or null if nothing is
 * waiting.
 *
 * The moment a day is finished is recorded here rather than on the server: the
 * only thing it gates is a few hours of anticipation, and the failure it can
 * cause — a reinstall losing the record, so the piece is handed over at once —
 * is the failure worth having. Nobody is owed a wait.
 */
export function useDecorationDelivery(
  userId: string | null,
  localDate: string,
  dailiesComplete: boolean,
): number | null {
  const [readyAt, setReadyAt] = useState<number | null>(null);
  // Nothing is written until the stored record has been read back, or a day
  // finished before the read lands would restart its own clock on every launch.
  const [loaded, setLoaded] = useState(false);
  const [, setArrived] = useState(0);

  useEffect(() => {
    setReadyAt(null);

    if (userId == null) {
      setLoaded(true);
      return;
    }

    let cancelled = false;
    setLoaded(false);

    void (async () => {
      let stored: StoredDelivery | null = null;
      try {
        const raw = await AsyncStorage.getItem(deliveryKey(userId));
        if (raw != null) stored = JSON.parse(raw) as StoredDelivery;
      } catch {
        stored = null;
      }
      if (cancelled) return;

      setReadyAt(stored?.localDate === localDate ? stored.readyAt : null);
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, localDate]);

  useEffect(() => {
    if (userId == null || !loaded || !dailiesComplete || readyAt != null) {
      return;
    }

    const next = decorationReadyAt(new Date());
    setReadyAt(next);

    const record: StoredDelivery = { localDate, readyAt: next };
    // A write that fails costs the wait, not the piece, so it is not worth
    // interrupting the day the user just finished to say so.
    void AsyncStorage.setItem(deliveryKey(userId), JSON.stringify(record)).catch(
      () => {},
    );
  }, [userId, localDate, loaded, dailiesComplete, readyAt]);

  // Everything reading the claim recomputes against the clock as it renders, so
  // the arrival only needs something to render on. Without this the piece lands
  // silently and is found on the next tap rather than while being waited for.
  useEffect(() => {
    if (readyAt == null) return;

    const remaining = readyAt - Date.now();
    if (remaining <= 0) return;

    const timer = setTimeout(() => setArrived((count) => count + 1), remaining);
    return () => clearTimeout(timer);
  }, [readyAt]);

  return readyAt;
}
