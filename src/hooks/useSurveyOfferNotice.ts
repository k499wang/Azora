import { useCallback, useEffect, useState } from 'react';
import { recordCoachingOfferVisit } from '../features/coaching/domain/coachingOfferVisits';
import { loadCoachingOfferVisits } from '../services/preferences/coachingOfferPreference';
import {
  loadSurveyOfferDismissed,
  setSurveyOfferDismissed,
} from '../services/preferences/surveyOfferPreference';
import { useAuthStore } from '../stores/authStore';
import {
  setSurveyOfferForced,
  useSurveyOfferForced,
} from './devSurveyOfferOverride';
import { useTodayLocalDate } from './useTodayLocalDate';

/** Someone needs a day with the app before they can say how it is going. */
const FEEDBACK_OFFER_DAYS = 2;

export interface SurveyOfferNoticeState {
  /** the offer has not been answered */
  visible: boolean;
  /** opens the feedback form */
  open: () => void;
  /** answered or closed — retires the offer for good */
  dismiss: () => void;
  /** pushed aside by something the app would rather say; comes back later */
  preempt: () => void;
}

/**
 * The feedback form Routine asks for, offered to everyone from their second day
 * with the app open. It is never shown again once taken or closed.
 */
export function useSurveyOfferNotice(openFeedback: () => void): SurveyOfferNoticeState {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const todayLocalDate = useTodayLocalDate();
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const [dayReached, setDayReached] = useState(false);
  const [preempted, setPreempted] = useState(false);
  const forced = useSurveyOfferForced();

  useEffect(() => {
    if (userId == null) return;
    let cancelled = false;

    // Today is applied here because the app's own count may not be saved yet.
    Promise.all([loadSurveyOfferDismissed(), loadCoachingOfferVisits(userId)])
      .then(([stored, visits]) => {
        if (cancelled) return;
        setDismissed(stored);
        setDayReached(
          recordCoachingOfferVisit(visits, todayLocalDate).daysVisited >= FEEDBACK_OFFER_DAYS,
        );
      })
      .catch(() => {
        // Unreadable storage must not ask someone who may already have answered.
      });

    return () => {
      cancelled = true;
    };
  }, [userId, todayLocalDate]);

  const retire = useCallback(() => {
    setDismissed(true);
    setSurveyOfferForced(false);
    void setSurveyOfferDismissed();
  }, []);

  const open = useCallback(() => {
    // Navigation can unmount the notice before its exit animation finishes.
    retire();
    openFeedback();
  }, [openFeedback, retire]);

  return {
    visible: !preempted && (forced || (dayReached && dismissed === false)),
    open,
    dismiss: retire,
    preempt: useCallback(() => setPreempted(true), []),
  };
}
