import { useCallback, useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { create } from 'zustand';
import { useTodayLocalDate } from '../../hooks/useTodayLocalDate';
import { useAuthStore } from '../../stores/authStore';
import {
  loadCoachingOfferVisits,
  saveCoachingOfferVisits,
} from '../../services/preferences/coachingOfferPreference';
import {
  COACHING_OFFER_DAYS,
  recordCoachingOfferVisit,
  type CoachingOfferVisits,
} from './domain/coachingOfferVisits';

/** dev only: shows the card whatever the account or its visits say */
const useForcedStore = create<{ forced: boolean }>(() => ({ forced: false }));

export function setCoachingOfferForced(forced: boolean): void {
  if (__DEV__) useForcedStore.setState({ forced });
}

/**
 * Counts each day the app is open. It lives above the tabs because the app opens
 * on Routine, so a count made on Home would miss every day Home is not opened.
 */
export function useCountCoachingOfferVisit() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const todayLocalDate = useTodayLocalDate();

  useEffect(() => {
    if (userId == null) return;
    loadCoachingOfferVisits(userId)
      .then((previous) =>
        saveCoachingOfferVisits(userId, recordCoachingOfferVisit(previous, todayLocalDate)),
      )
      .catch(() => {
        // Unreadable storage must not restart the run or bring back a closed card.
      });
  }, [userId, todayLocalDate]);
}

/** Offered to everyone from their third day with the app open. */
export function useCoachingOffer(userId: string | null) {
  const todayLocalDate = useTodayLocalDate();
  const forced = useForcedStore((state) => state.forced);
  // Rereads on return, so a submitted survey retires the card behind it.
  const isFocused = useIsFocused();
  const [visits, setVisits] = useState<CoachingOfferVisits | null>(null);

  useEffect(() => {
    if (userId == null || !isFocused) return;
    let cancelled = false;

    loadCoachingOfferVisits(userId)
      .then((previous) => {
        if (cancelled) return;
        const next = recordCoachingOfferVisit(previous, todayLocalDate);
        setVisits(next);
        void saveCoachingOfferVisits(userId, next);
      })
      .catch(() => {
        // Unreadable storage must not restart the run or bring back a closed card.
      });

    return () => {
      cancelled = true;
    };
  }, [userId, todayLocalDate, isFocused]);

  const dismiss = useCallback(() => {
    setCoachingOfferForced(false);
    if (userId == null || visits == null) return;
    const next = { ...visits, dismissed: true };
    setVisits(next);
    void saveCoachingOfferVisits(userId, next);
  }, [userId, visits]);

  const reached = visits != null && visits.daysVisited >= COACHING_OFFER_DAYS;

  return {
    visible: forced || (reached && visits?.dismissed === false),
    dismiss,
  };
}
