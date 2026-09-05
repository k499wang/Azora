import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'room.day_earned';

interface Earned {
  userId: string;
  localDate: string;
}

/**
 * Shared by every mounted copy of the hook — Home and the decorate screen both
 * hold one. Without it the second screen re-reads storage and spends its first
 * frames answering "not earned" to a day that is.
 */
let cached: Earned | null = null;
let loadedFor: string | null = null;

function storageKey(userId: string): string {
  return `${KEY_PREFIX}:${userId}`;
}

/**
 * The day the user last cleared both lists.
 *
 * Sessions cannot be un-finished, so the dailies alone never needed a memory.
 * To-dos can: unticking one, or adding a new one at nine in the evening, would
 * otherwise take back a decoration that has already been earned and shown. The
 * date is written the first time the day comes up complete and read back for
 * the rest of that day, so the reward only ever moves in one direction.
 */
export function useDayEarnedLatch({
  userId,
  todayLocalDate,
  liveCompleted,
  settled,
}: {
  userId: string | null;
  todayLocalDate: string;
  liveCompleted: boolean;
  /**
   * False while a write is still in flight. Ticking a to-do updates the cache
   * before the server answers, and a toggle that fails rolls back — so the
   * memory waits for the confirmation the screen does not.
   */
  settled: boolean;
}): boolean {
  const [earned, setEarned] = useState<Earned | null>(cached);

  useEffect(() => {
    if (userId == null || loadedFor === userId) return;

    let cancelled = false;
    AsyncStorage.getItem(storageKey(userId))
      .then((stored) => {
        loadedFor = userId;
        // Never over an entry this run already wrote: that one is today's.
        if (stored == null || cached?.userId === userId) return;
        cached = { userId, localDate: stored };
        if (!cancelled) setEarned(cached);
      })
      .catch(() => {
        // Fail open: without the memory the live rule still answers.
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const latched =
    earned?.userId === userId && earned.localDate === todayLocalDate;

  useEffect(() => {
    if (userId == null || !liveCompleted || !settled || latched) return;

    cached = { userId, localDate: todayLocalDate };
    setEarned(cached);
    AsyncStorage.setItem(storageKey(userId), todayLocalDate).catch(() => {});
  }, [latched, liveCompleted, settled, todayLocalDate, userId]);

  // The live rule answers on the frame it becomes true, rather than a frame
  // later when the effect above has run.
  return latched || liveCompleted;
}
