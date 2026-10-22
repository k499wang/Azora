import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useUserEntitlementQuery } from '../queries/subscriptions/useUserEntitlementQuery';
import { useCurrentRoomQuery } from '../queries/room/useCurrentRoomQuery';
import {
  loadSurveyOfferDismissed,
  setSurveyOfferDismissed,
  type SurveyOfferKind,
} from '../services/preferences/surveyOfferPreference';
import {
  setSurveyOfferForced,
  useSurveyOfferForced,
} from './devSurveyOfferOverride';

const SURVEY_DISCOUNT_URL =
  'https://docs.google.com/forms/d/1wdbzWnXbhdpFZ3HoPcRet5K7EGW9RRtEQqrVYiXHwtc/viewform?edit_requested=true';

export interface SurveyOfferNoticeState {
  /** the offer has somewhere to go and has not been answered */
  visible: boolean;
  /** which offer the bar makes */
  kind: SurveyOfferKind;
  /** opens the survey */
  open: () => void;
  /** answered or closed — retires the offer for good */
  dismiss: () => void;
  /** pushed aside by something the app would rather say; comes back later */
  preempt: () => void;
}

/**
 * The survey Home asks for. A free account is offered the discount survey; a
 * paying Pro member (past any trial, with at least one completed day — every
 * completed day earns a room object) is offered the in-app feedback form. Each
 * is shown once storage has answered and never again once taken or closed.
 */
export function useSurveyOfferNotice(openFeedback: () => void): SurveyOfferNoticeState {
  const user = useAuthStore((state) => state.user);
  const entitlementQuery = useUserEntitlementQuery(user?.id ?? null);
  const entitlement = entitlementQuery.data;
  const isPro = entitlement?.isPro === true;
  const inTrial =
    entitlement?.trialEndsAt != null && Date.parse(entitlement.trialEndsAt) > Date.now();
  const kind: SurveyOfferKind = isPro ? 'feedback' : 'discount';
  const hasCompletedDay = useCurrentRoomQuery(user?.id ?? null).data?.lastEarnedLocalDate != null;
  const eligible = kind === 'discount' || (!inTrial && hasCompletedDay);
  const [dismissed, setDismissed] = useState<Record<SurveyOfferKind, boolean> | null>(null);
  const [preempted, setPreempted] = useState(false);
  const forced = useSurveyOfferForced();

  useEffect(() => {
    let cancelled = false;

    Promise.all([loadSurveyOfferDismissed('discount'), loadSurveyOfferDismissed('feedback')])
      .then(([discount, feedback]) => {
        if (!cancelled) setDismissed({ discount, feedback });
      })
      .catch(() => {
        if (!cancelled) setDismissed({ discount: true, feedback: true });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const retire = useCallback(() => {
    setDismissed((current) => (current == null ? current : { ...current, [kind]: true }));
    setSurveyOfferForced(false);
    void setSurveyOfferDismissed(kind);
  }, [kind]);

  const open = useCallback(() => {
    // Navigation can unmount the notice before its exit animation finishes.
    retire();
    if (kind === 'feedback') openFeedback();
    else void Linking.openURL(SURVEY_DISCOUNT_URL);
  }, [kind, openFeedback, retire]);

  return {
    visible:
      !preempted &&
      (forced ||
        (dismissed?.[kind] === false && eligible && !entitlementQuery.isPending)),
    kind,
    open,
    dismiss: retire,
    preempt: useCallback(() => setPreempted(true), []),
  };
}
