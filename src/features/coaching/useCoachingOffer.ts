import { useCallback, useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { create } from 'zustand';
import { useTodayLocalDate } from '../../hooks/useTodayLocalDate';
import { useUserEntitlementQuery } from '../../queries/subscriptions/useUserEntitlementQuery';
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

/** Offered to paying subscribers, never during a trial, from their third day in a row. */
export function useCoachingOffer(userId: string | null) {
  const todayLocalDate = useTodayLocalDate();
  const entitlement = useUserEntitlementQuery(userId).data;
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

  const isPaying = entitlement?.isPro === true && entitlement.trialEndsAt == null;
  const reached = visits != null && visits.consecutiveDays >= COACHING_OFFER_DAYS;

  return {
    visible: forced || (isPaying && reached && visits?.dismissed === false),
    dismiss,
  };
}
