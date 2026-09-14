import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useUserEntitlementQuery } from '../queries/subscriptions/useUserEntitlementQuery';
import {
  loadSurveyOfferDismissed,
  setSurveyOfferDismissed,
} from '../services/preferences/surveyOfferPreference';

const SURVEY_DISCOUNT_URL =
  'https://docs.google.com/forms/d/1wdbzWnXbhdpFZ3HoPcRet5K7EGW9RRtEQqrVYiXHwtc/viewform?edit_requested=true';

export interface SurveyOfferNoticeState {
  /** the offer has somewhere to go and has not been answered */
  visible: boolean;
  /** opens the survey */
  open: () => void;
  /** answered or closed — retires the offer for good */
  dismiss: () => void;
  /** pushed aside by something the app would rather say; comes back later */
  preempt: () => void;
}

/**
 * The discount offer Home makes to anyone still on the free tier: shown once
 * storage has answered, never to a Pro member, and never again once it has
 * been taken or closed.
 */
export function useSurveyOfferNotice(): SurveyOfferNoticeState {
  const user = useAuthStore((state) => state.user);
  const entitlementQuery = useUserEntitlementQuery(user?.id ?? null);
  const isPro = entitlementQuery.data?.isPro === true;
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const [preempted, setPreempted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadSurveyOfferDismissed()
      .then((stored) => {
        if (!cancelled) setDismissed(stored);
      })
      .catch(() => {
        if (!cancelled) setDismissed(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const retire = useCallback(() => {
    setDismissed(true);
    void setSurveyOfferDismissed();
  }, []);

  const open = useCallback(() => {
    void Linking.openURL(SURVEY_DISCOUNT_URL);
  }, []);

  return {
    visible:
      dismissed === false &&
      !preempted &&
      !isPro &&
      !entitlementQuery.isPending,
    open,
    dismiss: retire,
    preempt: useCallback(() => setPreempted(true), []),
  };
}
